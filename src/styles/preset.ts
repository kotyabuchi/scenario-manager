import { definePreset } from '@pandacss/dev';

import { recipes, slotRecipes } from './recipes';
import { semanticTokens } from './semanticTokens';
import { tokens } from './tokens';

export default definePreset({
  name: 'custom-preset',
  conditions: {
    extend: {
      focusVisibleWithin: '&:has(:focus-visible)',
    },
  },
  utilities: {
    extend: {
      // ハーフレディングを刈り取り、グリフ実寸（cap〜baseline）でボックスをフィットさせる。
      // アイコン横の単行ラベルの光学的な上下中央揃えに使う。
      // text-box 未対応ブラウザ（Firefox等）では無視され従来表示になる
      textTrim: {
        className: 'text-trim',
        values: { type: 'boolean' },
        transform(value: boolean) {
          if (!value) return {};
          return { textBox: 'trim-both cap alphabetic' };
        },
      },
    },
  },
  theme: {
    extend: {
      tokens,
      recipes,
      slotRecipes,
      keyframes: {
        slideInFromTop: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInFromRight: {
          '0%': {
            transform: 'translateX(100%)',
          },
          '100%': {
            transform: 'translateX(0)',
          },
        },
        slideInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideOutDown: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        fadeOut: {
          '0%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
      },
    },
    semanticTokens,
  },
});
