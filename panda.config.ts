import { defineConfig } from '@pandacss/dev';

import customPreset from '@/styles/preset';

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/preset-panda', customPreset],
  include: ['./src/**/*.{js,jsx,ts,tsx}', './stories/**/*.{js,jsx,ts,tsx}'],
  jsxFramework: 'react', // or 'solid' or 'vue'
  outdir: 'styled-system',
  // staticCss は本当に必要なバリアントのみ指定
  // recipes: '*' は全組み合わせを生成し処理が重くなるため削除
});
