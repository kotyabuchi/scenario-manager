import { isNil } from 'ramda';

import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

/** 台帳の固定出力を扱うときも、既存のsymlink/junctionでルート外へ出ない。 */
const artifactPath = (root: string, file: string) => {
  const physicalRoot = realpathSync(root);
  const target = resolve(physicalRoot, file);
  const check = (candidate: string) => {
    const path = relative(physicalRoot, candidate);
    if (
      !path ||
      isAbsolute(path) ||
      path === '..' ||
      path.startsWith(`..${sep}`)
    )
      throw new Error(
        '台帳artifactはプロジェクト内のファイルに限定してください',
      );
  };
  check(target);
  let ancestor = target;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  if (ancestor !== physicalRoot) check(realpathSync(ancestor));
  return target;
};

/** 不在と読込失敗を区別し、通常検査ではファイルを変更しない。 */
export const readArtifact = (
  root: string,
  file: string,
): string | undefined => {
  const target = artifactPath(root, file);
  try {
    return readFileSync(target, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return undefined;
    throw error;
  }
};

/** bootstrap・明示的更新からのみ呼び、既存artifactを原子的に置換する。 */
export const writeArtifact = (root: string, file: string, contents: string) => {
  const target = artifactPath(root, file);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, contents, { encoding: 'utf8', flag: 'wx' });
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
};

/** JSONの欠落・破損には対象名を付けて失敗させる。 */
export const parseArtifact = (
  contents: string | undefined,
  file: string,
): unknown => {
  if (isNil(contents)) throw new Error(`${file}: 必須artifactがありません`);
  try {
    return JSON.parse(contents);
  } catch (cause) {
    throw new Error(`${file}: JSONを解析できません`, { cause });
  }
};
