import { defineConfig } from '@playwright/test';
import { isNil } from 'ramda';

import { DESKTOP_DEVICE, MOBILE_DEVICE } from './e2e/devices';
import {
  LEGACY_STATE_FILE,
  legacyProjectSchema,
} from './e2e/fixtures/legacySchema';
import { ISOLATED_BASE_URL } from './e2e/isolatedRuntime';
import { playwrightVerificationReporter } from './scripts/e2e/verificationContext';

const runId = process.env.SCENARIO_E2E_RUN_ID ?? 'unconfigured';
if (runId !== 'unconfigured' && !/^[a-f0-9]{12}$/.test(runId))
  throw new Error('専用run IDが不正です。');
const project = process.env.SCENARIO_E2E_LEGACY_PROJECT;
const selected = isNil(project)
  ? undefined
  : legacyProjectSchema.parse(project);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: './scripts/e2e/legacySetup.ts',
  outputDir: `test-results/legacy/${runId}/artifacts`,
  reporter: [
    ['list'],
    ...playwrightVerificationReporter(
      './scripts/e2e/reporters/results.ts',
      'app',
    ),
    ['json', { outputFile: `test-results/legacy/${runId}/playwright.json` }],
  ],
  use: {
    baseURL: ISOLATED_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 5_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...DESKTOP_DEVICE },
      testIgnore: [/auth/, /isolated/],
    },
    {
      name: 'mobile-chrome',
      use: { ...MOBILE_DEVICE },
      testIgnore: [/auth/, /isolated/],
    },
    {
      name: 'chromium-auth',
      testDir: './e2e/auth',
      use: { ...DESKTOP_DEVICE, storageState: LEGACY_STATE_FILE },
    },
    {
      name: 'mobile-chrome-auth',
      testDir: './e2e/auth',
      use: { ...MOBILE_DEVICE, storageState: LEGACY_STATE_FILE },
    },
  ].filter((value) => isNil(selected) || value.name === selected),
});
