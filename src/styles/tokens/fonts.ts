import { defineTokens } from '@pandacss/dev';

export const fonts = defineTokens.fonts({
  // globals.css で定義するローカルフォントの CSS 変数を参照する。
  // 変数が未定義な環境では sans-serif にフォールバックする。
  body: { value: 'var(--font-noto-sans-jp), sans-serif' },
  heading: { value: 'var(--font-noto-sans-jp), sans-serif' },
  mono: { value: 'monospace' },
});
