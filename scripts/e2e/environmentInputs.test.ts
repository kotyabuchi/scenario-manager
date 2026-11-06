import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  hashEnvironmentInputs,
  prepareEnvironmentInputs,
  renderEnvironmentConfig,
} from './environmentInputs';

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, sep } from 'node:path';

const OPTIONS = {
  runId: '012345abcdef',
  ports: { api: 56431, db: 56432, shadow: 56430 },
};
const SEED = Buffer.from('-- 合成fixtureのみ\nselect 1;\n');
const MIGRATIONS = [
  { name: '20260102000000_second.sql', contents: Buffer.from('select 2;\r\n') },
  { name: '20260101000000_first.sql', contents: Buffer.from('select 1;\n') },
];
const temp = realpathSync.native(tmpdir());
const roots: string[] = [];

const temporaryRoot = () => {
  const root = mkdtempSync(join(temp, 'e2e-environment-inputs-'));
  roots.push(root);
  return root;
};

const fixture = () => {
  const root = temporaryRoot();
  const git = (args: string[]) =>
    execFileSync('git', ['-C', root, ...args], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  const write = (file: string, contents: string | Buffer) => {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  };
  git(['init']);
  git(['config', 'core.autocrlf', 'false']);
  for (const migration of MIGRATIONS)
    write(`supabase/migrations/${migration.name}`, migration.contents);
  write('supabase/seed.sql', SEED);
  git(['add', '--', 'supabase/seed.sql']);
  const workdir = join(
    root,
    'test-results',
    'environments',
    `run-${OPTIONS.runId}`,
  );
  return { root, workdir, write, git };
};

afterEach(() => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    // テスト自身が確保した直下directoryだけを削除する。
    const target = realpathSync.native(root);
    if (
      dirname(target) !== temp ||
      !basename(target).startsWith('e2e-environment-inputs-')
    )
      throw new Error('fixture cleanupの範囲外です。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('専用Supabase設定', () => {
  it('固定CLI向けのローカル構成を明示し、任意configを流用しない', () => {
    const config = renderEnvironmentConfig(OPTIONS);
    expect(config).toContain('project_id = "sm-e2e-012345abcdef"');
    expect(config).toContain('[api]\nenabled = true\nport = 56431');
    expect(config).toContain('[db]\nport = 56432\nshadow_port = 56430');
    expect(config).toContain('major_version = 17');
    expect(config).toContain(
      '[db.seed]\nenabled = true\nsql_paths = ["./seed.sql"]',
    );
    expect(config).toContain('[auth]\nenabled = true');
    expect(config).toContain('[storage]\nenabled = true');
    for (const service of [
      'db.pooler',
      'realtime',
      'studio',
      'inbucket',
      'analytics',
      'edge_runtime',
      'storage.image_transformation',
      'storage.s3_protocol',
    ])
      expect(config).toContain(`[${service}]\nenabled = false`);
    expect(config).not.toMatch(
      /password|secret|token|api_key|env\(|supabase\.co/,
    );
  });

  it.each([
    { ...OPTIONS, runId: '../other' },
    { ...OPTIONS, ports: { api: 56431, db: 56431, shadow: 56430 } },
    { ...OPTIONS, ports: { api: 54321, db: 56432, shadow: 56430 } },
    { ...OPTIONS, ports: { api: 80, db: 56432, shadow: 56430 } },
  ])('run識別子と専用portの不正値を拒否する %#', (options) => {
    expect(() => renderEnvironmentConfig(options)).toThrow();
  });
});

describe('再現可能な入力hash', () => {
  it('migration列挙順に依存せず元配列を変更しない', () => {
    const config = renderEnvironmentConfig(OPTIONS);
    const hashes = hashEnvironmentInputs(config, MIGRATIONS, SEED);
    expect(hashes).toEqual(
      hashEnvironmentInputs(config, [...MIGRATIONS].reverse(), SEED),
    );
    expect(MIGRATIONS.map(({ name }) => name)).toEqual([
      '20260102000000_second.sql',
      '20260101000000_first.sql',
    ]);
    expect(
      Object.values(hashes).every((hash) => /^[a-f0-9]{64}$/.test(hash)),
    ).toBe(true);
  });

  it('config・seed・migrationの名前と正確なbytesを区別する', () => {
    const config = renderEnvironmentConfig(OPTIONS);
    const hashes = hashEnvironmentInputs(config, MIGRATIONS, SEED);
    expect(
      hashEnvironmentInputs(`${config}\n`, MIGRATIONS, SEED).config,
    ).not.toBe(hashes.config);
    expect(
      hashEnvironmentInputs(config, MIGRATIONS, Buffer.from('select 2;')).seed,
    ).not.toBe(hashes.seed);
    const renamed = MIGRATIONS.map((migration) => ({
      ...migration,
      name: migration.name.replace('first', 'renamed'),
    }));
    expect(hashEnvironmentInputs(config, renamed, SEED).migrations).not.toBe(
      hashes.migrations,
    );
    const normalized = MIGRATIONS.map((migration) => ({
      ...migration,
      contents: Buffer.from(
        migration.contents.toString().replaceAll('\r\n', '\n'),
      ),
    }));
    expect(hashEnvironmentInputs(config, normalized, SEED).migrations).not.toBe(
      hashes.migrations,
    );
  });

  it('migrationの空集合・重複version・path混入を拒否する', () => {
    for (const migrations of [
      [],
      [
        { name: '001_first.sql', contents: SEED },
        { name: '001_second.sql', contents: SEED },
      ],
      [{ name: '../001_outside.sql', contents: SEED }],
    ])
      expect(() => hashEnvironmentInputs('config', migrations, SEED)).toThrow();
  });
});

describe('安全な専用workdir準備', () => {
  it('許可したSQLだけをコピーし、manifest用hashはコピー後のbytesと一致する', async () => {
    const input = fixture();
    input.write('supabase/config.toml', 'project_id = "remote-project"');
    input.write('supabase/.env', 'SECRET=do-not-copy');
    input.write('supabase/.temp/project-ref', 'do-not-copy');
    input.write('supabase/migrations/notes.md', 'do-not-copy');
    input.write('supabase/migrations/nested/003_nested.sql', 'do-not-copy');
    const result = await prepareEnvironmentInputs(input.root, OPTIONS);
    expect(result.workdir).toBe(input.workdir);
    expect(result.projectId).toBe(`sm-e2e-${OPTIONS.runId}`);
    expect(readdirSync(result.workdir)).toEqual(['supabase']);
    expect(readdirSync(join(result.workdir, 'supabase')).sort()).toEqual([
      'config.toml',
      'migrations',
      'seed.sql',
    ]);
    const names = readdirSync(
      join(result.workdir, 'supabase', 'migrations'),
    ).sort();
    expect(names).toEqual(MIGRATIONS.map(({ name }) => name).sort());
    const copiedMigrations = names.map((name) => ({
      name,
      contents: readFileSync(
        join(result.workdir, 'supabase', 'migrations', name),
      ),
    }));
    const config = readFileSync(
      join(result.workdir, 'supabase', 'config.toml'),
      'utf8',
    );
    const seed = readFileSync(join(result.workdir, 'supabase', 'seed.sql'));
    expect(seed).toEqual(SEED);
    expect(config).toBe(renderEnvironmentConfig(OPTIONS));
    expect(result.inputHashes).toEqual(
      hashEnvironmentInputs(config, copiedMigrations, seed),
    );
    for (const migration of copiedMigrations)
      expect(migration.contents).toEqual(
        MIGRATIONS.find(({ name }) => name === migration.name)?.contents,
      );
  });

  it('既存runの内容を上書きしない', async () => {
    const input = fixture();
    input.write(`${relative(input.root, input.workdir)}${sep}sentinel`, 'keep');
    await expect(prepareEnvironmentInputs(input.root, OPTIONS)).rejects.toThrow(
      '既存run',
    );
    expect(readdirSync(input.workdir)).toEqual(['sentinel']);
    expect(readFileSync(join(input.workdir, 'sentinel'), 'utf8')).toBe('keep');
  });

  it('seedが欠けていればworkdirを作らず停止する', async () => {
    const input = fixture();
    unlinkSync(join(input.root, 'supabase', 'seed.sql'));
    await expect(prepareEnvironmentInputs(input.root, OPTIONS)).rejects.toThrow(
      'seed',
    );
    expect(existsSync(input.workdir)).toBe(false);
  });

  it('seedが未追跡なら内容を推測せず停止する', async () => {
    const input = fixture();
    input.git(['rm', '--cached', '--', 'supabase/seed.sql']);
    await expect(prepareEnvironmentInputs(input.root, OPTIONS)).rejects.toThrow(
      '追跡済みseed',
    );
    expect(existsSync(input.workdir)).toBe(false);
  });

  it('外部GIT_DIRによる追跡判定の乗っ取りを無効化する', async () => {
    const input = fixture();
    vi.stubEnv('GIT_DIR', join(input.root, 'missing-git'));
    vi.stubEnv('GIT_INDEX_FILE', join(input.root, 'missing-index'));
    await expect(
      prepareEnvironmentInputs(input.root, OPTIONS),
    ).resolves.toMatchObject({ projectId: `sm-e2e-${OPTIONS.runId}` });
  });

  it.each([
    'supabase',
    'supabase/migrations',
    'test-results',
    'test-results/environments',
  ])('%s のjunctionから外へ読み書きしない', async (directory) => {
    const input = fixture();
    const outside = temporaryRoot();
    writeFileSync(join(outside, 'sentinel'), 'keep');
    const link = join(input.root, directory);
    mkdirSync(dirname(link), { recursive: true });
    if (existsSync(link)) renameSync(link, `${link}-original`);
    symlinkSync(
      outside,
      link,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(prepareEnvironmentInputs(input.root, OPTIONS)).rejects.toThrow(
      'symlink/junction',
    );
    expect(readdirSync(outside)).toEqual(['sentinel']);
    expect(readFileSync(join(outside, 'sentinel'), 'utf8')).toBe('keep');
  });

  it('root自身がjunctionなら拒否する', async () => {
    const input = fixture();
    const parent = temporaryRoot();
    const link = join(parent, 'linked-root');
    symlinkSync(
      input.root,
      link,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(prepareEnvironmentInputs(link, OPTIONS)).rejects.toThrow(
      'symlink/junction',
    );
    expect(existsSync(input.workdir)).toBe(false);
  });

  it('SQL名のdirectoryを入力ファイルとして扱わない', async () => {
    const input = fixture();
    mkdirSync(join(input.root, 'supabase', 'migrations', '003_directory.sql'));
    await expect(prepareEnvironmentInputs(input.root, OPTIONS)).rejects.toThrow(
      '通常ファイル',
    );
    expect(existsSync(input.workdir)).toBe(false);
  });

  it('相対rootを拒否する', async () => {
    await expect(prepareEnvironmentInputs('.', OPTIONS)).rejects.toThrow(
      '絶対path',
    );
  });
});
