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
      top: '[132px]', // GlobalHeader(64px) + SearchTopBar(68px)
      height: '[calc(100vh - 132px)]',
      overflowY: 'auto',
      bg: 'sidebar.bg',
      borderRadius: 'xl',
      shadow: 'card.default',
      transitionProperty: '[width, opacity]',
      transitionDuration: 'normal',
      transitionTimingFunction: 'ease-in-out',
      scrollbarWidth: '[none]',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
  variants: {
    collapsed: {
      true: {
        lg: {
          width: '[48px]',
          overflow: 'hidden',
          padding: '1',
          alignItems: 'center',
        },
      },
      false: {
        lg: {
          width: '[280px]',
          padding: '2',
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
    overflow: 'hidden',
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
  mt: '4',
  px: '4',
  pb: '2',
});

// トグルボタン
export const sidebarToggle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
