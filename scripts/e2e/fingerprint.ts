import { z } from 'zod';

import { normalizeNextEnv } from './fingerprintNextEnv';
import {
  assertInputPath,
  comparePaths,
  inputStamp,
  readInputStat,
  scanInputFiles,
} from './fingerprintPaths';

import { createHash } from 'node:crypto';
import { open } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const HASH = z.string().regex(/^[a-f0-9]{64}$/);
const fileSchema = z.strictObject({
  path: z
    .string()
    .min(1)
    .refine((value) => {
      try {
        assertInputPath(value);
        return true;
      } catch {
        return false;
      }
    }),
  kind: z.enum(['raw', 'next-env-template']),
  size: z.number().int().nonnegative().safe(),
  sha256: HASH,
});
export const inputFingerprintSchema = z.strictObject({
  schemaVersion: z.literal(1),
  algorithm: z.literal('sha256'),
  root: z.string().min(1),
  rules: z.literal('fixed-input-scope-v1-next16-template-v1'),
  files: z.array(fileSchema),
  digest: HASH,
});
export const changesSchema = z.strictObject({
  added: z.array(z.string()),
  removed: z.array(z.string()),
  changed: z.array(z.string()),
});
const hash = (value: Buffer | string) =>
  createHash('sha256').update(value).digest('hex');
const digestFiles = (files: InputFingerprint['files']) =>
  hash(JSON.stringify(files));
// Gitを呼ばずfilesystemだけを読むため、GIT_*は参照しない。

const readFileFingerprint = async (
  root: string,
  path: string,
  stamp: string,
) => {
  const absolute = join(root, path);
  const before = await readInputStat(absolute);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    inputStamp(before) !== stamp
  )
    throw new Error(`採取中に入力が変化しました: ${path}`);
  const handle = await open(absolute, 'r');
  try {
    if (inputStamp(await handle.stat({ bigint: true })) !== stamp)
      throw new Error(`採取中に入力が置換されました: ${path}`);
    let bytes: Buffer | undefined;
    const hasher = createHash('sha256');
    let size = 0;
    if (path === 'next-env.d.ts') {
      if (before.size > BigInt(4096))
        throw new Error('next-env.d.tsが既知templateの長さを超えています');
      bytes = normalizeNextEnv(await handle.readFile());
      hasher.update(bytes);
      size = bytes.length;
    } else {
      const buffer = Buffer.alloc(64 * 1024);
      for (;;) {
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
        if (!bytesRead) break;
        hasher.update(buffer.subarray(0, bytesRead));
        size += bytesRead;
      }
    }
    if (
      inputStamp(await handle.stat({ bigint: true })) !== stamp ||
      inputStamp(await readInputStat(absolute)) !== stamp ||
      (path !== 'next-env.d.ts' && BigInt(size) !== before.size)
    )
      throw new Error(`採取中に入力が変化しました: ${path}`);
    return fileSchema.parse({
      path,
      kind: bytes ? 'next-env-template' : 'raw',
      size,
      sha256: hasher.digest('hex'),
    });
  } finally {
    await handle.close();
  }
};

/** 開始・中間・終了checkpoint用。checkpoint間の一時変更を監視するものではない。 */
export const captureInputs = async (
  root: string,
): Promise<InputFingerprint> => {
  const physicalRoot = resolve(root);
  const before = await scanInputFiles(physicalRoot);
  const files: InputFingerprint['files'] = [];
  for (const [path, stamp] of before)
    files.push(await readFileFingerprint(physicalRoot, path, stamp));
  if (!before.has('next-env.d.ts')) {
    const bytes = normalizeNextEnv();
    files.push({
      path: 'next-env.d.ts',
      kind: 'next-env-template',
      size: bytes.length,
      sha256: hash(bytes),
    });
  }
  const after = await scanInputFiles(physicalRoot);
  if (
    before.size !== after.size ||
    [...before].some(([path, stamp]) => after.get(path) !== stamp)
  )
    throw new Error('採取中に入力集合または内容が変化しました');
  files.sort((left, right) => comparePaths(left.path, right.path));
  return inputFingerprintSchema.parse({
    schemaVersion: 1,
    algorithm: 'sha256',
    root: physicalRoot,
    rules: 'fixed-input-scope-v1-next16-template-v1',
    files,
    digest: digestFiles(files),
  });
};

const validateFingerprint = (value: InputFingerprint) => {
  const parsed = inputFingerprintSchema.parse(value);
  const folded = new Set<string>();
  let previous = '';
  for (const file of parsed.files) {
    const key = file.path.normalize('NFC').toLowerCase();
    if (folded.has(key) || comparePaths(previous, file.path) >= 0)
      throw new Error('fingerprint入力pathの重複または順序が不正です');
    previous = file.path;
    folded.add(key);
    if ((file.path === 'next-env.d.ts') !== (file.kind === 'next-env-template'))
      throw new Error('fingerprintの正規化規則が不正です');
  }
  if (digestFiles(parsed.files) !== parsed.digest)
    throw new Error('fingerprint digestが一致しません');
  return parsed;
};

/** 内容を含めず、追加・削除・変更された安全な相対pathだけを返す。renameは削除＋追加。 */
export const compareInputs = (
  before: InputFingerprint,
  after: InputFingerprint,
): InputChanges => {
  const left = validateFingerprint(before);
  const right = validateFingerprint(after);
  if (left.root !== right.root || left.rules !== right.rules)
    throw new Error('異なるrootまたは規則のfingerprintは比較できません');
  const oldFiles = new Map(left.files.map((file) => [file.path, file]));
  const newFiles = new Map(right.files.map((file) => [file.path, file]));
  return {
    added: right.files
      .filter((file) => !oldFiles.has(file.path))
      .map((file) => file.path),
    removed: left.files
      .filter((file) => !newFiles.has(file.path))
      .map((file) => file.path),
    changed: right.files
      .filter((file) => {
        const old = oldFiles.get(file.path);
        return (
          old &&
          (old.sha256 !== file.sha256 ||
            old.size !== file.size ||
            old.kind !== file.kind)
        );
      })
      .map((file) => file.path),
  };
};

type InputFingerprint = z.infer<typeof inputFingerprintSchema>;
type InputChanges = z.infer<typeof changesSchema>;
export type { InputFingerprint, InputChanges };
