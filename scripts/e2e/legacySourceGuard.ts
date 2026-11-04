import { z } from 'zod';

import { legacyManifestSchema } from './legacy';

import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const sourcePath = z
  .string()
  .refine(
    (file) =>
      file.startsWith('e2e/') &&
      file.endsWith('.spec.ts') &&
      !/[\\:]/u.test(file) &&
      !file.includes('\0') &&
      file
        .split('/')
        .every((part) => part !== '' && part !== '.' && part !== '..'),
    '旧app specの相対pathが不正です。',
  );
const snapshotSchema = z.strictObject({
  root: z.string().min(1),
  files: z
    .array(
      z.strictObject({
        file: sourcePath,
        sha256: z.string().regex(/^[a-f0-9]{64}$/u),
      }),
    )
    .min(1)
    .superRefine((files, context) => {
      const paths = files.map((entry) => entry.file);
      if (new Set(paths).size !== paths.length)
        context.addIssue({
          code: 'custom',
          message: '旧spec集合が重複しています。',
        });
    }),
});
type LegacySourceSnapshot = z.infer<typeof snapshotSchema>;

const readSourceHash = (root: string, file: string): string => {
  const target = resolve(root, sourcePath.parse(file));
  const path = relative(root, target);
  if (!path || isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`))
    throw new Error('旧specはworktree内に限定してください。');
  // ファイルだけでなく途中directoryのsymlink/junctionも拒否する。
  for (let current = target; current !== root; current = dirname(current)) {
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || realpathSync(current) !== current)
      throw new Error('旧specのphysical pathが不正です。');
    if (current === target && !stat.isFile())
      throw new Error('旧specの実体がファイルではありません。');
  }
  // UTF-8復号を挟まず、実行対象ファイルの全bytesを検査する。
  return createHash('sha256').update(readFileSync(target)).digest('hex');
};

/** 旧app登録のspec全体を実読し、discoveryと実行の間の差替え検査に使う。 */
export const captureLegacySources = (
  root: string,
  input: unknown,
): LegacySourceSnapshot => {
  const legacy = legacyManifestSchema.parse(input);
  const physicalRoot = realpathSync(root);
  const files = [
    ...new Set(
      legacy.tests
        .filter((entry) => entry.profile === 'app')
        .map((entry) => entry.file),
    ),
  ].sort();
  const snapshot = snapshotSchema.parse({
    root: physicalRoot,
    files: files.map((file) => ({
      file,
      sha256: readSourceHash(physicalRoot, file),
    })),
  });
  for (const entry of snapshot.files) Object.freeze(entry);
  Object.freeze(snapshot.files);
  return Object.freeze(snapshot);
};

/** 保存済fingerprintを流用せず、同一worktreeの実bytesを再照合する。 */
export const assertLegacySources = (
  root: string,
  input: LegacySourceSnapshot,
): void => {
  const snapshot = snapshotSchema.parse(input);
  const physicalRoot = realpathSync(root);
  if (physicalRoot !== snapshot.root)
    throw new Error('旧spec snapshotのworktreeが一致しません。');
  for (const entry of snapshot.files)
    if (readSourceHash(physicalRoot, entry.file) !== entry.sha256)
      throw new Error(`旧specの内容が実行中に変更されました: ${entry.file}`);
};

export type { LegacySourceSnapshot };
