import { definePreset } from '@pandacss/dev';
import { recipes } from './recipes';
import { semanticTokens } from './semanticTokens';
import { colors } from './tokens/colors';

export default definePreset({
  name: 'custom-preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          ...colors,
        },
      },
      recipes,
    },
    semanticTokens: {
      colors: {
        ...semanticTokens,
      },
    },
  },
});
