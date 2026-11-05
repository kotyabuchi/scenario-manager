import { afterEach, describe, expect, it, vi } from 'vitest';

import { serializeBaseline } from './baseline';
import { serializeInventory } from './inventory';
import { readArtifact, writeArtifact } from './ledgerArtifacts';
import { runLedgerCheck } from './ledgerCheck';
import { refreshLedger } from './ledgerRefresh';
import {
  ARTIFACTS,
  baselineDigest,
  checkStaticState,
  collectStaticState,
} from './staticGate';

import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import type { StaticState } from './staticGate';

const roots: string[] = [];
const git = (root: string, ...args: string[]) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    stdio: 'pipe',
  }).trim();
const write = async (root: string, file: string, text: string) => {
  await mkdir(dirname(join(root, file)), { recursive: true });
  await writeFile(join(root, file), text);
};
const json = async (root: string, file: string, value: unknown) =>
  write(root, file, `${JSON.stringify(value, null, 2)}\n`);
const commit = (root: string) => {
  git(root, 'add', '.');
  git(
    root,
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    '-c',
    'core.hooksPath=',
    'commit',
    '--quiet',
    '-m',
    'fixture',
  );
  return git(root, 'rev-parse', 'HEAD');
};
const createFixture = async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(resolve('test-results/static-gate-'));
  roots.push(root);
  await write(root, '.gitignore', 'test-results/\n');
  await json(root, 'package.json', { type: 'module' });
  await json(root, 'tsconfig.json', {
    compilerOptions: {
      noLib: true,
      types: [],
      target: 'ESNext',
      module: 'ESNext',
      moduleResolution: 'Bundler',
    },
    include: ['src/**/*'],
  });
  await write(
    root,
    'src/app/page.tsx',
    'export default function Page() { return null; }',
  );
  await write(
    root,
    'playwright.config.ts',
    `export default { testDir: './specs', projects: [{ name: 'auth-setup', testMatch: /auth.setup.ts/ }, { name: '', testMatch: /main.spec.ts/, dependencies: ['auth-setup'] }] };`,
  );
  await write(
    root,
    'specs/auth.setup.ts',
    `import { test } from '@playwright/test'; test('auth', () => { throw new Error('setup must not execute'); });`,
  );
  await write(
    root,
    'specs/main.spec.ts',
    `import { test } from '@playwright/test';\ntest('first', () => { throw new Error('must not execute'); });\ntest('second', () => {});`,
  );
  await write(
    root,
    '.storybook/playwright.config.ts',
    `export default { testDir: './tests' };`,
  );
  await write(
    root,
    '.storybook/tests/main.spec.ts',
    `import { test } from '@playwright/test';\ntest('story', () => {});`,
  );
  await write(
    root,
    'playwright.isolated.config.ts',
    `export default { testDir: './isolated-specs', projects: [{ name: 'chromium' }] };`,
  );
  await write(
    root,
    'isolated-specs/main.spec.ts',
    `import { test } from '@playwright/test'; test('isolated', () => { throw new Error('must not execute'); });`,
  );
  for (const file of [
    'profiles',
    'fixtures',
    'execution-groups',
    'exceptions',
    'contracts/home',
    'scenarios/home',
  ])
    await json(root, `e2e/ledger/${file}.json`, []);
  git(root, 'init', '--quiet');
  const before = commit(root);
  await refreshLedger(root, 'bootstrap');
  const base = commit(root);
  const state = await collectStaticState(root);
  const check = (
    current: StaticState = state,
    revision = base,
    approval?: string,
  ) =>
    checkStaticState({
      root,
      state: current,
      revisions: { base: revision, head: base },
      ...(approval ? { bootstrapApproval: approval } : {}),
    });
  return { root, before, base, state, check };
};
const save = (root: string, state: StaticState) => {
  writeArtifact(root, ARTIFACTS.inventory, serializeInventory(state.inventory));
  writeArtifact(
    root,
    ARTIFACTS.legacy,
    `${JSON.stringify(state.legacy, null, 2)}\n`,
  );
  writeArtifact(root, ARTIFACTS.baseline, serializeBaseline(state.baseline));
};

