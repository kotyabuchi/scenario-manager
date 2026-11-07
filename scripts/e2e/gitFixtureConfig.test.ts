import { expect, it, onTestFinished } from 'vitest';

import { appendGitFixtureConfig } from './fixtures/gitFixtureConfig';

import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

it('実 Git の初期設定と SHA 形式を保持し、別 fixture の設定は変更しない', () => {
  const temp = realpathSync.native(tmpdir());
  const parent = mkdtempSync(join(temp, 'e2e-git-fixture-config-'));
  onTestFinished(() => {
    if (dirname(realpathSync.native(parent)) !== temp)
      throw new Error('Git fixture設定テストの削除先が不正です');
    rmSync(parent, { recursive: true, force: true });
  });
  const git = (root: string, ...args: string[]) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: 'pipe',
    });

  const snapshot = mkdtempSync(join(parent, 'snapshot-'));
  const revision = mkdtempSync(join(parent, 'revision-'));
  const repos = [
    [snapshot, 'sha1'],
    [revision, 'sha256'],
  ] as const;
  for (const [root, format] of repos) {
    git(
      root,
      '-c',
      'init.defaultBranch=fixture-default',
      'init',
      '--template=',
      `--object-format=${format}`,
    );
  }
  appendGitFixtureConfig(snapshot, 'Snapshot fixture');
  appendGitFixtureConfig(revision, 'Revision fixture');

  git(snapshot, 'config', '--local', 'user.email', 'other@example.invalid');
  for (const [root, format] of repos) {
    const isSnapshot = root === snapshot;
    const settings = {
      'user.name': isSnapshot ? 'Snapshot fixture' : 'Revision fixture',
      'user.email': isSnapshot
        ? 'other@example.invalid'
        : 'fixture@example.invalid',
      'commit.gpgsign': 'false',
      'core.autocrlf': 'false',
    };
    for (const [key, value] of Object.entries(settings)) {
      expect(
        git(root, 'config', '--local', '--get-all', key).trim().split('\n'),
      ).toEqual([value]);
    }
    expect(git(root, 'rev-parse', '--show-object-format').trim()).toBe(format);
    expect(git(root, 'symbolic-ref', 'HEAD').trim()).toBe(
      'refs/heads/fixture-default',
    );
  }
});
