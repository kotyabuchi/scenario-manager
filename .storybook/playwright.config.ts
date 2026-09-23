import { defineConfig } from '@playwright/test';

import { fileURLToPath } from 'node:url';

// アプリの認証・共有DBを使わず、Storybookの部品だけをブラウザーで検証する。
export default defineConfig({
  testDir: './tests',
  outputDir: '../test-results/storybook',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:6007',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    // 開発中の依存関係の再最適化を避け、毎回その時点のビルドを検証する。
    // 通常のStorybookとはポートを分け、起動中の古い画面を使い回さない。
    command:
      'pnpm exec storybook build --output-dir node_modules/.cache/storybook-browser-tests --disable-telemetry && pnpm exec vite preview --outDir node_modules/.cache/storybook-browser-tests --host 127.0.0.1 --port 6007 --strictPort',
    url: 'http://127.0.0.1:6007/index.json',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
