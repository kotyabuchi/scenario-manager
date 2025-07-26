import path from 'node:path';
import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@chromatic-com/storybook',
    '@storybook/experimental-addon-test',
  ],
  framework: {
    name: '@storybook/experimental-nextjs-vite',
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
          '@styled-system/css': path.resolve(__dirname, '../styled-system/css'),
          '@styled-system/jsx': path.resolve(__dirname, '../styled-system/jsx'),
          '@styled-system/recipes': path.resolve(
            __dirname,
            '../styled-system/recipes',
          ),
        },
      },
    };
  },
};
export default config;
