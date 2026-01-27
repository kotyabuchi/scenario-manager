import { definePreset } from '@pandacss/dev';

import { recipes, slotRecipes } from './recipes';
import { semanticTokens } from './semanticTokens';
import { tokens } from './tokens';

export default definePreset({
  name: 'custom-preset',
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
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
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
