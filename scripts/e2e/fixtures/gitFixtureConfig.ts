import {
  appendFileSync,
  closeSync,
  constants,
  lstatSync,
  openSync,
  realpathSync,
} from 'node:fs';
import { join } from 'node:path';

/** 実 Git が初期化した物理 fixture に、テスト用の固定設定を追記する。 */
export const appendGitFixtureConfig = (
  root: string,
  name: 'Snapshot fixture' | 'Revision fixture',
) => {
  const config = join(root, '.git', 'config');
  if (!lstatSync(config).isFile() || realpathSync.native(config) !== config) {
    throw new Error('Git fixtureの設定ファイルが不正です');
  }

  // Git が書いた core/extensions を保持し、既存ファイルにだけ追記する。
  const fd = openSync(
    config,
    constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    appendFileSync(
      fd,
      [
        '',
        '[user]',
        `\tname = ${name}`,
        '\temail = fixture@example.invalid',
        '[commit]',
        '\tgpgsign = false',
        '[core]',
        '\tautocrlf = false',
        '',
      ].join('\n'),
    );
  } finally {
    closeSync(fd);
  }
};
