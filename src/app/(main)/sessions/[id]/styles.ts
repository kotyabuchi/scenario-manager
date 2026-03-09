import { css, cva } from '@/styled-system/css';

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
  maxW: '[1120px]',
  w: 'full',
  mx: 'auto',
  px: { base: '4', md: '6' },
  py: { base: '6', md: '8' },
});

export const phaseOverview = css({
  bg: 'bg.card',
  borderRadius: 'xl',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  shadow: 'card.default',
  p: { base: '4', md: '5' },
  mb: '6',
});

export const phaseOverview_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  mb: '4',
  flexWrap: 'wrap',
});

export const phaseOverview_label = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
  mb: '1',
});

export const phaseOverview_title = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.body',
});

export const phaseOverview_statusBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    px: '3',
    py: '1',
    borderRadius: 'full',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'primary.default',
    bg: 'primary.50',
    borderWidth: '[1px]',
    borderStyle: 'solid',
    borderColor: 'primary.100',
  },
  variants: {
    cancelled: {
      true: {
        color: 'red.700',
        bg: 'red.50',
        borderColor: 'red.100',
      },
    },
  },
});

export const phaseOverview_trackWrap = css({
  overflowX: 'auto',
  pb: '1',
});

export const phaseOverview_track = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(4,minmax(0,1fr))]',
  minW: '[680px]',
  gap: '0',
});

export const phaseOverview_trackItem = css({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  minW: '0',
});

export const phaseOverview_stepConnector = cva({
  base: {
    position: 'absolute',
    top: '[20px]',
    left: '[calc(50% + 20px)]',
    width: '[calc(100% - 40px)]',
    h: '[2px]',
    bg: 'gray.100',
    zIndex: '[0]',
  },
  variants: {
    done: {
      true: {
        bg: 'primary.200',
      },
    },
  },
});

export const phaseOverview_stepBlock = css({
  position: 'relative',
  zIndex: '[1]',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2',
  minW: '0',
  px: '1',
});

export const phaseOverview_stepCircle = cva({
  base: {
    w: '10',
    h: '10',
    borderRadius: 'full',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: '[1px]',
    borderStyle: 'solid',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    state: {
      done: {
        bg: 'primary.default',
        color: 'white',
        borderColor: 'primary.default',
      },
      current: {
        bg: 'primary.50',
        color: 'primary.default',
        borderColor: 'primary.default',
        boxShadow: '[0_0_0_3px_rgba(34,197,94,0.08)]',
      },
      pending: {
        bg: 'white',
        color: 'gray.400',
        borderColor: 'gray.200',
      },
    },
  },
});

export const phaseOverview_stepText = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5',
  textAlign: 'center',
  minH: '[34px]',
});

export const phaseOverview_stepLabel = cva({
  base: {
    fontSize: 'xs',
    color: 'text.secondary',
    fontWeight: 'medium',
    lineHeight: 'tight',
    whiteSpace: 'nowrap',
  },
  variants: {
    state: {
      done: {
        color: 'text.body',
      },
      current: {
        color: 'primary.default',
        fontWeight: 'semibold',
      },
      pending: {},
    },
  },
});

export const phaseOverview_stepHint = css({
  fontSize: '[11px]',
  color: 'primary.default',
  fontWeight: 'medium',
  lineHeight: 'tight',
});

export const phaseOverview_cancelNote = css({
  mt: '3',
  fontSize: 'xs',
  color: 'red.700',
  bg: 'red.50',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'red.100',
  borderRadius: 'md',
  px: '3',
  py: '2',
});

export const backLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  color: 'text.secondary',
  textDecoration: 'none',
  mb: '4',
  borderRadius: 'md',
  px: '1',
  py: '0.5',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    color: 'primary.default',
    bg: 'bg.input',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const pageHeader = css({
  display: 'flex',
  flexDirection: { base: 'column', md: 'row' },
  alignItems: { base: 'flex-start', md: 'center' },
  justifyContent: 'space-between',
  gap: '4',
  mb: '6',
});

export const pageTitle = css({
  fontSize: { base: '3xl', md: '4xl' },
  fontWeight: 'bold',
  color: 'text.title',
  lineHeight: 'tight',
  letterSpacing: 'tight',
});

export const headerActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  alignSelf: { base: 'stretch', md: 'auto' },
  minW: '0',
  justifyContent: 'flex-end',
});

