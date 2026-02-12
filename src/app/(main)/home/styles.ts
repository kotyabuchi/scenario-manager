import { css } from '@/styled-system/css';

// ========================================
// ページレイアウト
// ========================================
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  maxW: '[1280px]',
  mx: 'auto',
  px: '6',
  py: '8',
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
  gap: '10',
  order: '[1]',
  lg: {
    gridColumn: '[span 8]',
  },
});

export const sidebarColumn = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  order: '[2]',
  lg: {
    gridColumn: '[span 4]',
  },
});

export const sidebarCard = css({
  bg: 'bg.card',
  borderRadius: '2xl',
  p: '6',
  shadow: 'card.default',
  position: 'sticky',
  top: '[96px]',
});

export const sidebarDivider = css({
  border: 'none',
  borderTopWidth: '[1px]',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  my: '6',
});

// ========================================
// セクション共通
// ========================================
export const sectionHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '4',
});

export const sectionTitle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
});

export const sectionAccentBar = css({
  w: '1',
  h: '5',
  bg: 'primary.default',
  borderRadius: 'full',
  flexShrink: '0',
});

export const sectionLink = css({
  fontSize: 'sm',
  color: 'primary.default',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  _hover: {
    color: 'primary.hover',
    textDecoration: 'underline',
  },
});

// ========================================
// ヒーロー
// ========================================
export const hero_container = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  md: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});

export const hero_textArea = css({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

export const hero_title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.title',
  md: {
    fontSize: '3xl',
  },
});

export const hero_subtitle = css({
  color: 'text.secondary',
  fontSize: 'sm',
});

export const hero_countdownCard = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '6',
  bgGradient:
    '[linear-gradient(135deg, token(colors.hero.gradient.from), token(colors.hero.gradient.to))]',
  color: 'white',
  borderRadius: '2xl',
  p: '6',
  shadow: 'landing.heroCta',
  position: 'relative',
  overflow: 'hidden',
  flexShrink: '0',
  w: 'full',
  md: {
    w: 'auto',
    minW: '[400px]',
  },
});

export const hero_countdownContent = css({
  flex: '1',
});

export const hero_countdownLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  color: 'primary.100',
  fontWeight: 'medium',
  mb: '1',
});

export const hero_countdownSessionName = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  mb: '4',
  lineHeight: 'tight',
  lineClamp: '2',
});

export const hero_countdownDate = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  bg: 'hero.glass.bg',
  borderRadius: 'full',
  px: '3',
  py: '1',
  w: 'fit',
  color: 'hero.glass.text',
});

export const hero_countdownDays = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  bg: 'hero.glass.surface',
  borderRadius: 'xl',
  p: '3',
  flexShrink: '0',
  minW: '[100px]',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'hero.glass.border',
  backdropFilter: '[blur(8px)]',
});

export const hero_countdownPrefix = css({
  fontSize: 'xs',
  color: 'primary.100',
  fontWeight: 'semibold',
  textTransform: 'uppercase',
  letterSpacing: 'wider',
});

export const hero_countdownNumber = css({
  fontSize: '4xl',
  fontWeight: 'bold',
  color: 'white',
  lineHeight: '[1]',
});

export const hero_countdownUnit = css({
  fontSize: 'lg',
  fontWeight: 'normal',
  ml: '1',
});

// ========================================
// セッション一覧
// ========================================
export const sessions_list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const sessions_card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  bg: 'bg.card',
  borderRadius: 'xl',
  p: '5',
  shadow: 'card.default',
  transitionProperty: 'common',
  transitionDuration: 'slow',
  _hover: {
    shadow: 'card.hover',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
  sm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4',
  },
});

export const sessions_cardCompleted = css({
  opacity: '[0.75]',
  _hover: {
    opacity: '[1]',
  },
});

export const sessions_leftBlock = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
});

export const sessions_thumbnail = css({
  w: '14',
  h: '14',
  borderRadius: 'lg',
  objectFit: 'cover',
  flexShrink: '0',
  bg: 'bg.input',
  overflow: 'hidden',
});

export const sessions_thumbnailCompleted = css({
  filter: '[grayscale(100%)]',
});

