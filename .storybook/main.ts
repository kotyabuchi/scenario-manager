import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';

// ESMモードでの__dirnameの代替
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  // staticDirs: ['..\\public'],
  viteFinal: async (config) => {
    return {
      ...config,
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
