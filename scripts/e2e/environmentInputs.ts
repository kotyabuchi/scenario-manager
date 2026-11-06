import { isNil } from 'ramda';
import { z } from 'zod';

import { environmentPlanInputSchema } from './environmentSchema';

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

const optionsSchema = environmentPlanInputSchema.pick({
  runId: true,
  ports: true,
});
const migrationSchema = z.strictObject({
  name: z.string().regex(/^\d+_[a-zA-Z0-9_.-]+\.sql$/),
  contents: z.instanceof(Buffer),
});
const hash = (bytes: string | Buffer) =>
  createHash('sha256').update(bytes).digest('hex');
const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

/** CLI 2.75.0の公式config templateに基づき、資格情報を含まない専用設定を作る。 */
export const renderEnvironmentConfig = (
  input: EnvironmentInputOptions,
): string => {
  const { runId, ports } = optionsSchema.parse(input);
  // https://github.com/supabase/cli/blob/v2.75.0/pkg/config/templates/config.toml
  return `# Batch 7専用。Supabase CLI 2.75.0で使用する。
project_id = "sm-e2e-${runId}"

[api]
enabled = true
port = ${ports.api}
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[api.tls]
enabled = false

[db]
port = ${ports.db}
shadow_port = ${ports.shadow}
major_version = 17
health_timeout = "2m"

[db.pooler]
enabled = false

[db.migrations]
enabled = true
schema_paths = []

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

[auth]
enabled = true
site_url = "http://127.0.0.1:${ports.api}"
additional_redirect_urls = []
enable_signup = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
enable_confirmations = false

[auth.sms]
enable_signup = false

[storage]
enabled = true
file_size_limit = "50MiB"

[storage.image_transformation]
enabled = false

[storage.s3_protocol]
enabled = false

[realtime]
enabled = false

[studio]
enabled = false

[inbucket]
enabled = false

[analytics]
enabled = false

[edge_runtime]
enabled = false
`;
};

const sortedMigrations = (
  input: EnvironmentMigration[],
): EnvironmentMigration[] => {
  const migrations = z
    .array(migrationSchema)
    .min(1)
    .parse(input)
    .sort((left, right) => compare(left.name, right.name));
  const versions = new Set<string>();
  for (const migration of migrations) {
    const version = migration.name.split('_')[0];
    if (isNil(version) || versions.has(version))
      throw new Error('migrationのversionが重複しています。');
    versions.add(version);
  }
  return migrations;
};

/** ファイル名と実際にコピーするbytesを固定順序でhash化し、連結の曖昧性を避ける。 */
export const hashEnvironmentInputs = (
  config: string,
  migrations: EnvironmentMigration[],
  seed: Buffer,
) => ({
  config: hash(config),
  migrations: hash(
    JSON.stringify(
      sortedMigrations(migrations).map((migration) => ({
        name: migration.name,
        hash: hash(migration.contents),
      })),
    ),
  ),
  seed: hash(seed),
});

// rootの祖先も検査し、途中のjunction/symlinkを許可しない。
const assertPhysicalDirectory = async (directory: string) => {
  const absolute = resolve(directory);
  const root = parse(absolute).root;
  let current = root;
  for (const component of relative(root, absolute).split(sep).filter(Boolean)) {
    current = join(current, component);
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error(
        '環境入力のdirectoryにはsymlink/junctionを使用できません。',
      );
  }
  const physical = await realpath(absolute);
  if (relative(absolute, physical) !== '')
    throw new Error('環境入力のdirectoryが物理pathと一致しません。');
  return physical;
};

