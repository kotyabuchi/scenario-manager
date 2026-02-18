import { css } from '@/styled-system/css';

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
// カレンダーセクション
// ========================================
export const calendarSection = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const calendarSection_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '4',
});

// ========================================
// 選択日程タグ表示
// ========================================
export const selectedDates = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  mb: '4',
});

export const selectedDates_tag = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1.5',
  bg: 'chip.labelBg',
  shadow: 'sm',
  rounded: 'full',
  fontSize: 'sm',
  color: 'text.title',
});

export const selectedDates_removeButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '4',
  h: '4',
  rounded: 'full',
  cursor: 'pointer',
  _hover: {
    bg: 'bg.input',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const selectedDates_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  py: '2',
});

// ========================================
// 時間設定セクション
// ========================================
export const timeSection = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const timeSection_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '4',
});

export const timeSection_modeToggle = css({
  display: 'flex',
  gap: '2',
  mb: '4',
});

export const timeSection_modeButton = css({
  px: '3',
  py: '1.5',
  rounded: 'md',
  fontSize: 'sm',
  cursor: 'pointer',
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const timeSection_timeInputRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: '2',
});

export const timeSection_dateLabel = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
  minW: '[120px]',
});

export const timeSection_timeInput = css({
  px: '3',
  py: '2',
  bg: 'bg.input',
  rounded: 'md',
  fontSize: 'sm',
  border: 'none',
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

// ========================================
// 既存候補表示
// ========================================
export const existingCandidates = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const existingCandidates_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  mb: '4',
});

export const existingCandidates_list = css({
  display: 'flex',
  flexDir: 'column',
  gap: '2',
});

export const existingCandidates_item = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '4',
  py: '3',
  bg: 'bg.input',
  rounded: 'md',
});

export const existingCandidates_date = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
});

export const existingCandidates_stats = css({
  display: 'flex',
  gap: '3',
  fontSize: 'xs',
  color: 'text.secondary',
});

// ========================================
// プレースホルダー（カレンダー統合前）
// ========================================
export const placeholder = css({
  p: '8',
  textAlign: 'center',
  borderWidth: '2px',
  borderStyle: 'dashed',
  borderColor: 'border.default',
  rounded: 'lg',
});

export const placeholder_text = css({
  fontSize: 'sm',
  color: 'text.secondary',
  mt: '1',
});

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

// ========================================
// ローディングスケルトン
// ========================================
export const loading_skeleton = css({
  bg: 'bg.input',
  rounded: 'md',
  animation: 'pulse',
});

export const loading_backLink = css({
  h: '4',
  w: '[120px]',
  mb: '4',
});

export const loading_title = css({
  h: '8',
  w: '[50%]',
  mb: '2',
});

export const loading_subtitle = css({
  h: '4',
  w: '[30%]',
  mb: '6',
});

export const loading_cardSkeleton = css({
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  p: '6',
  mb: '6',
});

export const loading_sectionTitle = css({
  h: '5',
  w: '[30%]',
  mb: '4',
});

export const loading_calendarArea = css({
  h: '[200px]',
  w: 'full',
});

export const loading_line = css({
  h: '4',
  w: 'full',
  mb: '3',
});

export const loading_lineShort = css({
  h: '4',
  w: '[70%]',
});
