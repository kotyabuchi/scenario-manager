import { css, cva } from '@/styled-system/css';

// ========================================
// Sub Header（Pencil準拠）
// ========================================
export const subHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  h: '56px',
  w: '100%',
  px: '32px',
  py: '8px',
  bg: 'white',
  shadow: 'sm',
});

export const subHeader_left = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
});

export const subHeader_backBtn = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '36px',
  h: '36px',
  borderRadius: 'lg',
  bg: 'gray.100',
  color: 'gray.500',
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  _hover: {
    bg: 'gray.200',
    color: 'gray.700',
  },
});

export const subHeader_title = css({
  fontSize: '18px',
  fontWeight: 'bold',
  color: 'gray.800',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const subHeader_favBtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  h: '36px',
  px: '14px',
  py: '8px',
  borderRadius: 'lg',
  bg: 'orange.100',
  color: 'orange.800',
  fontSize: '13px',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  border: 'none',
  _hover: {
    bg: 'orange.200',
  },
});

export const subHeader_favIcon = css({
  color: 'orange.500',
});

// ========================================
// シナリオ情報（First View - Pencil準拠）
// ========================================
export const firstView = css({
  display: 'flex',
  gap: '32px',
  w: '100%',
});

export const firstView_thumbnail = css({
  position: 'relative',
  w: '400px',
  h: '300px',
  borderRadius: '16px',
  overflow: 'hidden',
  bg: 'gray.200',
  shadow: 'card.default',
  flexShrink: 0,
});

export const firstView_thumbnailPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '400px',
  h: '300px',
  borderRadius: '16px',
  bg: 'gray.200',
  color: 'gray.400',
  shadow: 'card.default',
  flexShrink: 0,
});

export const firstView_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  flex: 1,
});

export const scenarioInfo_top = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
});

export const scenarioInfo_system = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: 'md',
  py: 'xs',
  bg: 'green.100',
  color: 'green.800',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'md',
});

export const scenarioInfo_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const scenarioInfo_ratingStars = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1px',
  color: 'orange.400',
});

export const scenarioInfo_ratingText = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.800',
});

export const scenarioInfo_title = css({
  fontSize: '28px',
  fontWeight: 'bold',
  color: 'gray.800',
  lineHeight: 'tight',
});

export const scenarioInfo_metaRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xl',
  flexWrap: 'wrap',
});

export const scenarioInfo_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  color: 'gray.500',
  fontSize: 'sm',
});

export const scenarioInfo_metaIcon = css({
  w: '16px',
  h: '16px',
  color: 'gray.500',
});

export const scenarioInfo_tags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const scenarioInfo_tag = css({
  px: 'md',
  py: 'xs',
  fontSize: 'xs',
  bg: 'gray.200',
  borderRadius: 'full',
  color: 'gray.700',
});

export const scenarioInfo_description = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
});

export const scenarioInfo_descText = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
});

export const scenarioInfo_readMore = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.500',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

export const scenarioInfo_distributeBtn = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  w: 'max-content',
  px: 'md',
  py: 'sm',
  borderRadius: 'md',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'xs',
  fontWeight: 'medium',
  shadow: 'button.primary',
  textDecoration: 'none',
  transition: 'all {durations.normal}',
  _hover: {
    bg: 'primary.600',
    transform: 'translateY(-1px)',
  },
});

// ========================================
// セクション共通（Pencil準拠）
// ========================================
export const section = css({
  w: '100%',
});

export const section_title = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.800',
  mb: 'lg',
});

export const section_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 'lg',
});

export const section_headerActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
});

export const section_count = css({
  fontSize: 'sm',
  color: 'gray.400',
  ml: 'sm',
});

export const section_empty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'md',
  py: 'xl',
  textAlign: 'center',
  color: 'gray.400',
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
  transition: 'all {durations.normal}',
  _hover: {
    bg: 'primary.600',
    transform: 'translateY(-1px)',
  },
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
  transition: 'all {durations.normal}',
  _hover: {
    bg: 'primary.600',
  },
});

// ========================================
// 横スクロールセクション（Pencil準拠）
// ========================================
export const horizontalSection = css({
  position: 'relative',
  w: '100%',
});

export const horizontalScroll = css({
  display: 'flex',
  gap: 'md',
  overflowX: 'auto',
  pb: 'md',
  scrollbarWidth: 'none',
  _scrollbar: {
    display: 'none',
  },
});

