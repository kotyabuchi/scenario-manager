import { defineTokens } from '@pandacss/dev';

export const fonts = defineTokens.fonts({
  // next/font/google が layout.tsx で注入する CSS 変数を参照する。
  // 変数が未定義な環境（Storybook 等）では sans-serif にフォールバックする。
  body: { value: 'var(--font-noto-sans-jp), sans-serif' },
  heading: { value: 'var(--font-noto-sans-jp), sans-serif' },
  mono: { value: 'monospace' },
});
