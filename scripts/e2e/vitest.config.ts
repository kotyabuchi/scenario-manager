import { defineConfig } from 'vitest/config';

import { fileURLToPath } from 'node:url';

// アプリのsetupやDB設定に依存せず、ローカルテスト基盤を検証する。
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  test: {
    name: 'legacy-tools',
    include: ['scripts/e2e/**/*.test.ts'],
    exclude: ['scripts/e2e/fixtures/**'],
    environment: 'node',
    // Git・TypeScript・Playwright子プロセスの同時起動を抑える。
    maxWorkers: 2,
    passWithNoTests: false,
  },
});
