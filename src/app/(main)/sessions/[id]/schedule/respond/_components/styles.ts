import { css, cva } from '@/styled-system/css';

// ========================================
// ページレイアウト
// ========================================
export const pageContainer = css({
  maxW: '[960px]',
  mx: 'auto',
  px: '6',
  py: '8',
});

export const backLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  color: 'text.secondary',
  textDecoration: 'none',
  mb: '4',
  _hover: {
    color: 'primary.default',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const pageHeader = css({
  mb: '6',
});

export const pageHeader_title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '1',
});

export const pageHeader_subtitle = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const legend = css({
  display: 'flex',
  gap: '4',
  fontSize: 'xs',
  color: 'text.secondary',
  mb: '3',
});

export const legend_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
});

// ========================================
// 回答テーブルセクション
// ========================================
export const responseSection = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const responseSection_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '4',
});

export const responseTable = css({
  display: 'flex',
  flexDir: 'column',
});

export const responseRow = css({
  display: 'flex',
  flexDir: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '4',
  mb: '2',
});

export const responseRow_date = css({
  display: 'flex',
  flexDir: 'column',
  gap: '1',
});

export const responseRow_dateText = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
});

export const responseRow_stats = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const responseRow_buttons = css({
  display: 'flex',
  gap: '2',
});

// 参加可否ボタン（cva）
export const availabilityButton = cva({
  base: {
    w: '10',
    h: '10',
    rounded: 'lg',
    fontSize: 'lg',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    bg: 'bg.input',
    color: 'text.secondary',
    _focusVisible: {
      outline: 'focusRing',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    variant: {
      ok: {},
      maybe: {},
      ng: {},
    },
    selected: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variant: 'ok',
      selected: true,
      css: {
        bg: 'bg.success',
        color: 'text.success',
      },
    },
    {
      variant: 'maybe',
      selected: true,
      css: {
        bg: 'bg.warning',
        color: 'text.warning',
      },
    },
    {
      variant: 'ng',
      selected: true,
      css: {
        bg: 'bg.error',
        color: 'text.error',
      },
    },
  ],
  defaultVariants: {
    selected: false,
  },
});

// ========================================
// コメントセクション
// ========================================
export const commentSection = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const commentSection_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '4',
});

export const commentSection_count = css({
  fontSize: 'xs',
  color: 'text.secondary',
  textAlign: 'right',
  mt: '1',
});

// ========================================
// エラー表示
// ========================================
export const serverError = css({
  color: 'text.error',
  mb: '4',
  fontSize: 'sm',
});

// ========================================
// アクションボタン
// ========================================
export const actions = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
  pt: '4',
});
