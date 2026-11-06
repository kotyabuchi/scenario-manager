import { defineConfig } from '@playwright/test';

import isolated from './playwright.isolated.config';

// 基盤の受入検査。業務caseのverified結果には数えない。
export default defineConfig(isolated, {
  testDir: './scripts/e2e/fixtures/browser',
});
