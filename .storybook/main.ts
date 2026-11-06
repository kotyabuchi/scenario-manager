import { isNil } from 'ramda';

import { readStorybookVerificationWorkspace } from '../scripts/e2e/storybookVerificationWorkspace';
import { readVerificationContext } from '../scripts/e2e/verificationContext';
import { storybookAgentationPaths } from './storybookAgentationPaths.ts';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';

// ESMモードでの__dirnameの代替
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const verification = readVerificationContext();
const workspace = isNil(verification)
  ? null
  : readStorybookVerificationWorkspace(
      path.resolve(__dirname, '..'),
      verification,
    );

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', 'storybook/viewport'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: isNil(workspace)
      ? {}
      : { nextConfigPath: path.resolve(__dirname, '../next.config.ts') },
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    return {
      ...config,
      ...(isNil(workspace) ? {} : { envDir: workspace.envDir }),
      plugins: [...(config.plugins ?? []), storybookAgentationPaths()],
      // Ark UI の個別 import を事前バンドルし、実行時の再最適化リロードを防ぐ
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include ?? []),
          '@ark-ui/react/collapsible',
        ],
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          'styled-system': path.resolve(__dirname, '../styled-system'),
          '@/styled-system/css': path.resolve(
            __dirname,
            '../styled-system/css',
          ),
          '@/styled-system/jsx': path.resolve(
            __dirname,
            '../styled-system/jsx',
          ),
          '@/styled-system/recipes': path.resolve(
            __dirname,
            '../styled-system/recipes',
          ),
        },
      },
    };
  },
};

export default config;