const readRegularFile = async (root: string, file: string): Promise<Buffer> => {
  const path = join(root, file);
  await assertPhysicalDirectory(parse(path).dir);
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink())
    throw new Error(`${file}: 通常ファイルが必要です。`);
  const handle = await open(path, 'r');
  try {
    const opened = await handle.stat();
    if (opened.dev !== before.dev || opened.ino !== before.ino)
      throw new Error(`${file}: 読込対象が変更されました。`);
    const contents = await handle.readFile();
    const after = await handle.stat();
    if (
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      contents.length !== before.size
    )
      throw new Error(`${file}: 読込中に内容が変更されました。`);
    return contents;
  } finally {
    await handle.close();
  }
};

const assertTrackedSeed = (root: string) => {
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (key.toUpperCase().startsWith('GIT_')) Reflect.deleteProperty(env, key);
  try {
    const tracked = execFileSync(
      'git',
      [
        '-C',
        root,
        'ls-files',
        '--error-unmatch',
        '--full-name',
        '--',
        'supabase/seed.sql',
      ],
      {
        env,
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10_000,
      },
    );
    if (tracked.trim() !== 'supabase/seed.sql')
      throw new Error('対象が一致しません。');
  } catch (cause) {
    throw new Error(
      'supabase/seed.sql: 追跡済みseedが必要です。追加したseedは先にstageしてください。',
      { cause },
    );
  }
};

const ensureDirectory = async (directory: string) => {
  try {
    await mkdir(directory);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST'))
      throw error;
  }
  await assertPhysicalDirectory(directory);
};

/** 入力検証後にfreshな専用workdirへSQLだけを保存する。既存runや失敗runを再利用しない。 */
export const prepareEnvironmentInputs = async (
  root: string,
  input: EnvironmentInputOptions,
) => {
  const options = optionsSchema.parse(input);
  if (!isAbsolute(root)) throw new Error('環境のrootには絶対pathが必要です。');
  const physicalRoot = await assertPhysicalDirectory(root);
  const migrationsDirectory = join(physicalRoot, 'supabase', 'migrations');
  await assertPhysicalDirectory(migrationsDirectory);
  const names = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort(compare);
  const migrations = sortedMigrations(
    await Promise.all(
      names.map(async (name) => ({
        name,
        contents: await readRegularFile(
          physicalRoot,
          `supabase/migrations/${name}`,
        ),
      })),
    ),
  );
  assertTrackedSeed(physicalRoot);
  let seed: Buffer;
  try {
    seed = await readRegularFile(physicalRoot, 'supabase/seed.sql');
  } catch (cause) {
    throw new Error('supabase/seed.sql: 通常ファイルのseedを読み込めません。', {
      cause,
    });
  }
  const config = renderEnvironmentConfig(options);
  const inputHashes = hashEnvironmentInputs(config, migrations, seed);
  const parent = join(physicalRoot, 'test-results', 'environments');
  await ensureDirectory(join(physicalRoot, 'test-results'));
  await ensureDirectory(parent);
  const workdir = join(parent, `run-${options.runId}`);
  try {
    await mkdir(workdir);
  } catch (cause) {
    throw new Error(
      '環境workdirを新規作成できません。既存runの再利用はできません。',
      { cause },
    );
  }
  await assertPhysicalDirectory(workdir);
  await mkdir(join(workdir, 'supabase'));
  await mkdir(join(workdir, 'supabase', 'migrations'));
  const files = [
    { name: 'supabase/config.toml', contents: Buffer.from(config) },
    { name: 'supabase/seed.sql', contents: seed },
    ...migrations.map((migration) => ({
      name: `supabase/migrations/${migration.name}`,
      contents: migration.contents,
    })),
  ];
  for (const file of files) {
    await assertPhysicalDirectory(parse(join(workdir, file.name)).dir);
    await writeFile(join(workdir, file.name), file.contents, { flag: 'wx' });
  }
  return { workdir, projectId: `sm-e2e-${options.runId}`, inputHashes };
};

type EnvironmentInputOptions = z.infer<typeof optionsSchema>;
type EnvironmentMigration = z.infer<typeof migrationSchema>;
export type { EnvironmentInputOptions, EnvironmentMigration };
