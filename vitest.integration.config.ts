import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import { assertIntegrationEnvironment } from './scripts/e2e/integrationEnvironment';
import {
  escapeTestPathForGlob,
  getTestProjects,
} from './scripts/e2e/testClassification';

import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// testファイルのskipや早期returnより前に専用環境の設定を検査する。
assertIntegrationEnvironment(process.env);

export default defineConfig({
  root,
  plugins: [tsconfigPaths()],
  esbuild: { jsx: 'automatic' },
  test: {
    name: 'integration-legacy',
    include: getTestProjects(root).integration.map(escapeTestPathForGlob),
    environment: 'node',
    setupFiles: ['vitest.integration.setup.ts'],
    fileParallelism: false,
    passWithNoTests: false,
  },
});
