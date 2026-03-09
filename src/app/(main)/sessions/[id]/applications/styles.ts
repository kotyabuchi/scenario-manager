import { css } from '@/styled-system/css';

// ========================================
// ページレイアウト
// ========================================
export const approval_container = css({
  maxW: '[1280px]',
  mx: 'auto',
  px: '6',
  py: '8',
});

// ========================================
// パンくずナビゲーション
// ========================================
export const breadcrumb_nav = css({
  mb: '6',
});

export const breadcrumb_list = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1',
  listStyle: 'none',
  p: '0',
  m: '0',
  fontSize: 'sm',
  color: 'text.secondary',
});

export const breadcrumb_item = css({
  display: 'inline-flex',
  alignItems: 'center',
});

export const breadcrumb_link = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  color: 'text.secondary',
  textDecoration: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    color: 'primary.default',
  },
});

export const breadcrumb_current = css({
  fontWeight: 'medium',
  color: 'primary.default',
});

export const breadcrumb_separator = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'text.secondary',
  opacity: '[0.5]',
});

// ========================================
// ページヘッダー
// ========================================
export const approval_header = css({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '4',
  mb: '8',
});

export const approval_headerLeft = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const approval_title = css({
  fontSize: '3xl',
  fontWeight: 'bold',
  color: 'text.title',
});

export const approval_sessionInfo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const approval_sessionName = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const approval_statsArea = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '1',
});

export const approval_statsLabel = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const approval_statsValue = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '1',
});

export const approval_statsNumber = css({
  fontSize: '3xl',
  fontWeight: 'bold',
  color: 'primary.default',
});

export const approval_statsMax = css({
  fontSize: 'lg',
  color: 'text.secondary',
});

export const approval_progressBar = css({
  w: '[128px]',
});

// ========================================
// フィルターバー
// ========================================
export const filterBar_container = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  mb: '6',
  p: '4',
  bg: 'white',
  rounded: 'xl',
  shadow: 'card.default',
  flexWrap: 'wrap',
});

export const filterBar_searchArea = css({
  flex: '1',
  minW: '[200px]',
});

export const filterBar_selectArea = css({
  display: 'flex',
  gap: '3',
  flexShrink: '0',
});

// ========================================
// カードグリッド
// ========================================
export const approval_grid = css({
  display: 'grid',
  gap: '4',
  gridTemplateColumns: '[repeat(auto-fill, minmax(320px, 1fr))]',
});

// ========================================
// 空状態
// ========================================
export const approval_empty = css({
  py: '12',
  textAlign: 'center',
  fontSize: 'sm',
  color: 'text.secondary',
});

// ========================================
// 申請カード
// ========================================
export const card_root = css({
  bg: 'bg.card',
  borderRadius: '2xl',
  p: '5',
  shadow: 'card.default',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  borderLeftWidth: '[3px]',
  borderLeftStyle: 'solid',
  borderLeftColor: 'primary.default',
  _hover: {
    shadow: 'card.hover',
  },
});

export const card_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

export const card_userRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flex: '1',
  minW: '0',
});

export const card_userInfo = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minW: '0',
});

export const card_userName = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const card_userNickname = css({
  fontSize: 'xs',
  color: 'text.secondary',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const typeBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  px: '2',
  py: '0.5',
  fontSize: 'xs',
  fontWeight: 'bold',
  borderRadius: 'sm',
  flexShrink: '0',
} as const;

export const card_typePlayer = css({
  ...typeBadgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const card_typeSpectator = css({
  ...typeBadgeBase,
  bg: 'badge.neutralBg',
  color: 'badge.neutralText',
});

export const card_typeKeeper = css({
  ...typeBadgeBase,
  bg: 'primary.subtle',
  color: 'primary.text',
});

export const card_appliedAt = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const card_divider = css({
  border: 'none',
  borderTopWidth: '[1px]',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  my: '0',
});

export const card_statsRow = css({
  display: 'flex',
  gap: '4',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const card_statItem = css({
  cursor: 'help',
});

export const card_quoteMessage = css({
  position: 'relative',
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
  bg: 'bg.input',
  p: '3',
  pl: '8',
  borderRadius: 'lg',
  borderLeftWidth: '[3px]',
  borderLeftStyle: 'solid',
  borderLeftColor: 'primary.subtle',
  whiteSpace: 'pre-wrap',
});

export const card_quoteIcon = css({
  position: 'absolute',
  top: '3',
  left: '2',
  color: 'text.placeholder',
});

export const card_actions = css({
  display: 'flex',
  gap: '2',
});

export const card_approveButton = css({
  flex: '1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  bg: 'primary.default',
  color: 'white',
  borderRadius: 'lg',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'primary.hover',
  },
  _disabled: {
    opacity: '[0.5]',
    cursor: 'not-allowed',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const card_rejectButton = css({
  flex: '1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  bg: 'bg.input',
  color: 'text.body',
  borderRadius: 'lg',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'error.subtle',
    color: 'error.text',
  },
  _disabled: {
    opacity: '[0.5]',
    cursor: 'not-allowed',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const card_confirmedBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1.5',
  fontSize: 'sm',
  fontWeight: 'medium',
  bg: 'badge.successBg',
  color: 'badge.successText',
  borderRadius: 'lg',
  w: 'full',
  justifyContent: 'center',
});

export const card_errorMessage = css({
  fontSize: 'xs',
  color: 'error.text',
  bg: 'error.subtle',
  p: '2',
  borderRadius: 'md',
});

// ========================================
// ページネーション
// ========================================
export const approval_pagination = css({
  display: 'flex',
  justifyContent: 'center',
  mt: '8',
});

// ========================================
// ローディングスケルトン
// ========================================
export const loading_skeleton = css({
  bg: 'bg.input',
  rounded: 'md',
  animation: 'pulse',
});

export const loading_breadcrumb = css({
  h: '4',
  w: '[280px]',
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

export const loading_filterBar = css({
  h: '14',
  w: 'full',
  mb: '6',
  rounded: 'xl',
});

export const loading_pagination = css({
  h: '10',
  w: '[200px]',
  mx: 'auto',
  mt: '8',
});

export const loading_cardSkeleton = css({
  bg: 'bg.card',
  borderRadius: '2xl',
  p: '6',
  shadow: 'card.default',
});

export const loading_line = css({
  h: '4',
  w: 'full',
  mb: '3',
});

export const loading_lineShort = css({
  h: '4',
  w: '[70%]',
  mb: '3',
});
