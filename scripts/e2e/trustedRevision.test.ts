import { afterEach, describe, expect, it } from 'vitest';

import { createLedgerFixture } from './fixtures/ledger';
import {
  readRevisionFile,
  readRevisionLedger,
  resolveRevisions,
  verifyBootstrapApproval,
} from './trustedRevision';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

const fixture = (format = 'sha1') => {
  const root = mkdtempSync(join(tmpdir(), 'e2e-trusted-revision-'));
  roots.push(root);
  const git = (args: string[], input?: string) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      input,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  git(['init', `--object-format=${format}`]);
  git(['config', 'user.name', 'Revision fixture']);
  git(['config', 'user.email', 'fixture@example.invalid']);
  git(['config', 'commit.gpgsign', 'false']);
  git(['config', 'core.autocrlf', 'false']);
  const write = (file: string, contents: string) => {
    const target = join(root, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  const commit = () => {
    git(['add', '--all']);
    git([
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '--allow-empty',
      '-m',
      'fixture',
    ]);
    return git(['rev-parse', 'HEAD']);
  };
  write('original.txt', 'base');
  const base = commit();
  write('original.txt', 'head');
  const head = commit();
  const env = {
    ...process.env,
    CI: '1',
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: join(root, 'event.json'),
    GITHUB_SHA: head,
    GITHUB_REF: 'refs/pull/1/merge',
    GITHUB_REPOSITORY: 'owner/repository',
  };
  const event = (
    payload: unknown = {
      number: 1,
      pull_request: {
        base: {
          sha: base,
          ref: 'main',
          repo: { full_name: env.GITHUB_REPOSITORY },
        },
        head: { sha: head },
      },
    },
  ) => {
    writeFileSync(env.GITHUB_EVENT_PATH, JSON.stringify(payload));
    return env;
  };
  return { root, git, write, commit, base, head, env: event(), event };
};

describe('比較元revisionの信頼境界', () => {
  it.each([
    'sha1',
    'sha256',
  ])('%sのeventからbase/headを固定する', async (format) => {
    const { root, base, head, env } = fixture(format);
    expect(await resolveRevisions({ root, env })).toMatchObject({
      base,
      head,
      mode: 'ci',
      eventPolicy: {
        event: 'pull_request',
        staticBase: { kind: 'comparison', sha: base },
        impactBase: base,
      },
    });
  });

  it('CIではsource側のbase指定を採用しない', async () => {
    const { root, env, base, head } = fixture();
    await expect(resolveRevisions({ root, env, base: 'HEAD' })).rejects.toThrow(
      '上書き',
    );
    expect(
      await resolveRevisions({
        root,
        env: { ...env, CI: 'false', E2E_BASE: 'HEAD' },
      }),
    ).toMatchObject({ base, head, mode: 'ci' });
  });

  it.each([
    {},
    { pull_request: { base: { sha: 'main' }, head: { sha: 'a'.repeat(40) } } },
    { pull_request: { base: { sha: 'a'.repeat(40) }, head: { sha: 'HEAD' } } },
    {
      pull_request: {
        base: { sha: '0'.repeat(40) },
        head: { sha: 'a'.repeat(40) },
      },
    },
  ])('欠落・不正・存在しないevent SHAを拒否する: %j', async (payload) => {
    const { root, event } = fixture();
    await expect(
      resolveRevisions({ root, env: event(payload) }),
    ).rejects.toThrow();
  });

  it('存在しないbaseからfallbackしない', async () => {
    const { root, event, head } = fixture();
    await expect(
      resolveRevisions({
        root,
        env: event({
          number: 1,
          pull_request: {
            base: {
              sha: 'a'.repeat(40),
              ref: 'main',
              repo: { full_name: 'owner/repository' },
            },
            head: { sha: head },
          },
        }),
      }),
    ).rejects.toThrow();
  });

  it('merge commit等をcheckoutしたHEAD不一致を拒否する', async () => {
    const { root, env, base, git } = fixture();
    git(['checkout', '--detach', base]);
    await expect(resolveRevisions({ root, env })).rejects.toThrow('HEAD');
  });

  it.each([
    'merge_group',
    'pull_request_target',
    '',
  ])('未対応event %sを拒否する', async (name) => {
    const { root, env } = fixture();
    await expect(
      resolveRevisions({ root, env: { ...env, GITHUB_EVENT_NAME: name } }),
    ).rejects.toThrow('イベント');
  });

  it('eventファイル未設定・未取得・壊れたJSONを拒否する', async () => {
    const { root, env, write } = fixture();
    await expect(
      resolveRevisions({ root, env: { ...env, GITHUB_EVENT_PATH: '' } }),
    ).rejects.toThrow();
    await expect(
      resolveRevisions({
        root,
        env: { ...env, GITHUB_EVENT_PATH: join(root, 'missing') },
      }),
    ).rejects.toThrow();
    write('event.json', '{');
    await expect(resolveRevisions({ root, env })).rejects.toThrow();
  });

  it('ローカルは明示refだけを解決し、暗黙HEADを使わない', async () => {
    const { root, env, base, head } = fixture();
    const local = { ...env, CI: '', GITHUB_ACTIONS: '' };
    expect(
      await resolveRevisions({ root, env: local, base: 'HEAD~1' }),
    ).toEqual({ base, head, mode: 'local' });
    await expect(resolveRevisions({ root, env: local })).rejects.toThrow(
      '明示',
    );
    await expect(
      resolveRevisions({ root, env: local, base: 'unknown-ref' }),
    ).rejects.toThrow();
  });
});

describe('Git objectからの比較元読込', () => {
  it('working treeの変更とreplace refに影響されず指定commitを読む', () => {
    const { root, base, head, git, write } = fixture();
    write('original.txt', 'untrusted working tree');
    git(['replace', base, head]);
    expect(readRevisionFile(root, base, 'original.txt')).toBe('base');
    expect(readRevisionFile(root, head, 'original.txt')).toBe('head');
    expect(readRevisionFile(root, base, 'missing.txt')).toBeUndefined();
  });

  it.each([
    '../outside',
    '/absolute',
    'a\\b',
    'a/../b',
    '',
    'a:b',
    'a//b',
  ])('不正path %sは不存在扱いにしない', (file) => {
    const { root, base } = fixture();
    expect(() => readRevisionFile(root, base, file)).toThrow('path');
  });

  it('commit不在・git失敗をundefinedにしない', () => {
    const { root, base } = fixture();
    expect(() => readRevisionFile(root, 'b'.repeat(40), 'missing')).toThrow();
    expect(() => readRevisionFile(root, 'HEAD', 'missing')).toThrow();
    expect(() =>
      readRevisionFile(join(root, 'absent'), base, 'missing'),
    ).toThrow();
  });

  it('symlink自身とその配下、directory、上限超過blobを拒否する', async () => {
    const { root, git, write, commit } = fixture();
    write('folder/item.json', '[]');
    write('large.json', 'x'.repeat(8 * 1024 * 1024 + 1));
    const revision = commit();
    expect(() => readRevisionFile(root, revision, 'folder')).toThrow(
      'ファイルでは',
    );
    expect(() => readRevisionFile(root, revision, 'large.json')).toThrow(
      'サイズ',
    );
    const blob = git(['hash-object', '-w', '--stdin'], '../outside');
    const tree = git(['mktree'], `120000 blob ${blob}\te2e\n`);
    const linkCommit = git(['commit-tree', tree, '-m', 'symlink fixture']);
    expect(() => readRevisionFile(root, linkCommit, 'e2e')).toThrow(
      '通常ファイル',
    );
    expect(() =>
      readRevisionFile(root, linkCommit, 'e2e/ledger/profiles.json'),
    ).toThrow('辿れません');
    await expect(readRevisionLedger(root, linkCommit)).rejects.toThrow(
      '辿れません',
    );
  });

  it('台帳未導入と部分欠落・壊れた台帳を区別し、base内collectionを読む', async () => {
    const { root, base, write, commit } = fixture();
    expect(await readRevisionLedger(root, base)).toBeUndefined();
    const ledger = createLedgerFixture();
    const files = {
      'profiles.json': ledger.profiles,
      'fixtures.json': ledger.fixtures,
      'exceptions.json': ledger.exceptions,
      'execution-groups.json': ledger.executionGroups,
      'contracts/schedule.json': ledger.contracts,
      'scenarios/schedule.json': ledger.scenarios,
    };
    write('e2e/ledger/profiles.json', JSON.stringify(ledger.profiles));
    await expect(readRevisionLedger(root, commit())).rejects.toThrow(
      '部分欠落',
    );
    for (const [file, value] of Object.entries(files))
      write(`e2e/ledger/${file}`, JSON.stringify(value));
    const complete = commit();
    write('e2e/ledger/profiles.json', '[]');
    expect(await readRevisionLedger(root, complete)).toEqual(ledger);
    await expect(readRevisionLedger(root, commit())).rejects.toThrow('profile');
    write('e2e/ledger/profiles.json', '{');
    const broken = commit();
    await expect(readRevisionLedger(root, broken)).rejects.toMatchObject({
      message: `e2e/ledger/profiles.json (${broken}): JSONを解析できません`,
      cause: expect.any(SyntaxError),
    });
  }, 15_000);
});

describe('bootstrapの外部承認', () => {
  const approved = {
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    digest: 'c'.repeat(64),
  };
  it('正確なbase/head/digestだけを承認する', () => {
    expect(() =>
      verifyBootstrapApproval(approved, JSON.stringify(approved)),
    ).not.toThrow();
  });
  it.each([
    'base',
    'head',
    'digest',
  ] as const)('%s変更後の古い承認を拒否する', (field) => {
    expect(() =>
      verifyBootstrapApproval(
        { ...approved, [field]: 'd'.repeat(field === 'digest' ? 64 : 40) },
        JSON.stringify(approved),
      ),
    ).toThrow('一致');
  });
  it.each([
    undefined,
    '',
    'true',
    '{',
    JSON.stringify({ bootstrap: true }),
    JSON.stringify({ ...approved, bootstrap: true }),
  ])('欠落・不正・flagだけの承認を拒否する: %s', (raw) => {
    expect(() => verifyBootstrapApproval(approved, raw)).toThrow();
  });
});
