import { css, cva } from '@/styled-system/css';

// サイドバー（デスクトップのみ表示、折りたたみ対応）
export const sidebar = cva({
  base: {
    display: 'none',
    lg: {
      display: 'flex',
      flexDirection: 'column',
      flexShrink: '0',
      position: 'sticky',
      top: '[84px]', // SearchTopBar(76) + margin-top(8)
      maxHeight: '[calc(100vh - 84px - 64px - 8px)]', // top(84) + GlobalHeader(64) + margin-bottom(8)
      overflow: 'hidden',
      bg: 'sidebar.bg',
      borderRadius: 'xl',
      shadow: 'card.default',
      transitionProperty: '[width, opacity]',
      transitionDuration: 'normal',
      transitionTimingFunction: 'ease-in-out',
    },
  },
  variants: {
    collapsed: {
      true: {
        lg: {
          width: '[48px]',
          overflow: 'hidden',
          padding: '2',
          margin: '2',
          alignItems: 'center',
        },
      },
      false: {
        lg: {
          width: '[280px]',
          padding: '2',
          margin: '2',
          gap: '[20px]',
        },
      },
    },
  },
  defaultVariants: {
    collapsed: false,
  },
});

// サイドバー内のフィルターコンテンツ（折りたたみ時はフェードアウト）
export const sidebarContent = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minH: '0',
    overflowY: 'auto',
    scrollbarWidth: '[none]',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    transitionProperty: '[opacity, visibility]',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-in-out',
  },
  variants: {
    visible: {
      true: {
        opacity: '[1]',
        visibility: 'visible',
      },
      false: {
        opacity: '[0]',
        visibility: 'hidden',
      },
    },
  },
  defaultVariants: {
    visible: true,
  },
});

// サイドバー内の検索ボタン
export const sidebarSearchButton = css({
  flexShrink: '0',
  px: '4',
  pb: '2',
});

// トグルボタン
export const sidebarToggle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  gap: '2',
  width: 'full',
  py: '2',
  px: '2',
  borderRadius: 'md',
  bg: 'sidebar.toggleBg',
  color: 'sidebar.toggleIcon',
  cursor: 'pointer',
  fontSize: 'xs',
  fontWeight: 'medium',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'sidebar.toggleBgHover',
  },
});

// 折りたたみ時のフィルターバッジ
export const sidebarCollapsedBadge = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '[20px]',
  h: '[20px]',
  px: '1.5',
  borderRadius: 'full',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'xs',
  fontWeight: 'semibold',
});
