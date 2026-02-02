import { defineConfig } from '@pandacss/dev';

import customPreset from '@/styles/preset';

export default defineConfig({
  preflight: true,
  strictTokens: true,
  strictPropertyValues: true,
  presets: ['@pandacss/preset-panda', customPreset],
  include: ['./src/**/*.{js,jsx,ts,tsx}', './stories/**/*.{js,jsx,ts,tsx}'],
  jsxFramework: 'react', // or 'solid' or 'vue'
  outdir: 'styled-system',
  // Storybook Controls で全バリアントを使用可能にする
  staticCss: {
    recipes: '*',
  },
});
