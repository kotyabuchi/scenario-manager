import { css, cva } from '@/styled-system/css';

// オーバーレイ
export const overlay = cva({
  base: {
    position: 'fixed',
    inset: '0',
    bg: 'overlay.backdrop',
    zIndex: 'overlay',
    transition: 'opacity',
    transitionDuration: 'normal',
    // ボタン要素用スタイル
    border: 'none',
    cursor: 'default',
  },
  variants: {
    visible: {
      true: {
        opacity: '[1]',
        pointerEvents: 'auto',
      },
      false: {
        opacity: '[0]',
        pointerEvents: 'none',
      },
    },
  },
  defaultVariants: {
    visible: false,
  },
});

// ボトムシートコンテナ
export const container = cva({
  base: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: 'modal',
    bg: 'white',
    borderTopLeftRadius: '3xl',
    borderTopRightRadius: '3xl',
    shadow: 'dialog.default',
    maxHeight: '[85vh]',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform',
    transitionDuration: 'normal',
    transitionTimingFunction: 'ease-out',
  },
  variants: {
    visible: {
      true: {
        transform: 'translateY(0)',
      },
      false: {
        transform: 'translateY(100%)',
      },
    },
  },
  defaultVariants: {
    visible: false,
  },
});

// ハンドルバー
export const handle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '6', // 24px
  flexShrink: '0',
});

export const handleBar = css({
  width: '10', // 40px
  height: '1', // 4px
  bg: 'gray.300',
  borderRadius: 'full',
});

// ヘッダー
export const header = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingX: '5',
  paddingBottom: '4',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'gray.100',
  flexShrink: '0',
});

export const title = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8', // 32px
  height: '8', // 32px
  borderRadius: 'md',
  color: 'gray.500',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.100',
  },
});

// コンテンツエリア
export const content = css({
  flex: '1',
  overflowY: 'auto',
  paddingX: '5',
  paddingY: '4',
});

// フッター（3ボタンレイアウト）
export const footer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  paddingX: '5',
  paddingTop: '4',
  paddingBottom: '6',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'gray.100',
  flexShrink: '0',
});

// クリア系ボタンの横並び
export const footerActions = css({
  display: 'flex',
  gap: '2',
  justifyContent: 'space-between',
});

// 全幅ボタン用
export const fullWidthButton = css({
  width: 'full',
});
