import { css, cva } from '@/styled-system/css';

// ========================================
// ヘッダー
// ========================================
export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 'lg',
});

export const header_backButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  color: 'text.secondary',
  fontSize: 'sm',
  cursor: 'pointer',
  transition: 'color 0.2s',
  _hover: {
    color: 'text.primary',
  },
});

export const header_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

// ========================================
// シナリオ情報
// ========================================
export const scenarioInfo = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: '280px 1fr' },
  gap: 'xl',
});

export const scenarioInfo_thumbnail = css({
  position: 'relative',
  width: '100%',
  maxW: '280px',
  aspectRatio: '3/4',
  borderRadius: 'xl',
  overflow: 'hidden',
  bg: 'bg.subtle',
  shadow: 'card.default',
  mx: { base: 'auto', md: '0' },
});

export const scenarioInfo_thumbnailPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  maxW: '280px',
  aspectRatio: '3/4',
  borderRadius: 'xl',
  bg: 'bg.subtle',
  color: 'text.muted',
  fontSize: 'sm',
  mx: { base: 'auto', md: '0' },
});

export const scenarioInfo_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
});

export const scenarioInfo_system = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  px: 'md',
  py: 'xs',
  bg: 'primary.100',
  color: 'primary.700',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'full',
  width: 'fit-content',
});

export const scenarioInfo_title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
  lineHeight: 'tight',
});

export const scenarioInfo_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  width: 'fit-content',
  cursor: 'pointer',
  borderRadius: 'md',
  p: 'xs',
  ml: '-xs',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background 0.2s',
  _hover: {
    bg: 'bg.subtle',
  },
});

export const scenarioInfo_ratingStars = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  color: 'yellow.500',
});

export const scenarioInfo_ratingValue = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const scenarioInfo_ratingCount = css({
  fontSize: 'sm',
  color: 'text.muted',
});

export const scenarioInfo_author = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const scenarioInfo_metaGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: 'md',
});

export const scenarioInfo_metaItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const scenarioInfo_metaLabel = css({
  fontSize: 'xs',
  color: 'text.muted',
});

export const scenarioInfo_metaValue = css({
  fontSize: 'md',
  fontWeight: 'medium',
  color: 'text.primary',
});

export const scenarioInfo_tags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const scenarioInfo_tag = css({
  px: 'md',
  py: 'xs',
  fontSize: 'sm',
  bg: 'chip.default',
  borderRadius: 'full',
  color: 'text.secondary',
  shadow: 'chip.default',
});

// ========================================
// 概要セクション
// ========================================
export const description_section = css({
  mt: 'md',
});

export const description_title = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.primary',
  mb: 'sm',
});

export const description_wrapper = css({
  position: 'relative',
});

export const description_text = css({
  fontSize: 'md',
  color: 'text.secondary',
  lineHeight: '1.8',
  whiteSpace: 'pre-wrap',
});

export const description_collapsed = css({
  maxHeight: '5.4em', // 3行分（lineHeight 1.8 × 3）
  overflow: 'hidden',
});

export const description_fadeout = css({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '3em',
  background:
    'linear-gradient(to bottom, transparent, token(colors.bg.default))',
  pointerEvents: 'none',
});

export const description_toggleButton = css({
  mt: 'sm',
  color: 'primary.600',
  fontSize: 'sm',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

// ========================================
// 配布URL
// ========================================
export const distributeUrl = css({
  mt: 'md',
});

export const distributeUrl_link = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  width: 'fit-content',
  color: 'primary.600',
  fontSize: 'sm',
  _hover: {
    textDecoration: 'underline',
  },
});

// ========================================
// セクション共通
// ========================================
export const section = css({
  mt: 'xxl',
});

export const section_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 'lg',
});

export const section_title = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const section_count = css({
  fontSize: 'sm',
  color: 'text.muted',
  ml: 'sm',
});

export const section_empty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'md',
  py: 'xl',
  textAlign: 'center',
  color: 'text.muted',
  fontSize: 'sm',
});

export const section_emptyText = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const section_ctaButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  px: 'lg',
  py: 'sm',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'lg',
  textDecoration: 'none',
  transition: 'all 0.2s',
  _hover: {
    bg: 'primary.600',
    transform: 'translateY(-1px)',
  },
});

export const section_headerActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
});

export const section_actionButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  px: 'md',
  py: 'xs',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'md',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    bg: 'primary.600',
  },
});

// ========================================
// セッションカード
// ========================================
export const sessionCard = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  p: 'md',
  bg: 'bg.card',
  borderRadius: 'lg',
  shadow: 'card.default',
  transition: 'all 0.2s',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const sessionCard_info = css({
  flex: 1,
});

export const sessionCard_date = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.primary',
});

export const sessionCard_keeper = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const sessionCard_participants = css({
  fontSize: 'xs',
  color: 'text.muted',
});

export const sessionList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
});

// ========================================
// 動画カード
// ========================================
export const videoGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'lg',
});

