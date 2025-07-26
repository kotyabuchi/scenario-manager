import { defineRecipe } from '@pandacss/dev';

export const card = defineRecipe({
  className: 'card',
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'md',
    p: 'md',
    border: '1px solid',
    borderColor: '{colors.border.500}',
    borderRadius: 'md',
  },
});
