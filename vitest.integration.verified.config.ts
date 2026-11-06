import { defineConfig } from 'vitest/config';

import { integrationRuntimeFiles } from './scripts/e2e/integrationVerifiedFiles';
import { escapeTestPathForGlob } from './scripts/e2e/testClassification';

import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// legacyのservice-role互換setupを継承せず、本物の利用者JWTで実行する。
export default defineConfig({
  root,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    name: 'integration',
    include: integrationRuntimeFiles(root, process.env).map(
      escapeTestPathForGlob,
    ),
    environment: 'node',
    setupFiles: ['vitest.integration.verified.setup.ts'],
    reporters: ['default', './scripts/e2e/reporters/integration.ts'],
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    includeTaskLocation: true,
    retry: 0,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    allowOnly: false,
    passWithNoTests: false,
  },
});