export const horizontalScroll_fade = css({
  position: 'absolute',
  top: '45px',
  right: 0,
  w: '80px',
  h: 'calc(100% - 45px - 24px)',
  background: 'linear-gradient(to right, transparent, token(colors.bg.page))',
  pointerEvents: 'none',
});

export const horizontalScroll_btn = css({
  position: 'absolute',
  top: '50%',
  right: 0,
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '40px',
  h: '40px',
  borderRadius: 'full',
  bg: 'white',
  shadow: 'scrollButton.default',
  color: 'gray.500',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  border: 'none',
  _hover: {
    shadow: 'card.hover',
    color: 'gray.700',
  },
});

export const horizontalScroll_track = css({
  w: '100%',
  h: '6px',
  bg: 'gray.200',
  borderRadius: 'sm',
  mt: 'sm',
});

export const horizontalScroll_thumb = css({
  h: '6px',
  bg: 'primary.500',
  borderRadius: 'sm',
});

// ========================================
// セッションカード（Pencil準拠）
// ========================================
export const sessionCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'md',
  w: '280px',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  flexShrink: 0,
  transition: 'all {durations.normal}',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const sessionCard_date = css({
  fontSize: 'xs',
  color: 'gray.500',
});

export const sessionCard_name = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const sessionCard_meta = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  color: 'gray.400',
  fontSize: 'xs',
});

export const sessionList = css({
  display: 'flex',
  gap: 'md',
  overflowX: 'auto',
  pb: 'md',
});

// ========================================
// 動画カード（Pencil準拠）
// ========================================
export const videoCard = css({
  display: 'flex',
  flexDirection: 'column',
  w: '280px',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  overflow: 'hidden',
  flexShrink: 0,
  textDecoration: 'none',
  transition: 'all {durations.normal}',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const videoCard_thumbnail = css({
  position: 'relative',
  w: '100%',
  h: '160px',
  bg: 'gray.800',
  overflow: 'hidden',
});

export const videoCard_playIcon = css({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'white/50',
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
  transition: 'opacity {durations.normal}',
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
  bg: 'gray.700',
  color: 'white/50',
});

export const videoCard_info = css({
  p: 'md',
});

export const videoCard_title = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.800',
  lineHeight: 'tight',
});

export const videoCard_meta = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  mt: 'sm',
  color: 'gray.400',
  fontSize: 'xs',
});

export const videoGrid = css({
  display: 'flex',
  gap: 'md',
  overflowX: 'auto',
  pb: 'md',
});

export const spoilerToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  fontSize: 'sm',
  color: 'gray.500',
});

// ========================================
// レビューセクション（Pencil準拠）
// ========================================
export const reviewsHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 'md',
});

export const reviewsControls = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
});

export const reviewsSort = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  px: 'md',
  py: 'sm',
  bg: 'white',
  borderRadius: 'lg',
  shadow: 'sm',
  color: 'gray.600',
  fontSize: 'sm',
  cursor: 'pointer',
  border: 'none',
});

export const reviewsHiddenToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  color: 'gray.500',
  fontSize: 'sm',
  cursor: 'pointer',
});

export const reviewFilter = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'md',
  mb: 'lg',
  p: 'md',
  bg: 'gray.50',
  borderRadius: 'lg',
});

export const reviewFilter_sortTabs = css({
  display: 'flex',
  gap: 'xs',
});

export const reviewFilter_sortTabButton = cva({
  base: {
    px: 'md',
    py: 'xs',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'gray.400',
    bg: 'transparent',
    border: 'none',
    borderRadius: 'md',
    cursor: 'pointer',
    transition: 'all {durations.normal}',
    _hover: {
      color: 'gray.600',
      bg: 'gray.100',
    },
  },
  variants: {
    active: {
      true: {
        color: 'primary.600',
        bg: 'white',
        fontWeight: 'bold',
        shadow: 'sm',
        _hover: {
          color: 'primary.600',
          bg: 'white',
        },
      },
    },
  },
});

export const reviewFilter_toggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  fontSize: 'sm',
  color: 'gray.500',
  cursor: 'pointer',
  _hover: {
    color: 'gray.700',
  },
});

export const reviewList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
});

// ========================================
// レビューカード（Pencil準拠）
// ========================================
export const reviewCard = css({
  p: 'lg',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
});

