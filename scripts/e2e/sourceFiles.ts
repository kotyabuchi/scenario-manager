const SOURCE_EXTENSION = /\.(?:tsx?|jsx?)$/;
const EXCLUDED_DIRECTORY =
  /(?:^|\/)(?:__tests__|__mocks__|__fixtures__|__generated__)(?:\/|$)/;
const EXCLUDED_FILE =
  /\.(?:d|test|spec|stories|story|generated)\.(?:tsx?|jsx?)$/;
const STORY_EXTENSION = /\.(?:stories|story)\.(?:tsx?|jsx?)$/;

/** Git pathで表したsourceが抽出入口かを、本番と構文fixtureで共用する。 */
export const isSourceEntry = (file: string) =>
  file.startsWith('src/') &&
  SOURCE_EXTENSION.test(file) &&
  !EXCLUDED_DIRECTORY.test(file) &&
  !EXCLUDED_FILE.test(file) &&
  !file.startsWith('src/styled-system/') &&
  file !== 'src/db/types.ts';

/** Storybook用Programだけに含める、Git管理上のCSF入口。 */
export const isStorySourceEntry = (file: string) =>
  file.startsWith('src/') &&
  STORY_EXTENSION.test(file) &&
  !EXCLUDED_DIRECTORY.test(file) &&
  !file.startsWith('src/styled-system/');

/** Pandaの既知生成rootだけを、業務関数の解析対象外のlibrary境界とする。 */
export const isGeneratedLibraryPath = (file: string) =>
  file.startsWith('styled-system/') &&
  !file.split('/').some((segment) => segment === '..' || segment === '.') &&
  /\.(?:[cm]?js|ts)$/.test(file);
