import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { TextDecoder } from 'node:util';

const MAX_BYTES = 1024 * 1024;
const MAX_LINES = 20_000;
const MAX_LINE_LENGTH = 4096;
const MAX_CANDIDATES = 20;
const SAFE_PATH =
  /^scripts\/e2e\/(?!fixtures\/)(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.test\.ts$/u;
const SIGNALS = new Set(['SIGTERM', 'SIGKILL', 'SIGINT', 'SIGHUP']);

type CloseResult = { exitCode: number | null; signal: string | null };
type Coverage = 'complete' | 'truncated' | 'unknown';

/** ログ由来の候補だけを固定集合へ照合する。結果は失敗テストの証明ではない。 */
export const parseQualityToolsCandidates = (
  text: string,
  trackedPaths: readonly string[],
): { candidatePaths: string[]; coverage: Coverage } => {
  const allowed = new Set(
    trackedPaths.filter(
      (path) =>
        SAFE_PATH.test(path) &&
        !path.split('/').some((part) => part === '.' || part === '..'),
    ),
  );
  const candidates = new Set<string>();
  const lines = text.split('\n');
  let coverage: Coverage = lines.length > MAX_LINES ? 'truncated' : 'complete';
  for (const line of lines.slice(0, MAX_LINES)) {
    if (line.length > MAX_LINE_LENGTH) {
      coverage = 'truncated';
      continue;
    }
    // 制御文字やANSIを持つ行は、変換して誤一致させずに無視する。
    const value = line.endsWith('\r') ? line.slice(0, -1) : line;
    if (
      [...value].some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
      })
    ) {
      coverage = 'truncated';
      continue;
    }
    const match =
      /^\s*FAIL\s+(?:\|e2e-tools\|\s+)?(scripts\/e2e\/[A-Za-z0-9_./-]+\.test\.ts)(?:\s|$)/u.exec(
        value,
      );
    const path = match?.[1];
    if (path && allowed.has(path)) candidates.add(path);
  }
  const sorted = [...candidates].sort();
  if (sorted.length > MAX_CANDIDATES) coverage = 'truncated';
  return { candidatePaths: sorted.slice(0, MAX_CANDIDATES), coverage };
};

const sameIdentity = (
  a: { dev: number; ino: number; size: number; mtimeMs: number },
  b: { dev: number; ino: number; size: number; mtimeMs: number },
) =>
  a.dev === b.dev &&
  a.ino === b.ino &&
  a.size === b.size &&
  a.mtimeMs === b.mtimeMs;

type DirectoryIdentity = { dev: number; ino: number };

/** 子command開始前の所有directoryを識別する。識別不能時は診断のみを無効化する。 */
export const captureQualityToolsDirectory = async (
  directory: string,
): Promise<DirectoryIdentity | undefined> => {
  try {
    if (
      process.platform !== 'linux' ||
      !isAbsolute(directory) ||
      !constants.O_NOFOLLOW ||
      !constants.O_NONBLOCK
    )
      return undefined;
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink() || !info.ino)
      return undefined;
    return { dev: info.dev, ino: info.ino };
  } catch {
    return undefined;
  }
};

/** 所有directoryの固定logのみ読み、任意のlog文やerrorを公開しない。 */
export const qualityToolsFailureSummary = async (
  directory: string,
  trackedPaths: readonly string[],
  close: CloseResult | undefined,
  owner: DirectoryIdentity | undefined,
) => {
  let parsed: { candidatePaths: string[]; coverage: Coverage } = {
    candidatePaths: [],
    coverage: 'unknown',
  };
  try {
    if (
      process.platform !== 'linux' ||
      !owner ||
      !constants.O_NOFOLLOW ||
      !constants.O_NONBLOCK
    )
      throw new Error('unsupported');
    const dirBefore = await lstat(directory);
    if (dirBefore.dev !== owner.dev || dirBefore.ino !== owner.ino)
      throw new Error('changed directory');
    if (
      !dirBefore.isDirectory() ||
      dirBefore.isSymbolicLink() ||
      (await realpath(directory)) !== directory
    )
      throw new Error('invalid directory');
    const path = join(directory, 'test-e2e-tools.log');
    const before = await lstat(path);
    if (
      !before.isFile() ||
      before.isSymbolicLink() ||
      before.nlink !== 1 ||
      !before.ino ||
      (await realpath(path)) !== path ||
      before.size > MAX_BYTES
    )
      throw new Error('invalid log');
    const file = await open(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    let candidate: typeof parsed | undefined;
    try {
      const opened = await file.stat();
      if (
        !opened.isFile() ||
        opened.nlink !== 1 ||
        !sameIdentity(before, opened)
      )
        throw new Error('changed log');
      const bytes = Buffer.alloc(MAX_BYTES + 1);
      let offset = 0;
      while (offset < bytes.length) {
        const result = await file.read(
          bytes,
          offset,
          bytes.length - offset,
          offset,
        );
        if (result.bytesRead === 0) break;
        offset += result.bytesRead;
      }
      const finalOpened = await file.stat();
      if (
        offset !== opened.size ||
        offset > MAX_BYTES ||
        finalOpened.nlink !== 1 ||
        !finalOpened.isFile() ||
        !sameIdentity(opened, finalOpened)
      )
        throw new Error('changed log');
      const after = await lstat(path);
      const dirAfter = await lstat(directory);
      if (
        after.nlink !== 1 ||
        !sameIdentity(before, after) ||
        !sameIdentity(dirBefore, dirAfter) ||
        dirAfter.dev !== owner.dev ||
        dirAfter.ino !== owner.ino
      )
        throw new Error('changed path');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(
        bytes.subarray(0, offset),
      );
      const lastNewline = text.lastIndexOf('\n');
      const completeLines = text.endsWith('\n')
        ? text
        : text.slice(0, lastNewline + 1);
      candidate = parseQualityToolsCandidates(completeLines, trackedPaths);
      if (completeLines.length !== text.length)
        candidate.coverage = 'truncated';
    } finally {
      await file.close();
    }
    if (candidate) parsed = candidate;
  } catch {
    // 不確実なlogを失敗なしとは扱わない。
  }
  const exitCode = close?.exitCode;
  const signal = close?.signal;
  return {
    kind: 'e2e-tools-failure-candidates',
    evidence: 'log-derived-candidate',
    ...parsed,
    exitCode:
      typeof exitCode === 'number' &&
      Number.isInteger(exitCode) &&
      exitCode >= 0 &&
      exitCode <= 255
        ? exitCode
        : 'unknown',
    signal:
      typeof signal === 'string' && SIGNALS.has(signal) ? signal : 'unknown',
    code: 'unknown',
  };
};