export const videoCard = css({
  position: 'relative',
  bg: 'bg.card',
  borderRadius: 'xl',
  overflow: 'hidden',
  shadow: 'card.default',
  transition: 'all 0.2s',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const videoCard_thumbnail = css({
  position: 'relative',
  aspectRatio: '16/9',
  bg: 'bg.subtle',
  overflow: 'hidden',
});

export const videoCard_spoilerOverlay = css({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'sm',
  bg: 'overlay.dark',
  backdropFilter: 'blur(8px)',
  color: 'white',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
  border: 'none',
  width: '100%',
  height: '100%',
  _hover: {
    opacity: 0.9,
  },
});

export const videoCard_placeholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  bg: 'bg.subtle',
  color: 'text.muted',
  fontSize: '3xl',
});

export const videoCard_info = css({
  p: 'md',
});

export const videoCard_title = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.primary',
  lineHeight: 'tight',
});

export const videoCard_meta = css({
  mt: 'xs',
  fontSize: 'xs',
  color: 'text.muted',
});

export const spoilerToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  fontSize: 'sm',
  color: 'text.secondary',
});

// ========================================
// レビューセクション
// ========================================
export const reviewFilter = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'md',
  mb: 'lg',
  p: 'md',
  bg: 'bg.subtle',
  borderRadius: 'lg',
});

export const reviewFilter_label = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const reviewFilter_select = css({
  px: 'md',
  py: 'sm',
  fontSize: 'sm',
  bg: 'bg.card',
  borderRadius: 'md',
  border: 'none',
  color: 'text.primary',
  cursor: 'pointer',
  outline: 'none',
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'primary.500',
    outlineOffset: '2px',
  },
});

export const reviewFilter_toggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  fontSize: 'sm',
  color: 'text.secondary',
  cursor: 'pointer',
  _hover: {
    color: 'text.primary',
  },
});

export const reviewList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'lg',
});

// ========================================
// レビューカード
// ========================================
export const reviewCard = css({
  p: 'lg',
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
});

export const reviewCard_hidden = css({
  opacity: 0.5,
});

export const reviewCard_header = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  mb: 'md',
});

export const reviewCard_user = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const reviewCard_avatar = css({
  width: '40px',
  height: '40px',
  borderRadius: 'full',
  bg: 'bg.subtle',
  overflow: 'hidden',
});

export const reviewCard_avatarPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: 'full',
  bg: 'bg.subtle',
  color: 'text.muted',
  fontSize: 'sm',
});

export const reviewCard_userInfo = css({
  display: 'flex',
  flexDirection: 'column',
});

export const reviewCard_nickname = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.primary',
});

export const reviewCard_username = css({
  fontSize: 'xs',
  color: 'text.muted',
});

export const reviewCard_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const reviewCard_actionButton = css({
  p: 'xs',
  color: 'text.muted',
  borderRadius: 'md',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    bg: 'bg.subtle',
    color: 'text.primary',
  },
});

export const reviewCard_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  mb: 'sm',
});

export const reviewCard_stars = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  color: 'yellow.500',
});

export const reviewCard_ratingValue = css({
  fontSize: 'md',
  fontWeight: 'medium',
  color: 'text.primary',
});

export const reviewCard_date = css({
  fontSize: 'xs',
  color: 'text.muted',
});

export const reviewCard_openComment = css({
  fontSize: 'md',
  color: 'text.secondary',
  lineHeight: '1.7',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_spoiler = css({
  mt: 'md',
  p: 'md',
  bg: 'bg.subtle',
  borderRadius: 'lg',
});

export const reviewCard_spoilerToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  color: 'text.secondary',
  fontSize: 'sm',
  cursor: 'pointer',
  _hover: {
    color: 'text.primary',
  },
});

export const reviewCard_spoilerContent = css({
  mt: 'md',
  fontSize: 'md',
  color: 'text.secondary',
  lineHeight: '1.7',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_hiddenMessage = css({
  fontSize: 'sm',
  color: 'text.muted',
  fontStyle: 'italic',
});

// ========================================
// FAB（お気に入りボタン）
// ========================================
export const fab = css({
  position: 'fixed',
  bottom: 'xl',
  right: 'xl',
  zIndex: 50,
});

export const fabButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all 0.2s',
    shadow: 'lg',
    _hover: {
      transform: 'scale(1.1)',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'primary.500',
        color: 'white',
      },
      false: {
        bg: 'bg.card',
        color: 'text.secondary',
        _hover: {
          color: 'primary.500',
        },
      },
    },
  },
  defaultVariants: {
    active: false,
  },
});

// ========================================
// アクションボタンエリア
// ========================================
export const actions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
  mt: 'lg',
});

// ========================================
// 区切り線（hr要素用）
// ========================================
export const divider = css({
  border: 'none',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
  my: 'xl',
});

// ========================================
// もっと見るボタン
// ========================================
export const loadMore = css({
  display: 'flex',
  justifyContent: 'center',
  mt: 'lg',
});
