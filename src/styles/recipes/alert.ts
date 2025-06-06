import { defineSlotRecipe } from '@pandacss/dev';

export const alert = defineSlotRecipe({
  className: 'alert',
  slots: [
    'root',
    'content',
    'icon',
    'title',
    'description',
    'action',
    'actionButton',
  ],
  base: {
    root: {
      borderWidth: '2px',
      borderRadius: 'lg',
      display: 'flex',
      gap: '3',
      p: '4',
      width: 'full',
    },
    icon: {
      flexShrink: '0',
      width: '6',
      height: '6',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      gap: '1',
    },
    title: {
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    description: {
      color: 'fg.muted',
      textStyle: 'sm',
    },
    actionButton: {
      flexShrink: '0',
      width: '6',
      height: '6',
      cursor: 'pointer',
      transition: 'all .2s ease-in-out',
    },
  },
  variants: {
    variant: {
      solid: {},
      subtle: {},
      outline: {
        root: {
          bg: 'transparent',
        },
      },
    },
    status: {
      info: {
        root: {
          color: '{colors.info.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.info.800}',
          },
        },
      },
      success: {
        root: {
          color: '{colors.success.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.success.800}',
          },
        },
      },
      warning: {
        root: {
          color: '{colors.warning.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.warning.800}',
          },
        },
      },
      danger: {
        root: {
          color: '{colors.danger.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.danger.800}',
          },
        },
      },
    },
  },
  compoundVariants: [
    // Solid variants
    {
      variant: 'solid',
      status: 'info',
      css: {
        root: {
          borderColor: '{colors.info.500}',
          bg: '{colors.info.50}',
        },
      },
    },
    {
      variant: 'solid',
      status: 'success',
      css: {
        root: {
          borderColor: '{colors.success.500}',
          bg: '{colors.success.50}',
        },
      },
    },
    {
      variant: 'solid',
      status: 'warning',
      css: {
        root: {
          borderColor: '{colors.warning.500}',
          bg: '{colors.warning.50}',
        },
      },
    },
    {
      variant: 'solid',
      status: 'danger',
      css: {
        root: {
          borderColor: '{colors.danger.500}',
          bg: '{colors.danger.50}',
        },
      },
    },
    // Subtle variants
    {
      variant: 'subtle',
      status: 'info',
      css: {
        root: {
          borderColor: '{colors.info.50}',
          bg: '{colors.info.50}',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'success',
      css: {
        root: {
          borderColor: '{colors.success.50}',
          bg: '{colors.success.50}',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'warning',
      css: {
        root: {
          borderColor: '{colors.warning.50}',
          bg: '{colors.warning.50}',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'danger',
      css: {
        root: {
          borderColor: '{colors.danger.50}',
          bg: '{colors.danger.50}',
        },
      },
    },
    // Outline variants
    {
      variant: 'outline',
      status: 'info',
      css: {
        root: {
          borderColor: '{colors.info.500}',
        },
      },
    },
    {
      variant: 'outline',
      status: 'success',
      css: {
        root: {
          borderColor: '{colors.success.500}',
        },
      },
    },
    {
      variant: 'outline',
      status: 'warning',
      css: {
        root: {
          borderColor: '{colors.warning.500}',
        },
      },
    },
    {
      variant: 'outline',
      status: 'danger',
      css: {
        root: {
          borderColor: '{colors.danger.500}',
        },
      },
    },
  ],
  defaultVariants: {
    variant: 'solid',
    status: 'info',
  },
});
