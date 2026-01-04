import { definePreset } from '@pandacss/dev';

import { recipes } from './recipes';
import { semanticTokens } from './semanticTokens';
import { tokens } from './tokens';

export default definePreset({
  name: 'custom-preset',
  theme: {
    extend: {
      tokens,
      recipes,
    },
    semanticTokens,
  },
});
