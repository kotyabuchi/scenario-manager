import { css } from '@/styled-system/css';

// ========================================
// ページレイアウト
// ========================================
export const pageContainer = css({
  maxW: '[720px]',
  mx: 'auto',
  px: { base: '4', md: '6' },
  py: { base: '6', md: '10' },
});

export const card = css({
  bg: 'white',
  rounded: '[14px]',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '[#e5ece8]',
  boxShadow: '[0_16px_40px_-20px_rgba(15,23,42,0.22)]',
  px: { base: '4', md: '8' },
  py: { base: '6', md: '8' },
});

export const backLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  color: '[#64748b]',
  textDecoration: 'none',
  mb: '4',
  _hover: {
    color: '[#0f766e]',
  },
});

export const pageHeader = css({
  textAlign: 'center',
  mb: '8',
});

export const pageHeader_title = css({
  fontSize: { base: 'xl', md: '2xl' },
  fontWeight: 'bold',
  color: '[#1e293b]',
  mb: '2',
});

export const pageHeader_subtitle = css({
  fontSize: 'sm',
  color: '[#94a3b8]',
});

export const pageHeader_sessionName = css({
  fontSize: 'xs',
  color: '[#64748b]',
  mt: '2',
  wordBreak: 'break-word',
});

// ========================================
// カレンダーセクション
// ========================================
export const calendarSection = css({
  mb: '5',
});

export const calendarSection_title = css({
  display: 'none',
});

export const calendarWrap = css({
  px: { base: '0', md: '2' },
});

export const calendarLegend = css({
  display: 'flex',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: '3',
  mt: '3',
  px: { base: '1', md: '2' },
  m: '0',
  p: '0',
  minW: '0',
  border: 'none',
});

export const calendarLegend_item = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: '[#64748b]',
});

export const calendarLegend_dot = css({
  width: '[9px]',
  height: '[9px]',
  rounded: 'full',
});

export const sectionDivider = css({
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: '[#e8eeea]',
  my: '5',
});

export const subSection = css({
  mb: '5',
});

export const subSection_title = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: '[#64748b]',
  mb: '3',
});

// ========================================
// 選択日程タグ表示
// ========================================
export const selectedDates = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2.5',
});

export const selectedDates_tag = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  px: '3.5',
  py: '1.5',
  bg: '[#d9eee6]',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '[#b8ddd0]',
  rounded: 'full',
  fontSize: 'sm',
  color: '[#0f766e]',
  fontWeight: 'medium',
});

export const selectedDates_removeButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '5',
  h: '5',
  rounded: 'full',
  cursor: 'pointer',
  color: '[#0f766e]',
  _hover: {
    bg: '[#c4e6d8]',
  },
  _focusVisible: {
    outline: '[2px_solid_#10b981]',
    outlineOffset: '[2px]',
  },
});

export const selectedDates_empty = css({
  fontSize: 'sm',
  color: '[#94a3b8]',
  py: '1',
});

// ========================================
// 時間設定セクション
// ========================================
export const timeSection = css({
  bg: '[#f3f6f4]',
  rounded: 'lg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '[#e4ece8]',
  p: '6',
});

export const timeSection_title = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: '[#334155]',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
});

export const timeSection_modeToggle = css({
  display: 'flex',
  gap: '1',
  p: '1',
  rounded: 'md',
  bg: 'white',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '[#dbe7e1]',
  m: '0',
  minW: '0',
});

export const timeSection_modeButton = css({
  px: '3.5',
  py: '1.5',
  rounded: 'md',
  fontSize: 'sm',
  fontWeight: 'medium',
  cursor: 'pointer',
  color: '[#64748b]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _focusVisible: {
    outline: '[2px_solid_#10b981]',
    outlineOffset: '[2px]',
  },
});

export const timeSection_modeButton_active = css({
  bg: '[#ddf2e8]',
  color: '[#0f766e]',
});

export const timeSection_headerRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  mb: '4',
  flexWrap: 'wrap',
});

export const timeSection_timeInputRow = css({
  display: 'flex',
  alignItems: 'flex-end',
  gap: '3',
  flexWrap: { base: 'wrap', sm: 'nowrap' },
});

export const timeSection_dateLabel = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: '[#64748b]',
  mb: '1',
});

export const timeSection_timeInput = css({
  w: 'full',
  px: '3',
  py: '2.5',
  bg: 'white',
  rounded: 'md',
  fontSize: 'sm',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '[#dbe7e1]',
  color: '[#334155]',
  _focusVisible: {
    outline: '[2px_solid_#10b981]',
    outlineOffset: '[2px]',
  },
});

export const timeSection_timeField = css({
  flex: '1',
  minW: { base: 'full', sm: '[140px]' },
});

export const timeSection_rangeSeparator = css({
  color: '[#94a3b8]',
  fontWeight: 'medium',
  pb: '2.5',
  display: { base: 'none', sm: 'inline-flex' },
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
  color: '[#dc2626]',
  mb: '3',
  fontSize: 'sm',
  textAlign: 'center',
  bg: '[#fef2f2]',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '[#fecaca]',
  rounded: 'md',
  px: '3',
  py: '2',
});

// ========================================
// アクションボタン
// ========================================
export const actions = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '5',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: '[#e8eeea]',
  mt: '6',
});

export const primaryActionButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  minW: '[240px]',
  px: '6',
  py: '3.5',
  rounded: 'md',
  bg: '[#059669]',
  color: 'white',
  fontWeight: 'bold',
  fontSize: 'sm',
  boxShadow: '[0_10px_18px_-10px_rgba(5,150,105,0.8)]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  cursor: 'pointer',
  _hover: {
    bg: '[#047857]',
  },
  _active: {
    transform: 'translateY(1px)',
  },
  _disabled: {
    opacity: '[0.55]',
    cursor: 'not-allowed',
    boxShadow: '[none]',
  },
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