export const sessions_topRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: '1',
});

const sessions_badgeBase = {
  px: '2',
  py: '0.5',
  fontSize: '[10px]',
  fontWeight: 'bold',
  borderRadius: 'sm',
  lineHeight: '[1.4]',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
} as const;

export const sessions_badgeRecruiting = css({
  ...sessions_badgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const sessions_badgePreparation = css({
  ...sessions_badgeBase,
  bg: 'badge.warningBg',
  color: 'badge.warningText',
});

export const sessions_badgeInProgress = css({
  ...sessions_badgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
});

export const sessions_badgeCompleted = css({
  ...sessions_badgeBase,
  bg: 'badge.neutralBg',
  color: 'badge.neutralText',
});

export const sessions_systemLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const sessions_name = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
  lineClamp: '1',
});

export const sessions_nameCompleted = css({
  textDecoration: 'line-through',
  color: 'text.secondary',
});

export const sessions_rightBlock = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6',
  justifyContent: 'flex-end',
  borderTop: '[1px solid token(colors.border.subtle)]',
  pt: '3',
  sm: {
    borderTop: 'none',
    pt: '0',
  },
});

export const sessions_avatarGroup = css({
  display: 'flex',
  alignItems: 'center',
});

export const sessions_avatar = css({
  w: '8',
  h: '8',
  borderRadius: 'full',
  borderWidth: '[2px]',
  borderStyle: 'solid',
  borderColor: 'white',
  objectFit: 'cover',
  bg: 'avatar.bg',
  ml: '[-8px]',
  _first: { ml: '0' },
});

export const sessions_avatarOverflow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  borderRadius: 'full',
  borderWidth: '[2px]',
  borderStyle: 'solid',
  borderColor: 'white',
  bg: 'bg.input',
  ml: '[-8px]',
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const sessions_dateBlock = css({
  textAlign: 'right',
  minW: '[80px]',
});

export const sessions_dateText = css({
  display: 'block',
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
});

export const sessions_timeText = css({
  display: 'block',
  fontSize: 'xs',
  color: 'text.secondary',
});

// ========================================
// アクティビティタイムライン
// ========================================
export const activity_container = css({
  bg: 'bg.card',
  borderRadius: 'xl',
  px: '6',
  py: '3',
  shadow: 'card.default',
});

export const activity_list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const activity_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    left: '[16px]',
    top: '[-8px]',
    bottom: '[calc(50% + 16px)]',
    w: '[2px]',
    bg: 'border.subtle',
  },
  _after: {
    content: '""',
    position: 'absolute',
    left: '[16px]',
    top: '[calc(50% + 16px)]',
    bottom: '[-8px]',
    w: '[2px]',
    bg: 'border.subtle',
  },
  _first: {
    _before: { display: 'none' },
  },
  _last: {
    _after: { display: 'none' },
  },
});

const activity_iconCircleBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  borderRadius: 'full',
  flexShrink: '0',
  position: 'relative',
  zIndex: '[1]',
} as const;

export const activity_iconCircleBlue = css({
  ...activity_iconCircleBase,
  bg: 'blue.100',
  color: 'blue.600',
});

export const activity_iconCircleGreen = css({
  ...activity_iconCircleBase,
  bg: 'primary.100',
  color: 'primary.600',
});

export const activity_iconCircleAmber = css({
  ...activity_iconCircleBase,
  bg: 'orange.100',
  color: 'orange.600',
});

export const activity_iconCircleDefault = css({
  ...activity_iconCircleBase,
  bg: 'gray.100',
  color: 'text.secondary',
});

export const activity_text = css({
  flex: '1',
  fontSize: 'sm',
  color: 'text.body',
  fontWeight: 'medium',
  lineHeight: '[1.5]',
});

export const activity_timestamp = css({
  fontSize: 'xs',
  color: 'text.secondary',
  whiteSpace: 'nowrap',
  flexShrink: '0',
});

export const activity_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  textAlign: 'center',
  py: '6',
});

// ========================================
// ミニカレンダー
// ========================================
export const calendar_container = css({});

export const calendar_heading = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: 'wider',
  mb: '4',
});

