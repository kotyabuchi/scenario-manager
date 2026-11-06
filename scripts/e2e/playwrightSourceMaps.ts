import { realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/** 列挙と実行の登録位置を同じ原TS座標へ統一する。副作用guardは実行へ持ち込まない。 */
export const playwrightSourceMapOptions = async (cli: string) => ({
  args: [
    '--enable-source-maps',
    '--require',
    fileURLToPath(new URL('./discoverySourceMaps.cjs', import.meta.url)),
  ],
  env: {
    E2E_DISCOVERY_PLAYWRIGHT_PACKAGE: await realpath(
      createRequire(cli).resolve('playwright/package.json'),
    ),
  },
});
