import { z } from 'zod';

import { assertOwnedConnection } from './environmentOwnership';
import {
  environmentLeaseSchema,
  environmentManifestSchema,
} from './environmentSchema';

import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

import type { EnvironmentManifest } from './environmentSchema';

const PRIVATE_FILE = 'connection.private.json';
const MAX_PRIVATE_BYTES = 64 * 1024;
const credentialSchema = z.strictObject({
  schemaVersion: z.literal(1),
  runId: environmentLeaseSchema.shape.runId,
  ownerNonce: environmentLeaseSchema.shape.ownerNonce,
  apiUrl: z.string().url(),
  anonKey: z.string().min(1),
  serviceRoleKey: z.string().min(1),
});
const fixtureConnectionSchema = z.strictObject({
  manifest: environmentManifestSchema,
  lease: environmentLeaseSchema,
  anonKey: z.string().min(1),
  serviceRoleKey: z.string().min(1),
});
type FixtureConnection = z.infer<typeof fixtureConnectionSchema>;

const assertRole = (key: string, role: string) => {
  const parts = key.split('.');
  const payload = parts[1];
  if (parts.length !== 3 || !payload) throw new Error('鍵の形式が不正です。');
  // CLIから取得した鍵の取り違え検知。JWTの署名検証や本人認証ではない。
  const claims: unknown = JSON.parse(
    Buffer.from(payload, 'base64url').toString(),
  );
  z.object({ role: z.literal(role) }).parse(claims);
};

/** 稼働中の所有環境と用途別の鍵を検査し、remoteや停止済環境を拒否する。 */
export const assertFixtureConnection = (input: FixtureConnection): void => {
  try {
    const { manifest, lease, anonKey, serviceRoleKey } =
      fixtureConnectionSchema.parse(input);
    if (manifest.state !== 'running') throw new Error('稼働中ではありません。');
    assertOwnedConnection(manifest, {
      lease,
      projectId: manifest.projectId,
      apiUrl: manifest.apiUrl,
      database: manifest.database,
    });
    assertRole(anonKey, 'anon');
    assertRole(serviceRoleKey, 'service_role');
  } catch {
    // Zod errorや入力値へ秘密鍵を含めて公開しない。
    throw new Error('専用fixtureの接続・所有権・鍵を確認できません。');
  }
};

const physicalFile = (root: string, file: string, mayCreate = false) => {
  const absoluteRoot = resolve(root);
  if (realpathSync(absoluteRoot) !== absoluteRoot)
    throw new Error('fixtureのrootは物理pathに限定します。');
  const target = resolve(absoluteRoot, file);
  const parts = relative(absoluteRoot, target).split(sep);
  if (
    parts.length !== 4 ||
    parts[0] !== 'test-results' ||
    parts[1] !== 'environments' ||
    !/^run-[a-f0-9]{12}$/.test(parts[2] ?? '') ||
    ![PRIVATE_FILE, 'manifest.json', 'owner.json'].includes(parts[3] ?? '')
  )
    throw new Error('fixture設定は専用run配下に限定します。');
  let current = absoluteRoot;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    if (mayCreate && index === parts.length - 1) break;
    const stat = lstatSync(current);
    if (
      stat.isSymbolicLink() ||
      realpathSync(current) !== current ||
      (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())
    )
      throw new Error('fixture設定に不正なpathがあります。');
    if (index === parts.length - 1 && stat.size > MAX_PRIVATE_BYTES)
      throw new Error('fixture設定が上限を超えています。');
  }
  return target;
};

const readJson = (root: string, file: string): unknown =>
  JSON.parse(readFileSync(physicalFile(root, file), 'utf8'));

/** 所有runのCLI statusだけから秘密設定を作る。status全体は保存しない。 */
export const writeEnvironmentCredentials = (
  manifest: EnvironmentManifest,
  statusJson: string,
): string => {
  try {
    const status = z
      .object({
        API_URL: z.string(),
        DB_URL: z.string(),
        ANON_KEY: z.string(),
        SERVICE_ROLE_KEY: z.string(),
      })
      .parse(JSON.parse(statusJson));
    const database = new URL(status.DB_URL);
    if (
      status.API_URL !== manifest.apiUrl ||
      database.protocol !== 'postgresql:' ||
      database.username !== 'postgres' ||
      database.hostname !== manifest.database.host ||
      Number(database.port) !== manifest.database.port ||
      database.pathname !== `/${manifest.database.name}` ||
      database.search ||
      database.hash
    )
      throw new Error('statusの接続先が異なります。');
    const lease = environmentLeaseSchema.parse(
      readJson(manifest.worktreeRoot, join(manifest.workdir, 'owner.json')),
    );
    assertFixtureConnection({
      manifest,
      lease,
      anonKey: status.ANON_KEY,
      serviceRoleKey: status.SERVICE_ROLE_KEY,
    });
    const target = physicalFile(
      manifest.worktreeRoot,
      join(manifest.workdir, PRIVATE_FILE),
      true,
    );
    writeFileSync(
      target,
      JSON.stringify(
        credentialSchema.parse({
          schemaVersion: 1,
          runId: manifest.runId,
          ownerNonce: manifest.ownerNonce,
          apiUrl: status.API_URL,
          anonKey: status.ANON_KEY,
          serviceRoleKey: status.SERVICE_ROLE_KEY,
        }),
      ),
      { encoding: 'utf8', flag: 'wx', mode: 0o600 },
    );
    return target;
  } catch {
    throw new Error('専用環境の秘密設定を作成できません。');
  }
};

/** workerは固定pathの設定と最新のmanifest/leaseを再照合してから接続する。 */
export const readEnvironmentCredentials = (
  root: string,
  file: string,
): FixtureConnection => {
  try {
    const target = physicalFile(root, file);
    if (!target.endsWith(`${sep}${PRIVATE_FILE}`))
      throw new Error('設定名が異なります。');
    const credentials = credentialSchema.parse(readJson(root, target));
    const manifest = environmentManifestSchema.parse(
      readJson(root, join(dirname(target), 'manifest.json')),
    );
    const lease = environmentLeaseSchema.parse(
      readJson(root, join(dirname(target), 'owner.json')),
    );
    if (
      manifest.worktreeRoot !== resolve(root) ||
      manifest.workdir !== dirname(target) ||
      manifest.runId !== credentials.runId ||
      manifest.ownerNonce !== credentials.ownerNonce ||
      manifest.apiUrl !== credentials.apiUrl
    )
      throw new Error('設定の所有情報が異なります。');
    const connection = {
      manifest,
      lease,
      anonKey: credentials.anonKey,
      serviceRoleKey: credentials.serviceRoleKey,
    };
    assertFixtureConnection(connection);
    return connection;
  } catch {
    throw new Error('専用環境の秘密設定を読み込めません。');
  }
};

export type { FixtureConnection };
