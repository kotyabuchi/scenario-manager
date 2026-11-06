import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assertGitCommit, gitRead } from './gitObjects';
import {
  SURFACE_MIGRATION_INTRODUCTION,
  SURFACE_MIGRATION_V1_ORIGIN,
} from './surfaceMigrationHistory';
import { replaySurfaceMigration } from './surfaceMigrationReplay';
import {
  runSurfaceReplayProcess,
  SurfaceReplayProcessError,
  UnsettledSurfaceReplayProcess,
} from './surfaceMigrationReplayProcess';
import { readSurfaceReplayDiagnostic } from './surfaceReplayFailure';
import { readRevisionFile } from './trustedRevision';

import { existsSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { platform, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';

vi.mock('node:os', async (original) => ({
  ...(await original<typeof import('node:os')>()),
  platform: vi.fn(),
  tmpdir: vi.fn(),
}));
vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  assertGitCommit: vi.fn(),
  gitRead: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
}));
vi.mock('./surfaceMigrationReplayProcess', async (original) => ({
  ...(await original<typeof import('./surfaceMigrationReplayProcess')>()),
  runSurfaceReplayProcess: vi.fn(),
}));

const roots: string[] = [];
const old = SURFACE_MIGRATION_V1_ORIGIN;
const introduction = SURFACE_MIGRATION_INTRODUCTION;
const lock = 'lockfileVersion: 9.0\n';
const manifest = '{}\n';
const historicalReceipt = {
  stage: 'M1-static',
  status: 'passed',
  mode: 'local',
  base: old,
  head: introduction,
  issues: [],
  isBootstrap: false,
  observationBaseSha: old,
  surfaceMigrationOrigin: {
    kind: 'static-base',
    staticBaseSha: old,
    observationBaseSha: old,
  },
  surfaceMigrationSnapshotDigest: 'a'.repeat(64),
  baselineDigest: 'b'.repeat(64),
  surfaceMigrationDigest: 'c'.repeat(64),
  surfacePendingDigest: 'd'.repeat(64),
};

const fixture = async (
  input: {
    failAt?: string;
    error?: Error;
    receipt?: Record<string, unknown>;
    installedLock?: string;
    afterStatus?: string;
  } = {},
) => {
  const os = await vi.importActual<typeof import('node:os')>('node:os');
  const raw = await mkdtemp(join(os.tmpdir(), 'sr-'));
  const parent = realpathSync.native(raw);
  roots.push(parent);
  const root = join(parent, 'repo');
  const temporary = join(parent, 'temp');
  await mkdir(root);
  await mkdir(temporary);
  vi.mocked(tmpdir).mockReturnValue(temporary);
  await writeFile(join(root, 'package.json'), manifest);
  await mkdir(join(root, 'test-results'));
  const directory = join(root, 'test-results', 'history');
  const phases: string[] = [];
  vi.mocked(gitRead).mockImplementation((_root, args) =>
    Buffer.from(args[0] === 'rev-parse' ? root : ''),
  );
  vi.mocked(runSurfaceReplayProcess).mockImplementation(
    async (_executable, _args, options) => {
      const { cwd, log, stdoutFile } = options;
      const phase = basename(log, '.private.log');
      phases.push(phase);
      let content = '';
      if (phase === 'checkout') {
        await writeFile(join(cwd, 'package.json'), manifest);
        await writeFile(join(cwd, 'pnpm-lock.yaml'), lock);
      }
      if (phase.endsWith('-head')) content = introduction;
      if (phase === 'after-status') content = input.afterStatus ?? '';
      if (phase === 'pnpm-version') content = '10.33.0';
      if (phase === 'pnpm-install') {
        const modules = join(cwd, 'node_modules');
        const panda = join(modules, '@pandacss', 'dev');
        const tsx = join(modules, 'tsx');
        await mkdir(join(modules, '.pnpm'), { recursive: true });
        await mkdir(panda, { recursive: true });
        await mkdir(tsx);
        await writeFile(
          join(modules, '.pnpm', 'lock.yaml'),
          input.installedLock ?? lock,
        );
        await writeFile(join(panda, 'package.json'), manifest);
        await writeFile(
          join(tsx, 'package.json'),
          JSON.stringify({ exports: { './cli': './cli.mjs' } }),
        );
        await writeFile(join(tsx, 'cli.mjs'), '');
      }
      if (phase === 'static-gate') {
        const receipts = join(cwd, 'test-results', 'quality');
        await mkdir(receipts, { recursive: true });
        await writeFile(
          join(receipts, 'static-gate.json'),
          JSON.stringify({ ...historicalReceipt, ...input.receipt }),
        );
      }
      if (stdoutFile) {
        await writeFile(log, 'warning: graft file is deprecated\n', {
          flag: 'wx',
        });
        await writeFile(stdoutFile, content, { flag: 'wx' });
      } else await writeFile(log, content, { flag: 'wx' });
      if (phase === input.failAt) throw input.error;
    },
  );
  return { root, directory, phases, parent, temporary };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(platform).mockReturnValue('linux');
  vi.mocked(assertGitCommit).mockImplementation((_root, revision) => revision);
  vi.mocked(readRevisionFile).mockImplementation((_root, _head, path) =>
    path === 'package.json' ? manifest : lock,
  );
});