export const pageGrid = css({
  display: 'grid',
  gap: '6',
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
  position: 'relative',
  overflow: 'hidden',
  bg: 'bg.card',
  borderRadius: 'xl',
  p: '6',
  shadow: 'card.default',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
});

export const cardHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '4',
  gap: '3',
});

export const cardTitle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
  minW: '0',
});

export const accentBar = css({
  w: '[4px]',
  h: '5',
  bg: 'primary.default',
  borderRadius: 'full',
  flexShrink: '0',
  opacity: '[0.8]',
});

// ========================================
// セッション情報カード
// ========================================
export const info_tags = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
  mb: '4',
});

const phaseBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'full',
  borderWidth: '[1px]',
  borderStyle: 'solid',
} as const;

export const info_phaseRecruiting = css({
  ...phaseBadgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
  borderColor: 'green.200',
});

export const info_phasePreparation = css({
  ...phaseBadgeBase,
  bg: 'badge.warningBg',
  color: 'badge.warningText',
  borderColor: 'yellow.200',
});

export const info_phaseInProgress = css({
  ...phaseBadgeBase,
  bg: 'badge.successBg',
  color: 'badge.successText',
  borderColor: 'green.200',
});

export const info_phaseCompleted = css({
  ...phaseBadgeBase,
  bg: 'badge.neutralBg',
  color: 'badge.neutralText',
  borderColor: 'gray.100',
});

export const info_phaseCancelled = css({
  ...phaseBadgeBase,
  bg: 'badge.errorBg',
  color: 'badge.errorText',
  borderColor: 'red.200',
});

export const info_scenarioLabel = css({
  fontSize: 'sm',
  color: 'text.secondary',
  mb: '1',
  fontWeight: 'medium',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
});

export const info_scenarioName = css({
  fontSize: { base: 'lg', md: 'xl' },
  fontWeight: 'bold',
  color: 'primary.default',
  textDecoration: 'none',
  textUnderlineOffset: '3px',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const info_scenarioSystemText = css({
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: 'tight',
});

export const info_details = css({
  display: 'grid',
  gridTemplateColumns: { base: '[1fr]', sm: '[repeat(2, minmax(0, 1fr))]' },
  gap: '5',
  mt: '0',
});

export const info_detailItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  minW: '0',
});

export const info_detailLabel = css({
  color: 'text.secondary',
  fontSize: 'sm',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontWeight: 'medium',
  lineHeight: 'tight',
});

export const info_gm = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  mt: '0',
});

export const info_gmAvatar = css({
  w: '10',
  h: '10',
  borderRadius: 'full',
  bg: 'avatar.bg',
  objectFit: 'cover',
  overflow: 'hidden',
  borderWidth: '[2px]',
  borderStyle: 'solid',
  borderColor: 'bg.card',
  boxShadow: 'sm',
});

export const info_gmLabel = css({
  fontSize: 'sm',
  color: 'text.secondary',
  mb: '2',
  fontWeight: 'medium',
});

export const info_gmName = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
});

export const info_gmSubtext = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const info_gmBlock = css({
  display: 'flex',
  flexDirection: 'column',
});

export const info_valueText = css({
  fontSize: 'sm',
  color: 'text.body',
  fontWeight: 'medium',
  lineHeight: 'relaxed',
});

export const info_scheduleTimeBlockList = css({
  listStyle: 'none',
  m: '0',
  p: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const info_scheduleTimeBlockItem = css({
  lineHeight: 'relaxed',
});

export const sectionHeaderIconPrimary = css({
  color: 'primary.default',
});

export const info_cardDecor = css({
  position: 'absolute',
  top: '[-28px]',
  right: '[-24px]',
  w: '[140px]',
  h: '[140px]',
  borderRadius: 'full',
  background:
    '[radial-gradient(circle_at_center, rgba(5,149,104,0.1), rgba(5,149,104,0))]',
  pointerEvents: 'none',
});

export const info_cardInner = css({
  position: 'relative',
  zIndex: '[1]',
});

// ========================================
// 参加者セクション
// ========================================
export const participants_count = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
  px: '3',
  py: '1',
  borderRadius: 'full',
  bg: 'gray.50',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
});

export const participants_list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const participants_item = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    p: '3',
    borderRadius: 'lg',
    borderWidth: '[1px]',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      bg: 'bg.input',
      borderColor: 'gray.100',
    },
  },
  variants: {
    muted: {
      true: {
        opacity: '[0.72]',
      },
    },
  },
});

