import { defineRecipe } from '@pandacss/dev';

export const spinner = defineRecipe({
  className: 'spinner',
  base: {
    width: 'var(--size)',
    height: 'var(--size)',
    animation: 'spin',
    animationDuration: '1.5s',
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: {
        '--size': '{sizes.3}',
        '--border-width': '1px',
      },
      sm: {
        '--size': '{sizes.4}',
        '--border-width': '2px',
      },
      md: {
        '--size': '{sizes.6}',
        '--border-width': '2px',
      },
      lg: {
        '--size': '{sizes.8}',
        '--border-width': '3px',
      },
      xl: {
        '--size': '{sizes.12}',
        '--border-width': '4px',
      },
    },
  },
});
