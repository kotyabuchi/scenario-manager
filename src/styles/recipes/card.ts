import { defineRecipe } from '@pandacss/dev';

export const card = defineRecipe({
  className: 'card',
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'md',
    p: 'lg',
    borderRadius: 'lg',
  },
  variants: {
    // 浮遊感のバリエーション
    elevation: {
      // フラット: 背景色のみで区切り
      flat: {
        bg: '{colors.surface.default}',
      },
      // 浮き上がり: 背景色 + 影
      raised: {
        bg: '{colors.surface.raised}',
        shadow: 'sm',
      },
      // カード: より強い浮遊感
      elevated: {
        bg: '{colors.surface.raised}',
        shadow: 'md',
      },
    },
    // 境界線（原則使用しない）
    bordered: {
      true: {
        border: '1px solid',
        borderColor: '{colors.border.subtle}',
      },
    },
    // インタラクティブ（ホバー可能）
    interactive: {
      true: {
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        _hover: {
          shadow: 'md',
          bg: '{colors.surface.hover}',
        },
      },
    },
  },
  defaultVariants: {
    elevation: 'raised',
  },
});