export const participants_left = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  minW: '0',
});

export const participants_avatarWrap = css({
  position: 'relative',
  w: '10',
  h: '10',
  flexShrink: '0',
});

export const participants_avatar = css({
  w: 'full',
  h: 'full',
  borderRadius: 'full',
  bg: 'avatar.bg',
  objectFit: 'cover',
  overflow: 'hidden',
});

export const participants_avatarImage = css({
  w: 'full',
  h: 'full',
  objectFit: 'cover',
});

export const participants_name = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
  lineHeight: 'tight',
});

export const participants_roleLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: 'tight',
});

const roleBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '[20px]',
  h: '[20px]',
  px: '1',
  borderRadius: 'full',
  fontSize: '[10px]',
  fontWeight: 'bold',
  color: 'white',
  flexShrink: '0',
  borderWidth: '[2px]',
  borderStyle: 'solid',
  borderColor: 'bg.card',
} as const;

export const participants_roleBadge = cva({
  base: {
    ...roleBadgeBase,
  },
  variants: {
    role: {
      KEEPER: {
        bg: 'badge.keeperBg',
      },
      PLAYER: {
        bg: 'badge.playerBg',
      },
      SPECTATOR: {
        bg: 'badge.spectatorBg',
      },
    },
    overlay: {
      true: {
        position: 'absolute',
        right: '[-4px]',
        bottom: '[-4px]',
        zIndex: '[2]',
      },
    },
  },
});

export const participants_characterSheet = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'full',
  borderWidth: '[1px]',
  borderStyle: 'solid',
});

export const participants_csSubmitted = css({
  bg: 'badge.successBg',
  color: 'badge.successText',
  borderColor: 'green.200',
});

export const participants_csNone = css({
  bg: 'badge.errorBg',
  color: 'badge.errorText',
  borderColor: 'red.200',
});

export const participants_statusText = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontStyle: 'normal',
});

export const participants_statusGroup = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '2',
  flexWrap: 'wrap',
});

export const participants_empty = css({
  py: '6',
  textAlign: 'center',
  fontSize: 'sm',
  color: 'text.secondary',
  bg: 'bg.input',
  borderRadius: 'lg',
  borderWidth: '[1px]',
  borderStyle: 'dashed',
  borderColor: 'gray.100',
});

// キャラクターシート編集
export const participants_csEditWrap = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const participants_csEditButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'text.secondary',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'md',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    color: 'primary.default',
    bg: 'bg.input',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const participants_csLink = css({
  fontSize: 'xs',
  color: 'primary.default',
  textDecoration: 'none',
  maxW: '[120px]',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const participants_csEditForm = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const participants_csEditInputRow = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
});

export const participants_csEditActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  justifyContent: 'flex-end',
});

export const participants_csEditError = css({
  fontSize: 'xs',
  color: 'error.text',
});

// ========================================
// GMメモ
// ========================================
export const memo_badge = css({
  px: '3',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  bg: 'gray.50',
  borderRadius: 'full',
  color: 'text.secondary',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
});

export const memo_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  mb: '3',
});

export const subtleHr = css({
  border: 'none',
  h: '[1px]',
  w: 'full',
  bg: 'gray.100',
  my: '4',
});

export const memo_content = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
  whiteSpace: 'pre-wrap',
  bg: 'gray.50',
  borderRadius: 'lg',
  p: '4',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
});

export const memo_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  fontStyle: 'italic',
  bg: 'gray.50',
  borderRadius: 'lg',
  p: '4',
  borderWidth: '[1px]',
  borderStyle: 'dashed',
  borderColor: 'gray.100',
});

// GMメモ編集
export const memo_editForm = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const memo_editFooter = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
});

export const memo_editCharCount = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
  textAlign: 'right',
  flexShrink: '0',
});

export const memo_editError = css({
  fontSize: 'xs',
  color: 'error.text',
});

export const memo_editActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  justifyContent: 'flex-end',
});

// 基本情報 表示追加
export const basicInfo_description = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

export const basicInfo_beginnerBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '0.5',
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'green.700',
  bg: 'green.50',
  borderRadius: 'full',
});

// 基本情報 編集フォーム
export const basicInfoEdit_form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const basicInfoEdit_charCount = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
  textAlign: 'right',
});