export const reviewCard_hidden = css({
  opacity: 0.5,
});

export const reviewCard_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  w: '100%',
});

export const reviewCard_left = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
});

export const reviewCard_stars = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  color: 'orange.400',
});

export const reviewCard_starEmpty = css({
  color: 'gray.200',
});

export const reviewCard_ratingValue = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const reviewCard_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const reviewCard_actionText = css({
  fontSize: 'xs',
  color: 'gray.500',
  cursor: 'pointer',
  _hover: {
    color: 'gray.700',
  },
});

export const reviewCard_userInfo = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  mt: 'md',
});

export const reviewCard_avatar = css({
  w: '32px',
  h: '32px',
  borderRadius: 'full',
  bg: 'gray.200',
  overflow: 'hidden',
});

export const reviewCard_avatarPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  borderRadius: 'full',
  bg: 'gray.200',
  color: 'gray.500',
  fontSize: 'xs',
});

export const reviewCard_userName = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.800',
});

export const reviewCard_handle = css({
  fontSize: 'xs',
  color: 'gray.400',
});

export const reviewCard_date = css({
  fontSize: 'xs',
  color: 'gray.400',
});

export const reviewCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  mt: 'md',
});

export const reviewCard_commentLabel = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'gray.500',
});

export const reviewCard_commentText = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_spoilerToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  color: 'primary.500',
  fontSize: 'sm',
  fontWeight: 'medium',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

export const reviewCard_spoilerContent = css({
  mt: 'sm',
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_user = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const reviewCard_userInfo_text = css({
  display: 'flex',
  flexDirection: 'column',
});

export const reviewCard_nickname = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.800',
});

export const reviewCard_username = css({
  fontSize: 'xs',
  color: 'gray.400',
});

export const reviewCard_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  mb: 'sm',
});

export const reviewCard_openComment = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_spoiler = css({
  mt: 'md',
});

export const reviewCard_hiddenMessage = css({
  fontSize: 'sm',
  color: 'gray.400',
  fontStyle: 'italic',
});

export const reviewCard_actionButton = css({
  p: 'xs',
  color: 'gray.400',
  borderRadius: 'md',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  _hover: {
    bg: 'gray.100',
    color: 'gray.600',
  },
});

// ========================================
// FAB（Pencil準拠）
// ========================================
export const fabContainer = css({
  position: 'fixed',
  bottom: 'xl',
  right: 'xl',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 'sm',
  zIndex: 50,
});

export const fabMenu = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  p: 'sm',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.hover',
});

export const fabMenuItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  px: 'md',
  py: 'md',
  borderRadius: 'lg',
  color: 'gray.800',
  fontSize: 'sm',
  cursor: 'pointer',
  transition: 'background {durations.normal}',
  textDecoration: 'none',
  border: 'none',
  bg: 'transparent',
  w: '100%',
  textAlign: 'left',
  _hover: {
    bg: 'gray.50',
  },
});

export const fabMenuItem_icon = css({
  w: '18px',
  h: '18px',
});

export const fabMenuItem_iconPrimary = css({
  color: 'primary.500',
});

export const fabMenuItem_iconGray = css({
  color: 'gray.500',
});

export const fabButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '56px',
  h: '56px',
  borderRadius: 'full',
  bg: 'primary.500',
  color: 'white',
  shadow: 'fab.default',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  border: 'none',
  _hover: {
    transform: 'scale(1.1)',
    bg: 'primary.600',
  },
});

// ========================================
// もっと見るボタン
// ========================================
export const loadMore = css({
  display: 'flex',
  justifyContent: 'center',
  mt: 'lg',
});

// ========================================
// 区切り線
// ========================================
export const divider = css({
  border: 'none',
  h: '1px',
  bg: 'gray.200',
  my: 'xl',
});

// ========================================
// 以下は互換性のために維持（段階的に削除）
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
  color: 'gray.500',
  fontSize: 'sm',
  cursor: 'pointer',
  transition: 'color {durations.normal}',
  _hover: {
    color: 'gray.800',
  },
});

export const fab = css({
  position: 'fixed',
  bottom: 'xl',
  right: 'xl',
  zIndex: 50,
});

export const fabButton_old = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all {durations.normal}',
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
        bg: 'white',
        color: 'gray.500',
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

export const actions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
  mt: 'lg',
});

export const header_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});
