// Next 16 writeAppTypeDeclarationsとnext.config.tsのdistDirだけを認める。
// buildごとのrun ID・EOL・初回未生成は実入力の差として扱わない。
const PREFIX =
  '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n';
const SUFFIX =
  '\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n';
const ROUTE_IMPORT =
  /^import "\.\/(?:\.next|\.next-e2e(?:\/run-[a-f0-9]{12})?)\/types\/routes\.d\.ts";$/;

/** 任意コード・追加directive・未知distDirを許可せず、既知templateだけを正規化する。 */
export const normalizeNextEnv = (bytes?: Buffer): Buffer => {
  if (bytes) {
    const text = bytes.toString('utf8').replaceAll('\r\n', '\n');
    if (
      !text.startsWith(PREFIX) ||
      !text.endsWith(SUFFIX) ||
      !ROUTE_IMPORT.test(text.slice(PREFIX.length, -SUFFIX.length))
    )
      throw new Error('next-env.d.tsが既知のNext生成templateと一致しません');
  }
  return Buffer.from(`${PREFIX}import "./.next/types/routes.d.ts";${SUFFIX}`);
};
