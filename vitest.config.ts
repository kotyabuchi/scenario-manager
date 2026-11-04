import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import {
  escapeTestPathForGlob,
  getTestProjects,
} from './scripts/e2e/testClassification';

import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const projects = getTestProjects(root);

// DBテストは専用configへ分離する。.envを自動読込しない。
export default defineConfig({
  root,
  plugins: [tsconfigPaths()],
  esbuild: { jsx: 'automatic' },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: projects.unit.map(escapeTestPathForGlob),
          environment: 'node',
          setupFiles: ['vitest.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit-dom',
          include: projects['unit-dom'].map(escapeTestPathForGlob),
          environment: 'jsdom',
          setupFiles: ['vitest.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: projects.component.map(escapeTestPathForGlob),
          environment: 'jsdom',
          setupFiles: ['vitest.setup.ts', '.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
