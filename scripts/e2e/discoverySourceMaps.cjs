// Playwright 1.57の列挙・実行で、ESMキャッシュ配信前も登録位置を同じ元TSへ逆引きする。
// 公開reporterに補正を加えず、runner自身のwrapCallSiteで一度だけ変換する。
const { findSourceMap } = require('node:module');
const { dirname, isAbsolute, join, relative, sep } = require('node:path');
const { fileURLToPath } = require('node:url');

const packageFile = process.env.E2E_DISCOVERY_PLAYWRIGHT_PACKAGE;
if (!packageFile || !isAbsolute(packageFile)) {
  throw new Error('実行するPlaywright package.jsonの絶対パスが必要です');
}
const { name, version } = require(packageFile);
if (name !== 'playwright' || version !== '1.57.0') {
  throw new Error(
    `source map adapterはPlaywright 1.57.0で検証済みです: ${version}`,
  );
}
const { sourceMapSupport } = require(
  join(dirname(packageFile), 'lib/utilsBundle.js'),
);
sourceMapSupport.install({
  environment: 'node',
  handleUncaughtExceptions: false,
  retrieveSourceMap(source) {
    const sourceMap = findSourceMap(source);
    if (!sourceMap) return null;
    const file = source.startsWith('file:') ? fileURLToPath(source) : source;
    const payload = sourceMap.payload;
    // Nodeはsourcesをfile URLへ正規化する。Playwright同梱consumerには相対pathで渡す。
    return {
      url: source,
      map: {
        ...payload,
        sourceRoot: '',
        sources: payload.sources.map((original) =>
          relative(
            dirname(file),
            original.startsWith('file:') ? fileURLToPath(original) : original,
          )
            .split(sep)
            .join('/'),
        ),
      },
    };
  },
});
