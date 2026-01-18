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
    },
    semanticTokens,
  },
});
