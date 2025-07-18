import { defineRecipe } from '@pandacss/dev';

export const button = defineRecipe({
  className: 'button',
  jsx: ['Button', 'IconButton', 'SubmitButton'],
  base: {
    alignItems: 'center',
    appearance: 'none',
    borderRadius: 'sm',
    borderWidth: '2px',
    borderColor: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    fontWeight: 'semibold',
    isolation: 'isolate',
    minWidth: 'fit-content',
    justifyContent: 'center',
    outline: 'none',
    position: 'relative',
    transitionDuration: 'normal',
    transitionProperty: 'background, border-color, color, box-shadow',
    transitionTimingFunction: 'default',
    userSelect: 'none',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'var(--button-color-main)',
      outlineOffset: '2px',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: '0.5',
    },
    _hidden: {
      display: 'none',
    },
    '& :where(svg)': {
      fontSize: '1.1em',
      width: '1.1em',
      height: '1.1em',
    },
  },
  variants: {
    status: {
      default: {
        '--button-color-main': '{colors.stone.500}',
        '--button-color-hover': '{colors.stone.600}',
        '--button-color-subtle': '{colors.stone.300}',
        '--button-color-foreground': '{colors.stone.800}',
      },
      primary: {
        '--button-color-main': '{colors.primary.default}',
        '--button-color-hover': '{colors.primary.emphasized}',
        '--button-color-subtle': '{colors.primary.subtle}',
        '--button-color-foreground': '{colors.primary.800}',
      },
      success: {
        '--button-color-main': '{colors.success.default}',
        '--button-color-hover': '{colors.success.emphasized}',
        '--button-color-subtle': '{colors.success.subtle}',
        '--button-color-foreground': '{colors.success.800}',
      },
      warning: {
        '--button-color-main': '{colors.warning.default}',
        '--button-color-hover': '{colors.warning.emphasized}',
        '--button-color-subtle': '{colors.warning.subtle}',
        '--button-color-foreground': '{colors.warning.800}',
      },
      danger: {
        '--button-color-main': '{colors.danger.default}',
        '--button-color-hover': '{colors.danger.emphasized}',
        '--button-color-subtle': '{colors.danger.subtle}',
        '--button-color-foreground': '{colors.danger.800}',
      },
      info: {
        '--button-color-main': '{colors.info.default}',
        '--button-color-hover': '{colors.info.emphasized}',
        '--button-color-subtle': '{colors.info.subtle}',
        '--button-color-foreground': '{colors.info.800}',
      },
    },
    variant: {
      solid: {
        background: 'var(--button-color-main)',
        color: '{colors.white}',
        _hover: {
          '&:not([disabled])': {
            background: 'var(--button-color-hover)',
          },
        },
      },
      outline: {
        borderColor: 'var(--button-color-main)',
        color: 'var(--button-color-foreground)',
        _hover: {
          '&:not([disabled])': {
            background: 'var(--button-color-main)',
            color: '{colors.white}',
          },
        },
      },
      ghost: {
        color: 'var(--button-color-foreground)',
        _hover: {
          '&:not([disabled])': {
            background: 'var(--button-color-subtle)',
          },
        },
      },
      subtle: {
        background: 'var(--button-color-subtle)',
        color: 'var(--button-color-foreground)',
        _hover: {
          '&:not([disabled])': {
            background: 'var(--button-color-main)',
            color: '{colors.white}',
          },
        },
      },
    },
    size: {
      xs: {
        h: '8',
        minW: '8',
        textStyle: 'sm',
        px: 'sm',
        gap: 'xs',
      },
      sm: {
        h: '9',
        minW: '9',
        textStyle: 'sm',
        px: 'md',
        gap: 'xs',
      },
      md: {
        h: '10',
        minW: '10',
        textStyle: 'sm',
        px: 'lg',
        gap: 'xs',
      },
      lg: {
        h: '11',
        minW: '11',
        textStyle: 'md',
        px: 'xl',
        gap: '2',
      },
    },
  },
  defaultVariants: {
    status: 'default',
    variant: 'solid',
    size: 'md',
  },
});