export const calendar_inner = css({
  bg: 'gray.50',
  borderRadius: 'xl',
  p: '4',
});

export const calendar_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '4',
});

export const calendar_monthLabel = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
});

export const calendar_navButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '7',
  h: '7',
  borderRadius: 'md',
  bg: 'transparent',
  color: 'text.secondary',
  cursor: 'pointer',
  border: 'none',
  _hover: {
    bg: 'bg.input',
  },
});

export const calendar_table = css({
  w: 'full',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
});

export const calendar_dayHeaderCell = css({
  textAlign: 'center',
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'normal',
  py: '1',
  pb: '2',
});

export const calendar_dayCell = css({
  textAlign: 'center',
  verticalAlign: 'middle',
  py: '1',
  fontSize: 'xs',
  color: 'text.body',
  position: 'relative',
  h: '8',
});

export const calendar_dayCellOutside = css({
  color: 'text.placeholder',
});

export const calendar_dayCellToday = css({
  fontWeight: 'bold',
  color: 'primary.default',
});

export const calendar_sessionDot = css({
  w: '1',
  h: '1',
  borderRadius: 'full',
  bg: 'primary.default',
  position: 'absolute',
  bottom: '0',
  left: '[50%]',
  transform: 'translateX(-50%)',
});

// ========================================
// お知らせ
// ========================================
export const notice_heading = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: 'wider',
  mb: '2',
});

export const notice_card = css({
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

export const notice_cardTitle = css({
  display: 'block',
  fontWeight: 'bold',
  color: 'info.default',
  mb: '1',
});

// ========================================
// 空状態
// ========================================
export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: '2xl',
  gap: '4',
  color: 'text.secondary',
});

export const emptyStateIcon = css({
  fontSize: '3xl',
});

export const emptyStateText = css({
  fontSize: 'md',
  textAlign: 'center',
});

// ========================================
// シナリオグリッド
// ========================================
export const scenarioGrid = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(auto-fill, minmax(280px, 1fr))]',
  gap: '6',
});

// ========================================
// スケルトン (loading.tsx)
// ========================================
export const loading_skeleton = css({
  bg: 'skeleton.base',
  borderRadius: 'lg',
  animation: 'skeleton-pulse',
});

export const loading_skeletonRound = css({
  bg: 'skeleton.base',
  borderRadius: 'full',
  animation: 'skeleton-pulse',
});

export const loading_flexColumn = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const loading_flexCenter = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const loading_activityRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  py: '3',
});

// スケルトンサイズ（loading_skeleton / loading_skeletonRound と組み合わせて使用）
export const loading_heroTitle = css({ w: '[200px]', h: '[32px]' });
export const loading_heroSubtitle = css({ w: '[160px]', h: '[20px]' });
export const loading_heroCard = css({ h: '[140px]', borderRadius: '2xl' });
export const loading_accentBar = css({ w: '[4px]', h: '[20px]' });
export const loading_sectionTitleWide = css({ w: '[140px]', h: '[20px]' });
export const loading_sectionTitleMedium = css({ w: '[160px]', h: '[20px]' });
export const loading_sectionTitleNarrow = css({ w: '[120px]', h: '[20px]' });
export const loading_thumbnail = css({
  w: '[56px]',
  h: '[56px]',
  borderRadius: 'md',
});
export const loading_dateLabel = css({ w: '[60px]', h: '[16px]' });
export const loading_sessionName = css({ w: '[180px]', h: '[18px]' });
export const loading_activityIcon = css({ w: '8', h: '8' });
export const loading_activityText = css({ flex: '1', h: '[16px]' });
export const loading_activityTimestamp = css({ w: '[40px]', h: '[14px]' });
export const loading_scenarioCard = css({ h: '[200px]', borderRadius: 'xl' });
export const loading_sidebarLabel = css({ w: '[80px]', h: '[16px]', mb: '4' });
export const loading_calendarArea = css({ h: '[240px]', borderRadius: 'xl' });
export const loading_noticeLabel = css({ w: '[60px]', h: '[16px]', mb: '2' });
export const loading_noticeCard = css({ h: '[60px]', borderRadius: 'md' });
