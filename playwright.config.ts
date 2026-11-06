import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * E2Eテスト用のPlaywright設定
 * @see https://playwright.dev/docs/test-configuration
 */

/** E2E専用ポート（dev の 3000 と分離して衝突を防ぐ）。test:e2e は 3100 を使用 */
const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
/** 既存サーバー再利用モード（test:e2e:dev / :ui / :headed で有効）。高速反復・デバッグ用 */
const E2E_REUSE = process.env.E2E_REUSE === '1';
const BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  /* HTMLレポーターの自動起動（9323番）を抑止。閲覧は `pnpm exec playwright show-report` */
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],

  /* テスト全体のタイムアウト */
  timeout: 30_000,

  use: {
    baseURL: BASE_URL,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    /* 個々のアクション（click, fill等）のタイムアウト */
    actionTimeout: 5_000,
  },

  expect: {
    timeout: 10_000,
  },

  projects: [
    /* 認証セットアップ（auth.setup.ts のみ実行） */
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },

    /* 公開ページ用（認証不要） */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/auth/],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: [/auth/],
    },

    /* 認証必須ページ用 */
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testDir: 'e2e/auth',
      dependencies: ['auth-setup'],
    },
    {
      name: 'mobile-chrome-auth',
      use: {
        ...devices['Pixel 7'],
        storageState: 'e2e/.auth/user.json',
      },
      testDir: 'e2e/auth',
      dependencies: ['auth-setup'],
    },
  ],

  webServer: {
    /*
     * 既定（CI / test:e2e）: 本番ビルドを起動して決定論的に検証（dev サーバーのコンパイル遅延・HMRを排除）。
     * 再利用モード（test:e2e:dev / :ui / :headed）: 既存の dev サーバー（3000）を再利用し高速に反復。
     */
    command: E2E_REUSE ? 'pnpm dev' : `pnpm build && pnpm start -p ${E2E_PORT}`,
    env: E2E_REUSE ? {} : { SCENARIO_E2E_BUILD: '1' },
    url: BASE_URL,
    reuseExistingServer: E2E_REUSE,
    timeout: 180_000,
  },
});
