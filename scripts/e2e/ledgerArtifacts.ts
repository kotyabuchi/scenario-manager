import { isNil } from 'ramda';

import { environmentSystemCodeSchema } from './environmentSchema';

import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { BigIntStats } from 'node:fs';
import type { z } from 'zod';

/** 台帳の固定出力を扱うときも、既存のsymlink/junctionでルート外へ出ない。 */
const artifactPath = (root: string, file: string) => {
  const physicalRoot = realpathSync(root);
  const target = resolve(physicalRoot, file);
  const check = (candidate: string) => {
    const path = relative(physicalRoot, candidate);
    if (
      !path ||
      isAbsolute(path) ||
      path === '..' ||
      path.startsWith(`..${sep}`)
    )
      throw new Error(
        '台帳artifactはプロジェクト内のファイルに限定してください',
      );
  };
  check(target);
  let ancestor = target;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  if (ancestor !== physicalRoot) check(realpathSync(ancestor));
  return target;
};

/** 不在と読込失敗を区別し、通常検査ではファイルを変更しない。 */
export const readArtifact = (
  root: string,
  file: string,
): string | undefined => {
  const target = artifactPath(root, file);
  try {
    return readFileSync(target, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return undefined;
    throw error;
  }
};

type ArtifactOperation =
  | 'path'
  | 'mkdir'
  | 'create'
  | 'guard-open'
  | 'guard-close'
  | 'identity'
  | 'write'
  | 'close'
  | 'rename'
  | 'remove';
type ArtifactFailure = {
  operation: ArtifactOperation;
  code: z.infer<typeof environmentSystemCodeSchema>;
};

const artifactFailure = (
  operation: ArtifactOperation,
  error: unknown,
): ArtifactFailure => {
  let code: unknown;
  try {
    if (error instanceof Error)
      code = Object.getOwnPropertyDescriptor(error, 'code')?.value;
  } catch {
    // 例外のgetter等を実行せずunknownとする。
  }
  const parsed = environmentSystemCodeSchema.safeParse(code);
  return { operation, code: parsed.success ? parsed.data : 'unknown' };
};

/** 生の例外・pathを公開せず保存とcleanupの失敗を区別する。 */
const MANIFEST_RENAME_DELAYS_MS = [25, 50, 100, 200, 400] as const;

/** POSIXではFIFOやsymlinkへの差替えでopenが停止しない条件を必須とする。 */
const safeReadFlags = () => {
  if (process.platform === 'win32') return 'r';
  const { O_RDONLY, O_NONBLOCK, O_NOFOLLOW } = constants;
  if (
    typeof O_NONBLOCK !== 'number' ||
    O_NONBLOCK === 0 ||
    typeof O_NOFOLLOW !== 'number' ||
    O_NOFOLLOW === 0
  )
    throw new Error('safe read flags unavailable');
  return O_RDONLY | O_NONBLOCK | O_NOFOLLOW;
};
const MAX_RETRY_TARGET_BYTES = 1_048_576;

const statIdentity = (stat: BigIntStats) => ({
  dev: stat.dev,
  ino: stat.ino,
  size: stat.size,
  mtime: stat.mtimeNs,
  ctime: stat.ctimeNs,
});

/** retry間の他者変更を検出し、不明なら上書きしない。 */
const captureRetryTarget = (target: string) => {
  let before: BigIntStats;
  try {
    before = lstatSync(target, { bigint: true });
  } catch (error) {
    if (artifactFailure('identity', error).code === 'ENOENT') return null;
    throw error;
  }
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== BigInt(1) ||
    before.size > BigInt(MAX_RETRY_TARGET_BYTES)
  )
    throw new Error('target identity unavailable');
  const fd = openSync(target, safeReadFlags());
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (
      !opened.isFile() ||
      opened.nlink !== BigInt(1) ||
      !isDeepStrictEqual(statIdentity(before), statIdentity(opened))
    )
      throw new Error('target identity changed');
    const buffer = Buffer.alloc(Number(before.size) + 1);
    let length = 0;
    while (length < buffer.length) {
      const read = readSync(fd, buffer, length, buffer.length - length, length);
      if (read === 0) break;
      length += read;
    }
    if (length !== Number(before.size)) throw new Error('target size changed');
    const bytes = buffer.subarray(0, length);
    const after = fstatSync(fd, { bigint: true });
    const pathAfter = lstatSync(target, { bigint: true });
    if (
      pathAfter.isSymbolicLink() ||
      pathAfter.nlink !== BigInt(1) ||
      !isDeepStrictEqual(statIdentity(before), statIdentity(after)) ||
      !isDeepStrictEqual(statIdentity(before), statIdentity(pathAfter))
    )
      throw new Error('target identity changed');
    return {
      ...statIdentity(before),
      hash: createHash('sha256').update(bytes).digest('hex'),
    };
  } finally {
    closeSync(fd);
  }
};

