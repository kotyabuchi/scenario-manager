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
      outline: {},
    },
    status: {
      info: {},
      success: {},
      warning: {},
      danger: {},
    },
    hasAction: {
      true: {
        root: {
          cursor: 'pointer',
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
          color: '{colors.info.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.info.800}',
          },
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
          color: '{colors.success.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.success.800}',
          },
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
          color: '{colors.warning.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.warning.800}',
          },
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
          color: '{colors.danger.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.danger.800}',
          },
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
          color: '{colors.info.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.info.800}',
          },
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
          color: '{colors.success.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.success.800}',
          },
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
          color: '{colors.warning.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.warning.800}',
          },
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
          color: '{colors.danger.700}',
        },
        actionButton: {
          _hover: {
            color: '{colors.danger.800}',
          },
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
          color: '{colors.info.700}',
          bg: 'transparent',
        },
        actionButton: {
          _hover: {
            color: '{colors.info.800}',
          },
        },
      },
    },
    {
      variant: 'outline',
      status: 'success',
      css: {
        root: {
          borderColor: '{colors.success.500}',
          color: '{colors.success.700}',
          bg: 'transparent',
        },
        actionButton: {
          _hover: {
            color: '{colors.success.800}',
          },
        },
      },
    },
    {
      variant: 'outline',
      status: 'warning',
      css: {
        root: {
          borderColor: '{colors.warning.500}',
          color: '{colors.warning.700}',
          bg: 'transparent',
        },
        actionButton: {
          _hover: {
            color: '{colors.warning.800}',
          },
        },
      },
    },
    {
      variant: 'outline',
      status: 'danger',
      css: {
        root: {
          borderColor: '{colors.danger.500}',
          color: '{colors.danger.700}',
          bg: 'transparent',
        },
        actionButton: {
          _hover: {
            color: '{colors.danger.800}',
          },
        },
      },
    },
  ],
  defaultVariants: {
    variant: 'solid',
    status: 'info',
  },
});
