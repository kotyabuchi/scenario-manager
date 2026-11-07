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
    // 子プロセスの負荷を考慮し、並列度の半分をワーカー上限とする（最小1・最大4）。
    maxWorkers: Math.max(
      1,
      Math.min(MAX_TOOL_WORKERS, Math.floor(availableParallelism() / 2)),
    ),
    passWithNoTests: false,
  },
});
