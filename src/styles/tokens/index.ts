import { defineTokens } from '@pandacss/dev';

import { animations } from './animations';
import { colors } from './colors';
import { durations } from './durations';
import { easings } from './easing';
import { sizes } from './sizes';
import { spacing } from './spacing';
import { zIndex } from './zIndex';

export const tokens = defineTokens({
  animations,
  colors,
  durations,
  easings,
  sizes,
  spacing,
  zIndex,
});
