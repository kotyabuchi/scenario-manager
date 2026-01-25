import { defineSlotRecipe } from '@pandacss/dev';

/**
 * アラートレシピ - 画面設計準拠
 */
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
      borderRadius: '12px',
      display: 'flex',
      gap: '16px',
      p: '24px',
      width: 'full',
    },
    icon: {
      flexShrink: '0',
      width: '20px',
      height: '20px',
      mt: '2px',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      gap: '4px',
    },
    title: {
      fontWeight: '600',
      fontSize: '14px',
    },
    description: {
      fontSize: '14px',
      opacity: '0.9',
    },
    actionButton: {
      flexShrink: '0',
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      transition: 'opacity 150ms ease-out',
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
          bg: 'primary.subtle',
          color: 'primary.text',
        },
        icon: {
          color: 'primary.default',
        },
      },
    },
    {
      variant: 'soft',
      status: 'success',
      css: {
        root: {
          bg: 'primary.subtle',
          color: 'primary.text',
        },
        icon: {
          color: 'primary.default',
        },
      },
    },
    {
      variant: 'soft',
      status: 'warning',
      css: {
        root: {
          bg: 'warning.subtle',
          color: 'warning.text',
        },
        icon: {
          color: 'warning.default',
        },
      },
    },
    {
      variant: 'soft',
      status: 'danger',
      css: {
        root: {
          bg: 'error.subtle',
          color: 'error.text',
        },
        icon: {
          color: 'error.default',
        },
      },
    },
    // Subtle variants - より薄い背景
    {
      variant: 'subtle',
      status: 'info',
      css: {
        root: {
          bg: 'primary.subtleHover',
          color: 'primary.text',
        },
        icon: {
          color: 'primary.default',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'success',
      css: {
        root: {
          bg: 'primary.subtleHover',
          color: 'primary.text',
        },
        icon: {
          color: 'primary.default',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'warning',
      css: {
        root: {
          bg: 'bg.warning',
          color: 'warning.text',
        },
        icon: {
          color: 'warning.default',
        },
      },
    },
    {
      variant: 'subtle',
      status: 'danger',
      css: {
        root: {
          bg: 'error.subtleHover',
          color: 'error.text',
        },
        icon: {
          color: 'error.default',
        },
      },
    },
    // Outline variants - 左ボーダーのみ
    {
      variant: 'outline',
      status: 'info',
      css: {
        root: {
          bg: 'primary.subtleHover',
          borderLeft: '3px solid',
          borderColor: 'primary.default',
          borderRadius: 'none',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          color: 'primary.text',
        },
        icon: {
          color: 'primary.default',
        },
      },
    },
    {
      variant: 'outline',
      status: 'success',
      css: {
        root: {
          bg: 'primary.subtleHover',
          borderLeft: '3px solid',
          borderColor: 'primary.default',
          borderRadius: 'none',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          color: 'primary.text',
        },
        icon: {
          color: 'primary.default',
        },
      },
    },
    {
      variant: 'outline',
      status: 'warning',
      css: {
        root: {
          bg: 'bg.warning',
          borderLeft: '3px solid',
          borderColor: 'warning.default',
          borderRadius: 'none',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          color: 'warning.text',
        },
        icon: {
          color: 'warning.default',
        },
      },
    },
    {
      variant: 'outline',
      status: 'danger',
      css: {
        root: {
          bg: 'error.subtleHover',
          borderLeft: '3px solid',
          borderColor: 'error.default',
          borderRadius: 'none',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          color: 'error.text',
        },
        icon: {
          color: 'error.default',
        },
      },
    },
  ],
  defaultVariants: {
    variant: 'soft',
    status: 'info',
  },
});
