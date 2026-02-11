import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * E2Eテスト用のPlaywright設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: process.env.CI ? [['list'], ['html']] : 'html',

  /* テスト全体のタイムアウト */
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
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
    command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
