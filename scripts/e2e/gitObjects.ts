import { z } from 'zod';

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { devNull } from 'node:os';

export const gitShaSchema = z
  .string()
  .regex(/^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/)
  .transform((value) => value.toLowerCase());
export const gitObjectFormatSchema = z.enum(['sha1', 'sha256']);
export const gitFileModeSchema = z.enum([
  '100644',
  '100755',
  '120000',
  '160000',
]);
export type GitObjectFormat = z.infer<typeof gitObjectFormatSchema>;
export const MAX_GIT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_GIT_OUTPUT_BYTES = 16 * 1024 * 1024;
const MAX_GIT_BLOB_SET_BYTES = 128 * 1024 * 1024;

/** Git環境変数・外部処理・置換履歴を信頼せず、読み取り専用の出力だけを返す。 */
export const gitRead = (
  root: string,
  args: string[],
  input?: string,
  maxBuffer = MAX_GIT_OUTPUT_BYTES,
  options?: { rejectStderr: true },
) => {
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (/^GIT_/i.test(key)) Reflect.deleteProperty(env, key);
  env.GIT_NO_LAZY_FETCH = '1';
  env.GIT_GRAFT_FILE = devNull;
  const result = spawnSync(
    'git',
    [
      '--no-replace-objects',
      '--no-optional-locks',
      '-c',
      'core.fsmonitor=false',
      '-c',
      'core.untrackedCache=false',
      '-C',
      root,
      ...args,
    ],
    {
      env,
      input,
      maxBuffer,
      timeout: 30_000,
      windowsHide: true,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    },
  );
  if (
    result.error ||
    result.status !== 0 ||
    (options?.rejectStderr && result.stderr.length > 0)
  )
    throw new Error(`Gitの読み取りに失敗しました: ${args[0]}`);
  return result.stdout;
};

export const resolveGitCommit = (root: string, revision: string) => {
  if (!revision.trim() || /[\r\n\0]/.test(revision))
    throw new Error('比較元のrevisionが不正です');
  return gitShaSchema.parse(
    gitRead(root, [
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${revision}^{commit}`,
    ])
      .toString('utf8')
      .trim(),
  );
};

export const assertGitCommit = (root: string, revision: string) => {
  const sha = gitShaSchema.parse(revision);
  if (resolveGitCommit(root, sha) !== sha)
    throw new Error('revisionはcommit自体のSHAで指定してください');
  return sha;
};

export const gitObjectFormat = (root: string) =>
  gitObjectFormatSchema.parse(
    gitRead(root, ['rev-parse', '--show-object-format'])
      .toString('utf8')
      .trim(),
  );

export const gitOid = (format: GitObjectFormat, value: string) => {
  const oid = gitShaSchema.parse(value);
  if (oid.length !== (format === 'sha1' ? 40 : 64))
    throw new Error('Git object IDの長さがobject formatと一致しません');
  return oid;
};

export const hashGitBlob = (format: GitObjectFormat, bytes: Buffer) =>
  createHash(format)
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');

/** object名を固定して一括取得し、長さとobject IDを照合する。 */
export const readGitBlobs = (
  root: string,
  format: GitObjectFormat,
  objectIds: readonly string[],
) => {
  const ids = [...new Set(objectIds)].map((oid) => gitOid(format, oid));
  const blobs = new Map<string, Buffer>();
  if (!ids.length) return blobs;
  const input = `${ids.join('\n')}\n`;
  const headers = gitRead(root, ['cat-file', '--batch-check'], input)
    .toString('utf8')
    .trimEnd()
    .split('\n');
  if (ids.length !== headers.length)
    throw new Error('Git blobの応答件数が一致しません');
  const entries = ids.map((oid, index) => {
    const header = headers[index];
    const size = Number(header?.slice(oid.length + ' blob '.length));
    if (
      header !== `${oid} blob ${size}` ||
      !Number.isSafeInteger(size) ||
      size < 0 ||
      size > MAX_GIT_FILE_BYTES
    )
      throw new Error('Git blobが存在しないか、形式またはサイズが不正です');
    return { oid, header, size };
  });
  if (
    entries.reduce((total, { size }) => total + size, 0) >
    MAX_GIT_BLOB_SET_BYTES
  )
    throw new Error('Git blob集合のサイズが上限を超えています');
  let start = 0;
  while (start < entries.length) {
    let end = start;
    let length = 0;
    for (const entry of entries.slice(start)) {
      const size = entry.header.length + entry.size + 2;
      if (length + size > MAX_GIT_OUTPUT_BYTES) break;
      length += size;
      end++;
    }
    const batch = entries.slice(start, end);
    const output = gitRead(
      root,
      ['cat-file', '--batch'],
      `${batch.map((entry) => entry.oid).join('\n')}\n`,
    );
    if (output.length !== length)
      throw new Error('Git blobの応答サイズが一致しません');
    let offset = 0;
    for (const { oid, header, size } of batch) {
      const contentStart = offset + header.length + 1;
      const contentEnd = contentStart + size;
      const bytes = output.subarray(contentStart, contentEnd);
      if (
        output.toString('utf8', offset, contentStart) !== `${header}\n` ||
        output[contentEnd] !== 10 ||
        hashGitBlob(format, bytes) !== oid
      )
        throw new Error('Git blobの内容がobject IDと一致しません');
      blobs.set(oid, bytes);
      offset = contentEnd + 1;
    }
    start = end;
  }
  return blobs;
};
