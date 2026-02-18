import { css } from '@/styled-system/css';

// ========================================
// ページレイアウト
// ========================================
export const pageContainer = css({
  maxW: '[1280px]',
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
  borderRadius: 'sm',
  _hover: {
    color: 'primary.default',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const pageHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '6',
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.title',
});

export const headerActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const pageGrid = css({
  display: 'grid',
  gap: '8',
  lg: {
    gridTemplateColumns: '[repeat(12, 1fr)]',
  },
});

export const mainColumn = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  order: '[1]',
  lg: {
    gridColumn: '[span 8]',
  },
});

export const sidebarColumn = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  order: '[2]',
  lg: {
    gridColumn: '[span 4]',
  },
});

// ========================================
// カード共通
// ========================================
export const card = css({
  bg: 'bg.card',
  borderRadius: '2xl',
  p: '6',
  shadow: 'card.default',
});

export const cardHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '4',
});

export const cardTitle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
});

export const accentBar = css({
  w: '1',
  h: '5',
  bg: 'primary.default',
  borderRadius: 'full',
  flexShrink: '0',
});

// ========================================
// セッション情報カード
// ========================================
export const info_tags = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: '3',
});

export const info_systemChip = css({
  px: '3',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  bg: 'chip.labelBg',
  shadow: 'sm',
  borderRadius: 'full',
  color: 'text.body',
});

const phaseBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '0.5',
  fontSize: 'xs',
  fontWeight: 'bold',
  borderRadius: 'sm',
} as const;

export const info_phaseRecruiting = css({
  ...phaseBadgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const info_phasePreparation = css({
  ...phaseBadgeBase,
  bg: 'badge.warningBg',
  color: 'badge.warningText',
});

export const info_phaseInProgress = css({
  ...phaseBadgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const info_phaseCompleted = css({
  ...phaseBadgeBase,
  bg: 'badge.neutralBg',
  color: 'badge.neutralText',
});

export const info_phaseCancelled = css({
  ...phaseBadgeBase,
  bg: 'badge.errorBg',
  color: 'badge.errorText',
});

export const info_scenarioLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
  mb: '1',
});

export const info_scenarioName = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'primary.default',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const info_details = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6',
  mt: '4',
  fontSize: 'sm',
  color: 'text.body',
});

export const info_detailItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const info_detailLabel = css({
  color: 'text.secondary',
  fontSize: 'xs',
});

export const info_gm = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  mt: '4',
  pt: '4',
});

export const info_gmAvatar = css({
  w: '10',
  h: '10',
  borderRadius: 'full',
  bg: 'avatar.bg',
  objectFit: 'cover',
});

export const info_gmLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const info_gmName = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
});

// ========================================
// 参加者セクション
// ========================================
export const participants_count = css({
  fontSize: 'sm',
  color: 'text.secondary',
  fontWeight: 'normal',
});

export const participants_list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const participants_item = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

export const participants_left = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const participants_avatar = css({
  w: '10',
  h: '10',
  borderRadius: 'full',
  bg: 'avatar.bg',
  objectFit: 'cover',
  flexShrink: '0',
});

export const participants_name = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
});

export const participants_roleLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

const roleBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '6',
  h: '6',
  borderRadius: 'md',
  fontSize: '[10px]',
  fontWeight: 'bold',
  color: 'white',
  flexShrink: '0',
} as const;

export const participants_roleKeeper = css({
  ...roleBadgeBase,
  bg: 'badge.keeperBg',
});

export const participants_rolePlayer = css({
  ...roleBadgeBase,
  bg: 'badge.playerBg',
});

export const participants_roleSpectator = css({
  ...roleBadgeBase,
  bg: 'badge.spectatorBg',
});

export const participants_characterSheet = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'full',
});

export const participants_csSubmitted = css({
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const participants_csReviewing = css({
  bg: 'badge.warningBg',
  color: 'badge.warningText',
});

export const participants_csNone = css({
  color: 'text.secondary',
});

export const participants_empty = css({
  py: '6',
  textAlign: 'center',
  fontSize: 'sm',
  color: 'text.secondary',
});

// ========================================
// GMメモ
// ========================================
export const memo_badge = css({
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  bg: 'chip.labelBg',
  shadow: 'sm',
  borderRadius: 'full',
  color: 'text.secondary',
});

export const memo_content = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
  whiteSpace: 'pre-wrap',
});

export const memo_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  fontStyle: 'italic',
});

