import { css } from '@/styled-system/css';

// ========================================
// ページレイアウト
// ========================================
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  minH: 'screen',
  bg: 'gray.50',
});

export const mainContent = css({
  maxW: '[1280px]',
  w: 'full',
  mx: 'auto',
  px: { base: '4', md: '6' },
  py: { base: '6', md: '8' },
});

// ========================================
// 統計バー
// ========================================
export const approval_statsBar = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '3',
  mb: '6',
});

export const approval_sessionName = css({
  fontSize: 'sm',
  color: 'text.secondary',
  fontWeight: 'medium',
});

export const approval_statsRight = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const approval_statsLabel = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const approval_statsNumber = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'primary.default',
});

export const approval_statsMax = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const approval_progressBar = css({
  w: '[100px]',
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
  bg: 'bg.card',
  rounded: 'xl',
  shadow: 'card.default',
  border: 'soft',
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
  border: 'soft',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  transitionProperty: 'common',
  transitionDuration: 'fast',
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
  w: '[fit-content]',
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

export const loading_header = css({
  h: '[56px]',
  w: 'full',
  borderRadius: '0',
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
