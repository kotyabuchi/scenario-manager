import { defineConfig } from 'vitest/config';

import { fileURLToPath } from 'node:url';

// アプリのsetupやDB設定に依存せず、品質ゲート自体を検証する。
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  test: {
    name: 'e2e-tools',
    include: ['scripts/e2e/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
  },
});
