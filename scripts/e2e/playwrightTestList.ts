import { posix } from 'node:path';

type TestListEntry = { project: string; file: string; titlePath: string[] };

/** 登録自体は有効でもtest-listの表記で正確に絞り込めない。 */
export class PlaywrightSelectionRepresentationError extends Error {
  override readonly name = 'PlaywrightSelectionRepresentationError';
}

const token = (value: string) => {
  if (!value || value.trim() !== value || /[›\p{Cc}\u2028\u2029]/u.test(value))
    throw new PlaywrightSelectionRepresentationError(
      'test-listに正確に表現できない登録identityです。',
    );
  return value;
};

export const assertRelativeRunnerPath = (file: string) => {
  if (
    /[\\:\p{Cc}\u2028\u2029]/u.test(file) ||
    file.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error('runnerの登録ファイルpathが不正です。');
};

/** Playwright 1.57のrootDir相対の正確なproject/file/titleを一行にする。 */
export const playwrightTestListLine = (
  rootDir: string,
  entry: TestListEntry,
) => {
  if (rootDir !== '.') assertRelativeRunnerPath(rootDir);
  assertRelativeRunnerPath(entry.file);
  // 依存projectのtestDirがrootDirの兄弟でも、repo内の正規path同士なら選択できる。
  const file = posix.relative(rootDir, entry.file);
  // 無名projectも [] で明示できる。projectを省略すると他projectにも一致する。
  const project = entry.project === '' ? '' : token(entry.project);
  if (/[[\]]/u.test(project))
    throw new PlaywrightSelectionRepresentationError(
      'test-listに正確に表現できないproject名です。',
    );
  return [`[${project}]`, token(file), ...entry.titlePath.map(token)].join(
    ' › ',
  );
};
