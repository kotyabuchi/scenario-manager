import { defineConfig } from 'vitest/config';

import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';

const MAX_TOOL_WORKERS = 4;

// アプリのsetupやDB設定に依存せず、品質ゲート自体を検証する。
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  test: {
    name: 'e2e-tools',
    include: ['scripts/e2e/**/*.test.ts'],
    exclude: ['scripts/e2e/fixtures/**'],
    environment: 'node',
    // テストワーカーは利用可能な並列度と測定済みの4以下に抑える。
    maxWorkers: Math.min(MAX_TOOL_WORKERS, availableParallelism()),
    passWithNoTests: false,
  },
});
