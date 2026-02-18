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

// ========================================
// 空状態
// ========================================
export const emptyMessage = css({
  fontSize: 'sm',
  color: 'text.secondary',
  py: '8',
  textAlign: 'center',
});

// ========================================
// 集計テーブルセクション
// ========================================
export const summarySection = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const summarySection_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '4',
});

export const summaryTable = css({
  display: 'flex',
  flexDir: 'column',
});

export const summaryTable_header = css({
  display: 'grid',
  gridTemplateColumns: '[40px 1fr 48px 48px 48px]',
  gap: '2',
  py: '2',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderColor: 'border.default',
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
});

export const summaryTable_headerCell = css({
  textAlign: 'center',
});

export const summaryRow = cva({
  base: {
    display: 'grid',
    gridTemplateColumns: '[40px 1fr 48px 48px 48px]',
    gap: '2',
    py: '3',
    cursor: 'pointer',
    rounded: 'md',
    _hover: {
      bg: 'bg.input',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.subtle/10',
        outline: 'focusRing',
        outlineColor: 'primary.default',
      },
      false: {},
    },
  },
});

export const summaryRow_radio = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const summaryRow_radioInput = css({
  cursor: 'pointer',
});

export const summaryRow_date = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
});

export const summaryRow_count = cva({
  base: {
    textAlign: 'center',
    fontSize: 'sm',
    fontWeight: 'bold',
  },
  variants: {
    variant: {
      ok: {
        color: 'text.success',
      },
      maybe: {
        color: 'text.warning',
      },
      ng: {
        color: 'text.error',
      },
    },
  },
});

export const recommendBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5',
  px: '2',
  py: '0.5',
  bg: 'bg.warning',
  color: 'text.warning',
  rounded: 'full',
  fontSize: 'xs',
  fontWeight: 'bold',
});

// ========================================
// 回答詳細セクション
// ========================================
export const detailSection = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  mb: '6',
});

export const detailSection_trigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  p: '4',
  cursor: 'pointer',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
  _hover: {
    color: 'text.title',
  },
});

export const detailSection_content = css({
  p: '4',
  pt: '0',
});

export const detailCard = css({
  mb: '4',
  _last: {
    mb: '0',
  },
});

export const detailCard_title = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '2',
});

export const detailCard_list = css({
  display: 'flex',
  flexDir: 'column',
  gap: '1',
  listStyle: 'none',
  p: '0',
  m: '0',
});

export const detailCard_item = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '3',
  py: '2',
  bg: 'bg.input',
  rounded: 'md',
  fontSize: 'sm',
});

export const detailCard_availability = cva({
  base: {
    fontWeight: 'bold',
    fontSize: 'sm',
  },
  variants: {
    variant: {
      ok: {
        color: 'text.success',
      },
      maybe: {
        color: 'text.warning',
      },
      ng: {
        color: 'text.error',
      },
    },
  },
});

export const detailCard_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  py: '2',
});

// ========================================
// エラー・アクション
// ========================================
export const serverError = css({
  color: 'text.error',
  mb: '4',
  fontSize: 'sm',
});

export const actions = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
  pt: '4',
});
