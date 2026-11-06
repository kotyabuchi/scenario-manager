import { defineConfig } from '@playwright/test';
import { isNil } from 'ramda';

import { ISOLATED_STORYBOOK_PORT } from '../e2e/isolatedRuntime';
import {
  playwrightVerificationReporter,
  readVerificationContext,
} from '../scripts/e2e/verificationContext';

import { fileURLToPath } from 'node:url';

const isVerification = !isNil(readVerificationContext());

// アプリの認証・共有DBを使わず、Storybookの部品だけをブラウザーで検証する。
export default defineConfig({
  testDir: './tests',
  outputDir: '../test-results/storybook',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: [
    ['list'],
    ...playwrightVerificationReporter(
      '../scripts/e2e/reporters/results.ts',
      'storybook',
    ),
  ],
  use: {
    baseURL: `http://127.0.0.1:${ISOLATED_STORYBOOK_PORT}`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    // 開発中の依存関係の再最適化を避け、毎回その時点のビルドを検証する。
    // 通常のStorybookとはポートを分け、起動中の古い画面を使い回さない。
    command: isVerification
      ? 'node --import tsx scripts/e2e/storybookVerificationServer.ts'
      : `pnpm exec storybook build --output-dir node_modules/.cache/storybook-browser-tests --disable-telemetry && pnpm exec vite preview --outDir node_modules/.cache/storybook-browser-tests --host 127.0.0.1 --port ${ISOLATED_STORYBOOK_PORT} --strictPort`,
    url: `http://127.0.0.1:${ISOLATED_STORYBOOK_PORT}/index.json`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
