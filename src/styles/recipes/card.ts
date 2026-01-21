import { defineRecipe } from '@pandacss/dev';

export const card = defineRecipe({
  className: 'card',
  base: {
    display: 'flex',
    flexDirection: 'column',
    bg: 'bg.card',
    borderRadius: 'xl',
    overflow: 'hidden',
    transition: 'all {durations.slow}',
    shadow: 'card.default',
  },
  variants: {
    // 浮遊感のバリエーション
    elevation: {
      // フラット: 影なし
      flat: {
        shadow: 'none',
      },
      // 標準（デフォルト）
      raised: {
        shadow: 'card.default',
      },
      // 強調
      elevated: {
        shadow: 'card.hover',
      },
    },
    // インタラクティブ（ホバー可能）
    interactive: {
      true: {
        cursor: 'pointer',
        _hover: {
          shadow: 'card.hover',
          transform: 'translateY(-2px)',
        },
      },
    },
    // パディング
    padding: {
      none: { p: '0' },
      sm: { p: 'sm' },
      md: { p: 'md' },
      lg: { p: 'lg' },
    },
  },
  defaultVariants: {
    elevation: 'raised',
    padding: 'lg',
  },
});
