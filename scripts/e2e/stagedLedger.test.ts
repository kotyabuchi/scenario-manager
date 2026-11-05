import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLedgerFixture } from './fixtures/ledger';
import * as gitRecords from './gitRecords';
import { checkStagedLedger } from './stagedLedger';

import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LEDGER = 'e2e/ledger';
const SCENARIOS = `${LEDGER}/scenarios/fixture.json`;
const FIXTURES = `${LEDGER}/fixtures.json`;
const temp = realpathSync(tmpdir());
const roots: string[] = [];

const gitEnv = (root: string) => {
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (/^GIT_/i.test(key)) Reflect.deleteProperty(env, key);
  env.GIT_CONFIG_GLOBAL = join(root, 'empty-git-config');
  env.GIT_CONFIG_NOSYSTEM = '1';
  return env;
};

const createRepository = () => {
  const root = mkdtempSync(join(temp, 'staged-ledger-'));
  roots.push(root);
  writeFileSync(join(root, 'empty-git-config'), '');
  const env = gitEnv(root);
  const git = (args: string[], input?: string) =>
    execFileSync('git', ['-C', root, ...args], {
      env,
      input,
      encoding: 'utf8',
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
  const write = (path: string, content: string) => {
    const destination = join(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  };
  const writeJson = (path: string, value: unknown) =>
    write(path, JSON.stringify(value));
  git(['init', '--quiet', '--template=']);
  const ledger = createLedgerFixture();
  writeJson(`${LEDGER}/profiles.json`, ledger.profiles);
  writeJson(FIXTURES, ledger.fixtures);
  writeJson(`${LEDGER}/execution-groups.json`, ledger.executionGroups);
  writeJson(`${LEDGER}/exceptions.json`, ledger.exceptions);
  writeJson(`${LEDGER}/contracts/fixture.json`, ledger.contracts);
  writeJson(SCENARIOS, ledger.scenarios);
  git(['add', '--', LEDGER]);
  return { root, git, ledger, write, writeJson };
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    if (dirname(realpathSync(root)) !== temp)
      throw new Error('一時リポジトリの場所が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('ステージ済み台帳の軽量検査', () => {
  it('indexの壊れたJSONを作業ツリーで修復しても拒否する', () => {
    const { root, git, ledger, write, writeJson } = createRepository();
    write(FIXTURES, '{ secret=fixture-token');
    git(['add', '--', FIXTURES]);
    writeJson(FIXTURES, ledger.fixtures);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  });

  it('indexが正しければ作業ツリーの壊れたJSONを無視する', () => {
    const { root, write } = createRepository();
    write(FIXTURES, '{');
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'passed',
      checks: 'schema-ids-references-only',
      fileCount: 6,
    });
  });

  it('未stageのtestが登録するcaseをindex台帳の欠落に補わない', () => {
    const { root, git, write, writeJson } = createRepository();
    const groups = `${LEDGER}/execution-groups.json`;
    writeJson(groups, [
      { id: 'missing-group', caseIds: ['missing-case'], dependsOn: [] },
    ]);
    git(['add', '--', groups]);
    write('e2e/new.spec.ts', "test('missing-case', () => {})");
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  });

  it('indexのrenameとdeleteを反映し、作業ツリーに残る旧ファイルを無視する', () => {
    const { root, git, ledger, writeJson } = createRepository();
    const destination = `${LEDGER}/scenarios/日程 確定.json`;
    git(['mv', '--', SCENARIOS, destination]);
    writeJson(SCENARIOS, ledger.scenarios);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'passed',
      fileCount: 6,
    });
    git(['rm', '--cached', '--force', '--', destination]);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
    git(['rm', '--cached', '--force', '--', FIXTURES]);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  });

  it('workingに契約が残っていてもindexのcontracts全削除を拒否する', () => {
    const { root, git } = createRepository();
    git([
      'rm',
      '--cached',
      '--force',
      '--',
      `${LEDGER}/contracts/fixture.json`,
    ]);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  });

  it.each(['duplicate', 'unknown-reference'])('%sを拒否する', (kind) => {
    const { root, git, ledger, writeJson } = createRepository();
    if (kind === 'duplicate') {
      const extra = `${LEDGER}/scenarios/duplicate.json`;
      writeJson(extra, ledger.scenarios);
      git(['add', '--', extra]);
    } else {
      writeJson(FIXTURES, []);
      git(['add', '--', FIXTURES]);
    }
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  });

  it('indexの競合stageを拒否する', () => {
    const { root, git } = createRepository();
    const oid = git(['rev-parse', `:${FIXTURES}`]);
    git(
      ['update-index', '--index-info'],
      `0 ${'0'.repeat(oid.length)}\t${FIXTURES}\n100644 ${oid} 2\t${FIXTURES}\n`,
    );
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'INDEX_UNAVAILABLE',
    });
  });

  it('作業ツリーに実体があってもindexのシンボリックリンクを拒否する', () => {
    const { root, git } = createRepository();
    const oid = git(['hash-object', '-w', '--stdin'], 'real-fixtures.json');
    git(['update-index', '--cacheinfo', `120000,${oid},${FIXTURES}`]);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_PATH_UNSUPPORTED',
    });
  });

  it.each([
    'scenarios/fixture.yaml',
    'contracts/nested/fixture.json',
    'extra.json',
  ])('未知の台帳ファイル %s を拒否する', (name) => {
    const { root, git, writeJson } = createRepository();
    const path = `${LEDGER}/${name}`;
    writeJson(path, []);
    git(['add', '--', path]);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_PATH_UNSUPPORTED',
    });
  });

  it('既知のbaseline・生成物の内容は検査対象外と明示する', () => {
    const { root, git, write } = createRepository();
    const paths = [
      `${LEDGER}/pending-baseline.json`,
      `${LEDGER}/inventory.generated.json`,
    ];
    for (const path of paths) write(path, '{');
    git(['add', '--', ...paths]);
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'passed',
      fileCount: 6,
      excluded: expect.arrayContaining(['baseline-and-generated']),
    });
  });

  it('別リポジトリを指すGit環境を除去し、別indexだけは明示的に拒否する', () => {
    const { root, git, write } = createRepository();
    const foreign = createRepository();
    write(FIXTURES, '{');
    git(['add', '--', FIXTURES]);
    vi.stubEnv('GIT_DIR', join(foreign.root, '.git'));
    vi.stubEnv('GIT_WORK_TREE', foreign.root);
    vi.stubEnv('GIT_INDEX_FILE', join(foreign.root, '.git', 'index'));
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'ALTERNATE_INDEX_UNSUPPORTED',
    });
    vi.stubEnv('GIT_INDEX_FILE', join('.git', 'index'));
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  });

  it('検査開始から終了までにindexが変わったら拒否する', () => {
    const { root, git, write } = createRepository();
    const readIndex = gitRecords.readGitIndex;
    vi.spyOn(gitRecords, 'readGitIndex').mockImplementationOnce((...args) => {
      const initial = readIndex(...args);
      write('another-file.txt', 'added during validation');
      git(['add', '--', 'another-file.txt']);
      return initial;
    });
    expect(checkStagedLedger(root)).toMatchObject({
      status: 'failed',
      failure: 'INDEX_CHANGED',
    });
  });

  it('実CLIは壊れたindexを失敗として返し、生の入力を出力しない', () => {
    const { root, git, write } = createRepository();
    const privateText = 'fixture-token=private-text';
    write(FIXTURES, `{${privateText}`);
    git(['add', '--', FIXTURES]);
    const entry = fileURLToPath(new URL('./stagedLedger.ts', import.meta.url));
    const tsx = pathToFileURL(
      createRequire(import.meta.url).resolve('tsx'),
    ).href;
    const env = gitEnv(root);
    for (const name of Object.keys(env)) {
      if (name.toUpperCase() === 'NODE_OPTIONS')
        Reflect.deleteProperty(env, name);
    }
    const output = spawnSync(process.execPath, ['--import', tsx, entry], {
      cwd: root,
      encoding: 'utf8',
      env,
      timeout: 15_000,
      windowsHide: true,
    });
    expect(output.error).toBeUndefined();
    expect(output.status, output.stderr).toBe(1);
    expect(output.stderr).toBe('');
    expect(output.stdout).not.toContain(privateText);
    expect(JSON.parse(output.stdout)).toMatchObject({
      status: 'failed',
      failure: 'LEDGER_CONTENT_INVALID',
    });
  }, 20_000);
});
