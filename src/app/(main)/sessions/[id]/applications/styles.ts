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

export const approval_backLink = css({
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

// ========================================
// ページヘッダー
// ========================================
export const approval_header = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '4',
  mb: '6',
});

export const approval_headerLeft = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const approval_title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.title',
});

export const approval_sessionName = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const approval_statsRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

const statsBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'full',
} as const;

export const approval_statsBadgePending = css({
  ...statsBadgeBase,
  bg: 'badge.warningBg',
  color: 'badge.warningText',
});

export const approval_statsBadgeConfirmed = css({
  ...statsBadgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const approval_statsBadgeTotal = css({
  ...statsBadgeBase,
  bg: 'chip.labelBg',
  shadow: 'sm',
  color: 'text.body',
});

// ========================================
// フィルタータブ
// ========================================
export const approval_filterTabs = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: '6',
  borderBottomWidth: '[1px]',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
  pb: '0',
});

export const approval_filterTab = css({
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  borderBottomWidth: '[2px]',
  borderBottomStyle: 'solid',
  borderBottomColor: 'transparent',
  mb: '[-1px]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    color: 'primary.default',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const approval_filterTabActive = css({
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.default',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  borderBottomWidth: '[2px]',
  borderBottomStyle: 'solid',
  borderBottomColor: 'primary.default',
  mb: '[-1px]',
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const approval_filterTabCount = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '5',
  h: '5',
  px: '1',
  ml: '1',
  fontSize: 'xs',
  fontWeight: 'bold',
  borderRadius: 'full',
  bg: 'chip.labelBg',
  color: 'text.body',
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

export const card_avatar = css({
  w: '10',
  h: '10',
  borderRadius: 'full',
  bg: 'avatar.bg',
  objectFit: 'cover',
  flexShrink: '0',
});

export const card_avatarInner = css({
  w: '10',
  h: '10',
  borderRadius: 'full',
  bg: 'avatar.bg',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'avatar.icon',
  flexShrink: '0',
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

export const card_message = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
  bg: 'bg.input',
  p: '3',
  borderRadius: 'lg',
  whiteSpace: 'pre-wrap',
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

export const loading_tabs = css({
  h: '10',
  w: 'full',
  mb: '6',
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
