import { defineRecipe } from '@pandacss/dev';

/**
 * カードレシピ - 画面設計準拠
 */
export const card = defineRecipe({
  className: 'card',
  base: {
    display: 'flex',
    flexDirection: 'column',
    bg: 'card.bg',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 150ms ease-out',
    boxShadow: 'card.default',
  },
  variants: {
    /** 浮遊感のバリエーション */
    elevation: {
      // フラット: 影なし
      flat: {
        boxShadow: 'none',
      },
      // 標準（デフォルト）
      raised: {
        boxShadow: 'card.default',
      },
      // 強調
      elevated: {
        boxShadow: 'card.hover',
      },
    },
    /** インタラクティブ（ホバー可能） */
    interactive: {
      true: {
        cursor: 'pointer',
        _hover: {
          boxShadow: 'card.hover',
          transform: 'translateY(-2px)',
        },
      },
    },
    /** パディング */
    padding: {
      none: { p: '0' },
      sm: { p: '12px' },
      md: { p: '16px' },
      lg: { p: '24px' },
    },
  },
  defaultVariants: {
    elevation: 'raised',
    padding: 'lg',
  },
});