// ========================================
// 会場・ツール（サイドバー）
// ========================================
export const tools_list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const tools_linkButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  w: 'full',
  px: '4',
  py: '3',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'lg',
  textDecoration: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const tools_linkPrimary = css({
  bg: 'primary.default',
  color: 'white',
  _hover: {
    bg: 'primary.hover',
  },
});

export const tools_linkSecondary = css({
  bg: 'bg.input',
  color: 'text.body',
  _hover: {
    bg: 'bg.disabled',
  },
});

export const tools_calendarLink = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  w: 'full',
  px: '4',
  py: '3',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
  bg: 'transparent',
  borderRadius: 'lg',
  cursor: 'pointer',
  border: 'none',
  _hover: {
    bg: 'bg.input',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

// ========================================
// タイムライン（サイドバー）
// ========================================
export const timeline_list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
});

export const timeline_item = css({
  display: 'flex',
  gap: '3',
  position: 'relative',
  pb: '4',
  _last: {
    pb: '0',
  },
});

export const timeline_connector = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: '0',
});

const timeline_iconBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  borderRadius: 'full',
  flexShrink: '0',
} as const;

export const timeline_iconGreen = css({
  ...timeline_iconBase,
  bg: 'primary.100',
  color: 'primary.600',
});

export const timeline_iconBlue = css({
  ...timeline_iconBase,
  bg: 'blue.100',
  color: 'blue.600',
});

export const timeline_iconDefault = css({
  ...timeline_iconBase,
  bg: 'gray.100',
  color: 'text.secondary',
});

export const timeline_line = css({
  flex: '1',
  w: '[2px]',
  bg: 'border.subtle',
  mt: '1',
});

export const timeline_content = css({
  flex: '1',
  pt: '1',
});

export const timeline_date = css({
  fontSize: 'xs',
  color: 'text.secondary',
  mb: '0.5',
});

export const timeline_description = css({
  fontSize: 'sm',
  color: 'text.body',
});

export const timeline_empty = css({
  py: '4',
  textAlign: 'center',
  fontSize: 'sm',
  color: 'text.secondary',
});

// ========================================
// ヘルプ情報（サイドバー）
// ========================================
export const helpInfo = css({
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: 'relaxed',
  bg: 'notice.bg',
  p: '3',
  borderRadius: 'lg',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'notice.border',
});

export const helpInfo_title = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontWeight: 'bold',
  color: 'info.default',
  mb: '1',
});

// ========================================
// 共通ボタン
// ========================================
export const editButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
  bg: 'bg.card',
  borderRadius: 'lg',
  shadow: 'card.default',
  cursor: 'pointer',
  border: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    shadow: 'card.hover',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const moreButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '10',
  h: '10',
  borderRadius: 'lg',
  bg: 'bg.card',
  shadow: 'card.default',
  cursor: 'pointer',
  border: 'none',
  color: 'text.secondary',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    shadow: 'card.hover',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

// ========================================
// コンポーネント固有スタイル
// ========================================

// BasicInfoSection: GMアバター内アイコン中央寄せ
export const info_gmAvatarInner = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'avatar.icon',
});

// ParticipantCard: アバター内アイコン中央寄せ
export const participants_avatarInner = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'avatar.icon',
});

// ParticipantCard: 名前行
export const participants_nameRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
});

// ParticipantCard: 「あなた」ラベル
export const participants_currentUserLabel = css({
  ml: '1',
  fontSize: 'xs',
  color: 'primary.default',
  fontWeight: 'normal',
});

// ParticipantCard: キャラシ提出済バッジ
export const participants_csSubmittedBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'full',
  bg: 'badge.successBg',
  color: 'badge.successText',
});

// ParticipantCard: キャラシ確認中バッジ
export const participants_csReviewingBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'full',
  bg: 'badge.warningBg',
  color: 'badge.warningText',
});

// ParticipantCard: 未提出ラベル
export const participants_csNoneLabel = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'text.secondary',
});

// ToolsSection: リンクなし空状態
export const tools_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  textAlign: 'center',
  py: '3',
});

// ========================================
// セッションアクションボタン
// ========================================
export const sessionActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  mb: '6',
});

// ========================================
// ローディングスケルトン
// ========================================
export const loading_skeleton = css({
  bg: 'bg.input',
  rounded: 'md',
  animation: 'pulse',
});

export const loading_titleBar = css({
  h: '8',
  w: '[60%]',
  mb: '2',
});

export const loading_subtitleBar = css({
  h: '4',
  w: '[40%]',
  mb: '6',
});

export const loading_cardSkeleton = css({
  bg: 'bg.card',
  borderRadius: '2xl',
  p: '6',
  shadow: 'card.default',
  mb: '4',
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
