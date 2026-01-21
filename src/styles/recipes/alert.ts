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
      borderRadius: 'lg',
      display: 'flex',
      gap: 'md',
      p: 'lg',
      width: 'full',
    },
    icon: {
      flexShrink: '0',
      width: '5',
      height: '5',
      mt: '0.5',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      gap: 'xs',
    },
    title: {
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    description: {
      textStyle: 'sm',
      opacity: '0.9',
    },
    actionButton: {
      flexShrink: '0',
      width: '5',
      height: '5',
      cursor: 'pointer',
      transition: 'opacity {durations.normal}',
      opacity: '0.7',
      _hover: {
        opacity: '1',
      },
    },
  },
  variants: {
    variant: {
      // ソフト: 背景色で表現（ボーダーなし）
      soft: {},
      // サブトル: より薄い背景（ボーダーなし）
      subtle: {},
      // アウトライン: 背景なし + 左ボーダー
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
    // Soft variants - 背景色 + テキスト色
    {
      variant: 'soft',
      status: 'info',
      css: {
        root: {
          bg: '{colors.info.100}',
          color: '{colors.info.700}',
        },
        icon: {
          color: '{colors.info.500}',
        },
      },
    },
    {
      variant: 'soft',
      status: 'success',
      css: {
        root: {
          bg: '{colors.success.100}',
          color: '{colors.success.700}',
        },
        icon: {
          color: '{colors.success.500}',
        },
      },
    },
    {
      variant: 'soft',
      status: 'warning',
      css: {
        root: {
          bg: '{colors.warning.100}',
          color: '{colors.warning.700}',
        },
        icon: {
          color: '{colors.warning.500}',
        },
      },
    },
    {
      variant: 'soft',
      status: 'danger',
      css: {
        root: {
          bg: '{colors.danger.100}',
          color: '{colors.danger.700}',
        },
        icon: {
          color: '{colors.danger.500}',
        },
      },
    },
    // Subtle variants - より薄い背景
    {
      variant: 'subtle',
      status: 'info',
      css: {
        root: {
          bg: '{colors.info.50}',
          color: '{colors.info.700}',
        },
        icon: {
          color: '{colors.info.400}',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'success',
      css: {
        root: {
          bg: '{colors.success.50}',
          color: '{colors.success.700}',
        },
        icon: {
          color: '{colors.success.400}',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'warning',
      css: {
        root: {
          bg: '{colors.warning.50}',
          color: '{colors.warning.700}',
        },
        icon: {
          color: '{colors.warning.400}',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'danger',
      css: {
        root: {
          bg: '{colors.danger.50}',
          color: '{colors.danger.700}',
        },
        icon: {
          color: '{colors.danger.400}',
        },
      },
    },
    // Outline variants - 左ボーダーのみ
    {
      variant: 'outline',
      status: 'info',
      css: {
        root: {
          bg: '{colors.info.50}',
          borderLeft: '3px solid',
          borderColor: '{colors.info.400}',
          borderRadius: 'none',
          borderTopRightRadius: 'md',
          borderBottomRightRadius: 'md',
          color: '{colors.info.700}',
        },
        icon: {
          color: '{colors.info.500}',
        },
      },
    },
    {
      variant: 'outline',
      status: 'success',
      css: {
        root: {
          bg: '{colors.success.50}',
          borderLeft: '3px solid',
          borderColor: '{colors.success.400}',
          borderRadius: 'none',
          borderTopRightRadius: 'md',
          borderBottomRightRadius: 'md',
          color: '{colors.success.700}',
        },
        icon: {
          color: '{colors.success.500}',
        },
      },
    },
    {
      variant: 'outline',
      status: 'warning',
      css: {
        root: {
          bg: '{colors.warning.50}',
          borderLeft: '3px solid',
          borderColor: '{colors.warning.400}',
          borderRadius: 'none',
          borderTopRightRadius: 'md',
          borderBottomRightRadius: 'md',
          color: '{colors.warning.700}',
        },
        icon: {
          color: '{colors.warning.500}',
        },
      },
    },
    {
      variant: 'outline',
      status: 'danger',
      css: {
        root: {
          bg: '{colors.danger.50}',
          borderLeft: '3px solid',
          borderColor: '{colors.danger.400}',
          borderRadius: 'none',
          borderTopRightRadius: 'md',
          borderBottomRightRadius: 'md',
          color: '{colors.danger.700}',
        },
        icon: {
          color: '{colors.danger.500}',
        },
      },
    },
  ],
  defaultVariants: {
    variant: 'soft',
    status: 'info',
  },
});