export const basicInfoEdit_error = css({
  fontSize: 'xs',
  color: 'error.text',
});

export const basicInfoEdit_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  justifyContent: 'flex-end',
});

export const basicInfoEdit_switchRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
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
  justifyContent: 'space-between',
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

export const tools_linkContent = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minW: '0',
});

export const tools_linkPrimary = css({
  bg: '[linear-gradient(135deg,#6272ff,#4f46e5)]',
  color: 'white',
  _hover: {
    opacity: '[0.92]',
  },
});

export const tools_linkSecondary = css({
  bg: '[#1f2937]',
  color: 'white',
  _hover: {
    opacity: '[0.92]',
  },
});

export const tools_calendarLink = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  w: 'full',
  px: '4',
  py: '3',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
  bg: 'transparent',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  borderRadius: 'lg',
  cursor: 'pointer',
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
  gap: '4',
});

export const timeline_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    left: '[15px]',
    top: '[-8px]',
    bottom: '[calc(50% + 18px)]',
    w: '[2px]',
    bg: 'gray.100',
  },
  _after: {
    content: '""',
    position: 'absolute',
    left: '[15px]',
    top: '[calc(50% + 18px)]',
    bottom: '[-8px]',
    w: '[2px]',
    bg: 'gray.100',
  },
  _first: {
    _before: { display: 'none' },
  },
  _last: {
    _after: { display: 'none' },
  },
});

const timeline_iconBase = {
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

export const timeline_content = css({
  flex: '1',
  minW: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  borderLeft: 'none',
});

export const timeline_date = css({
  fontSize: 'xs',
  color: 'text.secondary',
  mb: '0',
  fontWeight: 'medium',
});

export const timeline_description = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
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
  bg: '[rgba(5,149,104,0.06)]',
  p: '4',
  borderRadius: 'lg',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: '[rgba(5,149,104,0.15)]',
});

export const helpInfo_row = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '3',
});

export const helpInfo_iconBox = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  color: 'primary.default',
  pt: '0.5',
});

export const helpInfo_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  minW: '0',
});

export const helpInfo_title = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'primary.default',
  lineHeight: 'tight',
});

export const helpInfo_message = css({
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: 'relaxed',
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
  shadow: 'xs',
  cursor: 'pointer',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'bg.input',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
  _disabled: {
    cursor: 'not-allowed',
    opacity: '[0.56]',
    _hover: {
      bg: 'bg.card',
    },
  },
});

export const moreButton = css({
  shadow: 'xs',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  color: 'text.secondary',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'bg.input',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
  _disabled: {
    cursor: 'not-allowed',
    opacity: '[0.56]',
    _hover: {
      bg: 'bg.card',
    },
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
  w: 'full',
  h: 'full',
  color: 'avatar.icon',
});

// ParticipantCard: アバター内アイコン中央寄せ
export const participants_avatarInner = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: 'full',
  h: 'full',
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

// ToolsSection: リンクなし空状態
export const tools_empty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  textAlign: 'center',
  py: '4',
  bg: 'gray.50',
  borderRadius: 'lg',
  borderWidth: '[1px]',
  borderStyle: 'dashed',
  borderColor: 'gray.100',
});

export const sessionActions_menuContent = css({
  bg: 'bg.card',
  borderRadius: 'xl',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  boxShadow: 'card.default',
  p: '2',
  minW: '[180px]',
});

export const sessionActions_menuItem = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    px: '3',
    py: '2.5',
    borderRadius: 'lg',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.body',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      bg: 'gray.100',
      color: 'text.title',
    },
    '& svg': {
      color: 'primary.500',
      flexShrink: '0',
      width: '[16px]',
      height: '[16px]',
    },
  },
  variants: {
    danger: {
      true: {
        color: 'error.text',
        _hover: {
          bg: 'error.subtle',
          color: 'error.textDark',
        },
        '& svg': {
          color: 'error.default',
        },
      },
    },
  },
});

export const sessionActions_inline = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  minW: '0',
});

export const sessionActions_secondaryGroup = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

export const sessionActions_headerSecondaryGroup = css({
  display: { base: 'none', md: 'flex' },
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

export const sessionActions_desktopMenuWrap = css({
  display: { base: 'none', md: 'block' },
});

export const sessionActions_mobileMenuWrap = css({
  display: { base: 'block', md: 'none' },
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
