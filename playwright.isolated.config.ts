import { defineConfig } from '@playwright/test';

import { DESKTOP_DEVICE, MOBILE_DEVICE } from './e2e/devices';
import { ISOLATED_BASE_URL } from './e2e/isolatedRuntime';
import { playwrightVerificationReporter } from './scripts/e2e/verificationContext';

// --listはDB不要。実行時のfixtureが専用設定の欠落・所有不一致を拒否する。
const runId = process.env.SCENARIO_E2E_RUN_ID ?? 'unconfigured';
if (runId !== 'unconfigured' && !/^[a-f0-9]{12}$/.test(runId))
  throw new Error('isolated run IDが不正です。');

export default defineConfig({
  testDir: './e2e/isolated',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  timeout: 60_000,
  outputDir: `test-results/isolated/${runId}/artifacts`,
  reporter: [
    ['list'],
    ...playwrightVerificationReporter(
      './scripts/e2e/reporters/results.ts',
      'isolated',
    ),
    ['json', { outputFile: `test-results/isolated/${runId}/playwright.json` }],
  ],
  use: {
    baseURL: ISOLATED_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  expect: { timeout: 10_000 },
  projects: [
    { name: 'chromium', use: { ...DESKTOP_DEVICE } },
    { name: 'mobile-chrome', use: { ...MOBILE_DEVICE } },
  ],
});