const captureRetryParent = (target: string) => {
  const parent = dirname(target);
  const stat = lstatSync(parent, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error('parent identity unavailable');
  return { realpath: realpathSync(parent), dev: stat.dev, ino: stat.ino };
};

export class ArtifactWriteError extends Error {
  readonly code: ArtifactFailure['code'];
  constructor(
    readonly primary: ArtifactFailure | null,
    readonly cleanup: readonly ArtifactFailure[],
    readonly published = false,
  ) {
    super('artifactの保存に失敗しました。');
    this.code = primary?.code ?? cleanup[0]?.code ?? 'unknown';
  }
}

/** bootstrap・明示的更新からのみ呼び、既存artifactを原子的に置換する。 */
export const writeArtifact = (
  root: string,
  file: string,
  contents: string,
  options?: { allowWindowsManifestRenameRetry?: boolean },
) => {
  let operation: ArtifactOperation = 'path';
  let primary: ArtifactFailure | null = null;
  const cleanup: ArtifactFailure[] = [];
  let target: string | undefined;
  let temporary: string | undefined;
  let writer: number | undefined;
  let guard: number | undefined;
  let identity: { dev: bigint; ino: bigint } | undefined;
  let created = false;
  let guardVerified = false;
  let cleanupAttempted = false;
  let published = false;
  const assertPinned = (descriptor: number | undefined) => {
    if (isNil(temporary) || isNil(identity) || isNil(descriptor))
      throw new Error('identity unavailable');
    const pinned = fstatSync(descriptor, { bigint: true });
    const current = lstatSync(temporary, { bigint: true });
    if (
      !pinned.isFile() ||
      pinned.nlink !== BigInt(1) ||
      !current.isFile() ||
      current.isSymbolicLink() ||
      current.nlink !== BigInt(1) ||
      pinned.dev !== identity.dev ||
      pinned.ino !== identity.ino ||
      current.dev !== identity.dev ||
      current.ino !== identity.ino
    )
      throw new Error('identity mismatch');
  };
  const cleanupTemporary = (descriptor: number | undefined) => {
    if (!created || published) return;
    cleanupAttempted = true;
    let stage: ArtifactOperation = 'identity';
    try {
      assertPinned(descriptor);
      stage = 'remove';
      if (!isNil(temporary)) rmSync(temporary);
    } catch (error) {
      cleanup.push(artifactFailure(stage, error));
    }
  };
  try {
    target = artifactPath(root, file);
    operation = 'mkdir';
    mkdirSync(dirname(target), { recursive: true });
    temporary = `${target}.${randomUUID()}.tmp`;
    operation = 'create';
    writer = openSync(temporary, 'wx');
    created = true;
    operation = 'identity';
    const initial = fstatSync(writer, { bigint: true });
    if (
      !initial.isFile() ||
      initial.nlink !== BigInt(1) ||
      initial.ino === BigInt(0)
    )
      throw new Error('temporary identity unavailable');
    identity = { dev: initial.dev, ino: initial.ino };
    operation = 'write';
    writeFileSync(writer, contents, 'utf8');
    operation = 'guard-open';
    guard = openSync(temporary, safeReadFlags());
    operation = 'identity';
    assertPinned(guard);
    assertPinned(writer);
    guardVerified = true;
  } catch (error) {
    primary = artifactFailure(operation, error);
  } finally {
    // guardが未確認ならwriterを閉じる前だけ所有tmpを後始末できる。
    if (!guardVerified) cleanupTemporary(writer);
    if (!isNil(writer)) {
      try {
        closeSync(writer);
      } catch (error) {
        cleanup.push(artifactFailure('close', error));
      }
    }
  }
  if (
    isNil(primary) &&
    cleanup.length === 0 &&
    guardVerified &&
    !isNil(temporary) &&
    !isNil(target)
  ) {
    operation = 'identity';
    try {
      assertPinned(guard);
      const shouldRetry =
        process.platform === 'win32' &&
        options?.allowWindowsManifestRenameRetry === true;
      let snapshot: {
        parent: ReturnType<typeof captureRetryParent>;
        target: ReturnType<typeof captureRetryTarget>;
      } | null = null;
      if (shouldRetry) {
        try {
          snapshot = {
            parent: captureRetryParent(target),
            target: captureRetryTarget(target),
          };
        } catch {
          /* 確認不能なら従来の初回renameだけを行い、retryしない。 */
        }
      }
      let previousError: unknown;
      for (let attempt = 0; ; attempt += 1) {
        if (attempt > 0 && !isNil(snapshot)) {
          try {
            assertPinned(guard);
            if (
              !isDeepStrictEqual(snapshot.parent, captureRetryParent(target)) ||
              !isDeepStrictEqual(snapshot.target, captureRetryTarget(target))
            )
              throw new Error('retry ownership changed');
          } catch {
            throw previousError;
          }
        }
        operation = 'rename';
        try {
          renameSync(temporary, target);
          published = true;
          break;
        } catch (error) {
          const code = artifactFailure('rename', error).code;
          const delay = MANIFEST_RENAME_DELAYS_MS[attempt];
          if (
            isNil(snapshot) ||
            (code !== 'EPERM' && code !== 'EBUSY') ||
            isNil(delay)
          )
            throw error;
          previousError = error;
          // 同期APIのため最大775msはevent loopとabort通知も待機する。
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        }
      }
    } catch (error) {
      primary = artifactFailure(operation, error);
    }
  }
  if (!cleanupAttempted) cleanupTemporary(guardVerified ? guard : undefined);
  if (!isNil(guard)) {
    try {
      closeSync(guard);
    } catch (error) {
      cleanup.push(artifactFailure('guard-close', error));
    }
  }
  if (!isNil(primary) || cleanup.length > 0)
    throw new ArtifactWriteError(primary, cleanup, published);
};

/** JSONの欠落・破損には対象名を付けて失敗させる。 */
export const parseArtifact = (
  contents: string | undefined,
  file: string,
): unknown => {
  if (isNil(contents)) throw new Error(`${file}: 必須artifactがありません`);
  try {
    return JSON.parse(contents);
  } catch (cause) {
    throw new Error(`${file}: JSONを解析できません`, { cause });
  }
};