afterEach(async () => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) await rm(root, { recursive: true });
});

describe('固定UI移行の歴史再生', () => {
  it('標準エラーに警告があっても固定入力を照合し、proofの返却前に回収する', async () => {
    const value = await fixture();
    vi.stubEnv('GITHUB_TOKEN', 'private-token');
    vi.stubEnv('CI', 'true');
    vi.stubEnv('E2E_LEDGER_BOOTSTRAP_APPROVAL', 'private-approval');
    vi.stubEnv('NODE_OPTIONS', 'private-node-options');
    const proof = await replaySurfaceMigration(value);
    expect(proof).toEqual({
      schemaVersion: 1,
      observationBaseSha: old,
      introductionSha: introduction,
      snapshotDigest: 'a'.repeat(64),
      baselineDigest: 'b'.repeat(64),
      surfaceMigrationDigest: 'c'.repeat(64),
      surfacePendingDigest: 'd'.repeat(64),
    });
    expect(value.phases).toEqual([
      'init',
      'fetch',
      'checkout',
      'ancestor',
      'before-head',
      'before-status',
      'pnpm-version',
      'pnpm-install',
      'panda',
      'static-gate',
      'after-head',
      'after-status',
    ]);
    const calls = vi.mocked(runSurfaceReplayProcess).mock.calls;
    expect(
      calls.flatMap(([, , { stdoutFile }]) =>
        stdoutFile ? [basename(stdoutFile)] : [],
      ),
    ).toEqual([
      'before-head.stdout.private.log',
      'before-status.stdout.private.log',
      'pnpm-version.stdout.private.log',
      'after-head.stdout.private.log',
      'after-status.stdout.private.log',
    ]);
    const install = calls.find(([, args]) => args.includes('install'));
    expect(install?.[1]).toEqual(
      expect.arrayContaining([
        '--frozen-lockfile',
        '--ignore-scripts',
        '--package-import-method=copy',
        '--verify-store-integrity=true',
      ]),
    );
    const check = calls.find(([, args]) => args.includes('--base'));
    expect(check?.[1]).toEqual([
      expect.stringContaining('cli.mjs'),
      'scripts/e2e/ledgerCheck.ts',
      '--base',
      old,
    ]);
    for (const [, , { cwd, env }] of calls) {
      expect(dirname(dirname(cwd))).toBe(value.temporary);
      expect(basename(cwd)).toBe('checkout');
      expect(env.GITHUB_TOKEN).toBeUndefined();
      expect(env.CI).toBeUndefined();
      expect(env.E2E_LEDGER_BOOTSTRAP_APPROVAL).toBeUndefined();
      expect(env.NODE_OPTIONS).toBeUndefined();
    }
    expect(existsSync(value.directory)).toBe(false);
    expect(await readdir(value.temporary)).toEqual([]);
  });

  it.each([
    { installedLock: 'wrong' },
    { afterStatus: ' M scripts/e2e/ledgerCheck.ts' },
    { receipt: { mode: 'ci' } },
    { receipt: { head: 'e'.repeat(40) } },
    { receipt: { issues: [{ code: 'PRIVATE' }] } },
  ])('固定入力または旧receiptが異なる場合はproofを発行しない', async (input) => {
    const value = await fixture(input);
    await expect(replaySurfaceMigration(value)).rejects.toThrow();
    expect(existsSync(value.directory)).toBe(true);
    expect(await readdir(value.temporary)).toEqual([]);
  });

  it('コマンドの生エラーを公開messageに含めず、失敗ログを保持する', async () => {
    const value = await fixture({
      failAt: 'pnpm-install',
      error: new Error('private-token'),
    });
    const error: unknown = await replaySurfaceMigration(value).catch(
      (error: unknown) => error,
    );
    expect(error).toMatchObject({
      message: '歴史再生の処理に失敗しました: pnpm-install',
    });
    expect(readSurfaceReplayDiagnostic(error)).toBeUndefined();
    expect(existsSync(join(value.directory, 'pnpm-install.private.log'))).toBe(
      true,
    );
    expect(await readdir(value.temporary)).toEqual([]);
  });

  it('既知のrunner失敗は固定工程と固定区分だけを保持する', async () => {
    const original = new SurfaceReplayProcessError('exit-failed');
    original.message = 'private-token';
    const value = await fixture({ failAt: 'panda', error: original });

    const error: unknown = await replaySurfaceMigration(value).catch(
      (error: unknown) => error,
    );
    expect(error).toMatchObject({
      message: '歴史再生の処理に失敗しました: panda',
    });
    expect(error).not.toHaveProperty('cause');
    expect(readSurfaceReplayDiagnostic(error)).toEqual({
      step: 'panda',
      processFailure: 'exit-failed',
    });
    expect(await readdir(value.temporary)).toEqual([]);
  });

  it('process群の終了を証明できない場合は所有checkoutを残す', async () => {
    const value = await fixture({
      failAt: 'panda',
      error: new UnsettledSurfaceReplayProcess('未終了'),
    });
    const error: unknown = await replaySurfaceMigration(value).catch(
      (error: unknown) => error,
    );
    expect(error).not.toHaveProperty('cause');
    expect(readSurfaceReplayDiagnostic(error)).toEqual({
      step: 'panda',
      processFailure: 'group-unsettled',
    });
    expect(
      existsSync(join(value.directory, 'retained-workspace.private.log')),
    ).toBe(true);
    expect(await readdir(value.temporary)).toHaveLength(1);
  });

  it('先に存在するdirectoryへ書き込まない', async () => {
    const value = await fixture();
    await mkdir(value.directory);
    await expect(replaySurfaceMigration(value)).rejects.toThrow();
    expect(existsSync(value.directory)).toBe(true);
    expect(value.phases).toEqual([]);
    expect(await readdir(value.temporary)).toEqual([]);
  });

  it('親リポジトリの内側を一時checkout先にしない', async () => {
    const value = await fixture();
    vi.mocked(tmpdir).mockReturnValue(value.root);
    await expect(replaySurfaceMigration(value)).rejects.toThrow(
      '一時directoryはリポジトリ外',
    );
    expect(value.phases).toEqual([]);
    expect(existsSync(value.directory)).toBe(false);
  });

  it.each([
    'package.json',
    'node_modules',
  ])('リポジトリ外でも一時directoryの上位に%sがあれば拒否する', async (entry) => {
    const value = await fixture();
    if (entry === 'node_modules') await mkdir(join(value.parent, entry));
    else await writeFile(join(value.parent, entry), manifest);
    await expect(replaySurfaceMigration(value)).rejects.toThrow(
      '一時directoryに上位package',
    );
    expect(value.phases).toEqual([]);
    expect(existsSync(value.directory)).toBe(false);
    expect(await readdir(value.temporary)).toEqual([]);
  });
});