afterEach(async () => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    if (dirname(root) !== resolve('test-results'))
      throw new Error('fixture削除先が不正です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('M1静的品質ゲートの接続', () => {
  it('isolatedのimplemented登録を検査しタグ欠落で未実装扱いへ戻せない', async () => {
    const { root } = await createFixture();
    const target = 'page:src/app/page.tsx';
    const execution = {
      profile: 'isolated',
      project: 'chromium',
      runtime: 'next-production',
      variant: 'anonymous',
      actorBindings: [{ role: 'operator', actor: 'anonymous' }],
    };
    await json(root, 'e2e/ledger/profiles.json', [
      {
        id: 'isolated',
        layer: 'browser',
        executions: [{ project: 'chromium', runtime: 'next-production' }],
      },
    ]);
    await json(root, 'e2e/ledger/fixtures.json', [
      {
        id: 'public',
        actors: ['anonymous'],
      },
    ]);
    await json(root, 'e2e/ledger/contracts/home.json', [
      {
        target,
        classification: 'read',
        requirements: [
          {
            aspect: 'render',
            layers: ['browser'],
            expectation: '公開ページを表示する',
            basis: ['src/app/page.tsx'],
            executions: [execution],
          },
        ],
        notApplicable: [],
      },
    ]);
    await json(root, 'e2e/ledger/scenarios/home.json', [
      {
        scenarioId: 'home',
        title: '公開ページ',
        cases: [
          {
            caseId: 'isolated-render',
            title: '公開表示',
            status: 'implemented',
            layer: 'browser',
            fixture: 'public',
            roles: ['operator'],
            checks: [{ target, aspect: 'render', layer: 'browser' }],
            executions: [execution],
            testBindings: ['main'],
          },
        ],
      },
    ]);
    await write(
      root,
      'isolated-specs/main.spec.ts',
      "import { test } from '@playwright/test'; test('isolated', { tag: ['@case:isolated-render', '@variant:anonymous', '@binding:main'] }, () => { throw new Error('must not execute'); });",
    );
    const state = await collectStaticState(root);
    expect(state.registrations).toBe(1);
    expect(state.baseline.items).toHaveLength(0);
    expect(state.legacy.registered).toEqual([
      expect.objectContaining({
        profile: 'isolated',
        caseId: 'isolated-render',
      }),
    ]);
    await write(
      root,
      'isolated-specs/main.spec.ts',
      "import { test } from '@playwright/test'; test('isolated', () => {});",
    );
    await expect(collectStaticState(root)).rejects.toThrow(
      '静的台帳の整合エラー',
    );
  }, 30_000);

  it('実登録からbootstrapした台帳をreadonlyで検査し二度目のbootstrapは拒否する', async () => {
    const { root, base, state, check } = await createFixture();
    const before = Object.values(ARTIFACTS).map((file) =>
      readArtifact(root, file),
    );
    expect(state.legacy.tests).toHaveLength(4);
    expect(
      state.legacy.tests.some((entry) => entry.profile === 'isolated'),
    ).toBe(true);
    expect(state.baseline.items).toHaveLength(1);
    expect((await check()).issues).toEqual([]);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    expect(
      await runLedgerCheck(['--base', base], root, { ...process.env, CI: '' }),
    ).toBe(true);
    expect(
      Object.values(ARTIFACTS).map((file) => readArtifact(root, file)),
    ).toEqual(before);
    await expect(refreshLedger(root, 'bootstrap')).rejects.toThrow('上書き');
    await expect(
      runLedgerCheck(['--base', 'f'.repeat(40)], root, {
        ...process.env,
        CI: '',
      }),
    ).rejects.toThrow();
    const failedReport = JSON.parse(
      readArtifact(root, 'test-results/quality/static-gate.json') ?? '{}',
    );
    expect(failedReport).toMatchObject({
      stage: 'M1-static',
      status: 'failed',
    });
    expect(failedReport).not.toHaveProperty('issues');
  }, 30_000);

  it('PR内再baselineと保存inventory更新だけでは新Action不足を通せない', async () => {
    const { root, check } = await createFixture();
    await write(
      root,
      'src/app/actions.ts',
      `'use server'; export async function save() { return true; }`,
    );
    const state = await collectStaticState(root);
    expect(
      (await check(state)).issues.some(
        (issue) => issue.code === 'STALE_ARTIFACT',
      ),
    ).toBe(true);
    await expect(refreshLedger(root, 'update')).rejects.toThrow('不足を増やす');
    save(root, state);
    const result = await check(state);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.subject.includes('save'))).toBe(
      true,
    );
  }, 30_000);

  it('旧testを消して目録を再生成してもbaseの登録から削除を検出する', async () => {
    const { root, check } = await createFixture();
    await write(
      root,
      'specs/main.spec.ts',
      `import { test } from '@playwright/test';\ntest('first', () => { throw new Error('must not execute'); });`,
    );
    const state = await collectStaticState(root);
    save(root, state);
    expect(
      (await check(state)).issues.some(
        (issue) => issue.code === 'REMOVED_LEGACY',
      ),
    ).toBe(true);
  }, 30_000);

  it('保存物が古いだけの変更とbase不在を区別して失敗する', async () => {
    const { root, state, check } = await createFixture();
    await write(
      root,
      'src/app/page.tsx',
      '// 行移動\nexport default function Page() { return null; }',
    );
    const current = await collectStaticState(root);
    expect((await check(current)).issues.map((issue) => issue.code)).toContain(
      'STALE_ARTIFACT',
    );
    await expect(check(state, 'f'.repeat(40))).rejects.toThrow();
  }, 30_000);

  it('初回schema未導入でも承認なし・別head・別digestは通さない', async () => {
    const { root, before, base, state, check } = await createFixture();
    await expect(check(state, before)).rejects.toThrow('外部承認');
    const approval = {
      base: before,
      head: base,
      digest: baselineDigest(state.baseline),
    };
    expect(
      (await check(state, before, JSON.stringify(approval))).isBootstrap,
    ).toBe(true);
    const eventPath = join(root, 'test-results/event.json');
    await json(root, 'test-results/event.json', {
      pull_request: { base: { sha: before }, head: { sha: base } },
    });
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    expect(
      await runLedgerCheck([], root, {
        ...process.env,
        CI: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_EVENT_PATH: eventPath,
        E2E_LEDGER_BOOTSTRAP_APPROVAL: JSON.stringify(approval),
      }),
    ).toBe(true);
    await expect(
      check(state, before, JSON.stringify({ ...approval, head: before })),
    ).rejects.toThrow('一致');
    await expect(
      check(
        state,
        before,
        JSON.stringify({ ...approval, digest: '0'.repeat(64) }),
      ),
    ).rejects.toThrow('一致');
  }, 30_000);

  it('移行理由の別baseへの追加や既存履歴の削除を拒否する', async () => {
    const { root, before, check } = await createFixture();
    await json(root, ARTIFACTS.migrations, {
      schemaVersion: 1,
      entries: [{ base: before, policy: [], legacy: [] }],
    });
    expect((await check()).issues.map((issue) => issue.code)).toContain(
      'UNRELATED_MIGRATION',
    );
    const revision = commit(root);
    await json(root, ARTIFACTS.migrations, { schemaVersion: 1, entries: [] });
    expect(
      (await check(undefined, revision)).issues.map((issue) => issue.code),
    ).toContain('REMOVED_MIGRATION_HISTORY');
  }, 30_000);
});
