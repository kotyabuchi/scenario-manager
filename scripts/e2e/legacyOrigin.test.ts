import { afterEach, describe, expect, it, vi } from 'vitest';

import { legacyKey } from './legacy';
import { verifyLegacyOrigins } from './legacyOrigin';
import { readRevisionFile } from './trustedRevision';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

vi.mock('./trustedRevision', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./trustedRevision')>();
  return { ...actual, readRevisionFile: vi.fn(actual.readRevisionFile) };
});

const roots: string[] = [];
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

const registration = () => {
  const test = {
    file: 'e2e/original.spec.ts',
    titlePath: ['元のsuite', '元のtest'],
    project: 'chromium',
    repeatEachIndex: 0,
    expectedStatus: 'passed' as const,
    annotations: [],
    profile: 'app',
    fingerprint: 'a'.repeat(64),
    serialGroup: null,
  };
  return { ...test, key: legacyKey(test.profile, test) };
};

// trustedRevision.testと同じ実Git fixture手順で、worktreeとobjectを独立させる。
const fixture = (bucket = 'tests') => {
  const root = mkdtempSync(join(tmpdir(), 'e2e-legacy-origin-'));
  roots.push(root);
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--object-format=sha1');
  git('config', 'user.name', 'Origin fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'commit.gpgsign', 'false');
  const write = (file: string, contents: string) => {
    const target = join(root, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  const commit = () => {
    git('add', '--all');
    git(
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '--allow-empty',
      '-m',
      'fixture',
    );
    return git('rev-parse', 'HEAD');
  };
  const original = registration();
  const manifest = {
    schemaVersion: 1,
    tests: bucket === 'tests' ? [original] : [],
    registered:
      bucket === 'registered'
        ? [
            {
              ...original,
              caseId: 'old',
              variant: 'default',
              binding: 'binding',
            },
          ]
        : [],
    setups: bucket === 'setups' ? [original] : [],
    groups: [],
  };
  const writeManifest = () =>
    write('e2e/ledger/legacy-tests.generated.json', JSON.stringify(manifest));
  writeManifest();
  const revision = commit();
  const entry = {
    key: original.key,
    fingerprint: original.fingerprint,
    disposition: 'replacement' as const,
    reason: '隔離appで置換',
    origin: { revision, registration: structuredClone(original) },
    replacement: { caseId: 'case', variant: 'default', binding: 'binding' },
  };
  const execution = { schemaVersion: 1, entries: [entry] };
  return {
    root,
    git,
    write,
    commit,
    manifest,
    writeManifest,
    revision,
    entry,
    execution,
  };
};

describe('replacement originのGit object証明', () => {
  it('同じrevisionは一度だけ取得し、working treeの偽造を参照しない', async () => {
    const input = fixture();
    input.write('e2e/ledger/legacy-tests.generated.json', '{}');
    input.execution.entries.push(structuredClone(input.entry));
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).resolves.toBeUndefined();
    expect(readRevisionFile).toHaveBeenCalledTimes(1);
  });

  it('通常legacyにはGit object読取もGit repositoryも不要', async () => {
    await expect(
      verifyLegacyOrigins('missing-repository', {
        schemaVersion: 1,
        entries: [
          { key: 'legacy', fingerprint: 'a'.repeat(64), disposition: 'local' },
        ],
      }),
    ).resolves.toBeUndefined();
    expect(readRevisionFile).not.toHaveBeenCalled();
  });

  it.each([
    'fingerprint',
    'expectedStatus',
    'annotations',
    'serialGroup',
  ] as const)('旧登録の%sが異なれば拒否する', async (field) => {
    const input = fixture();
    Object.assign(input.entry.origin.registration, {
      [field]: {
        fingerprint: 'b'.repeat(64),
        expectedStatus: 'failed',
        annotations: [{ type: 'note', description: '偽造' }],
        serialGroup: '偽造',
      }[field],
    });
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('旧app登録');
  });

  it('executionのfingerprintが元bodyと異なれば拒否する', async () => {
    const input = fixture();
    input.entry.fingerprint = 'b'.repeat(64);
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('旧app登録');
  });

  it.each([
    'registered',
    'setups',
  ])('%sからの付け替えを拒否する', async (bucket) => {
    const input = fixture(bucket);
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('旧app登録');
  });

  it('未来commitと別branchのcommitを拒否する', async () => {
    const input = fixture();
    input.write('future.txt', 'future');
    const future = input.commit();
    input.git('checkout', '--detach', input.revision);
    input.entry.origin.revision = future;
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('祖先');
    input.write('other.txt', 'other');
    input.commit();
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('祖先');
  });

  it('graftで偽装した別branchの祖先を拒否し、正当な祖先は維持する', async () => {
    const input = fixture();
    input.write('forged.txt', 'forged');
    const forged = input.commit();
    input.git('checkout', '--detach', input.revision);
    input.write('head.txt', 'head');
    const head = input.commit();
    input.write('.git/info/grafts', `${head} ${forged}\n`);
    // 実Gitがgraftを尊重して偽祖先を認めるfixtureであることを確認する。
    expect(
      input.git(
        '--no-replace-objects',
        'merge-base',
        '--is-ancestor',
        forged,
        'HEAD',
      ),
    ).toBe('');
    input.entry.origin.revision = forged;
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('祖先');
    input.entry.origin.revision = input.revision;
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).resolves.toBeUndefined();
  });

  it('存在しないobjectとmanifest欠落を拒否する', async () => {
    const input = fixture();
    input.entry.origin.revision = '0'.repeat(40);
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('祖先');
    input.git('rm', 'e2e/ledger/legacy-tests.generated.json');
    input.entry.origin.revision = input.commit();
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).rejects.toThrow('manifest');
  });

  it('外部GIT_DIRとreplace refを無効化して元objectを照合する', async () => {
    const input = fixture();
    input.manifest.tests[0] = {
      ...input.entry.origin.registration,
      fingerprint: 'b'.repeat(64),
    };
    input.writeManifest();
    const replacement = input.commit();
    input.git('replace', input.revision, replacement);
    vi.stubEnv('GIT_DIR', join(input.root, 'missing-git'));
    await expect(
      verifyLegacyOrigins(input.root, input.execution),
    ).resolves.toBeUndefined();
  });
});
