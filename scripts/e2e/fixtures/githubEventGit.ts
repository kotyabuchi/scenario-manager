import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** イベント比較に必要なGit objectだけを持つ一時repoを作る。 */
export const createGithubEventGit = () => {
  const temp = realpathSync(tmpdir());
  const root = mkdtempSync(join(temp, 'e2e-github-event-'));
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: 'pipe',
    }).trim();
  const write = (path: string, contents: string) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
  };
  const cleanup = () => {
    if (dirname(realpathSync(root)) !== temp)
      throw new Error('GitHubイベントfixtureの削除先が不正です');
    rmSync(root, { recursive: true, force: true });
  };
  git('init', '--quiet', '--object-format=sha1');
  git('config', 'user.name', 'Event fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'commit.gpgsign', 'false');
  const commit = (name: string) => {
    write('file.txt', name);
    git('add', '--all');
    git('-c', 'core.hooksPath=', 'commit', '--quiet', '-m', name);
    return git('rev-parse', 'HEAD');
  };
  return { root, git, write, commit, cleanup };
};
