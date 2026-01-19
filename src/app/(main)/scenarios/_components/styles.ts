import { css } from '@/styled-system/css';

// ScenarioCard スタイル
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'bg.card',
  borderRadius: 'xl',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s',
  shadow: 'card.default',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const cardThumbnail = css({
  position: 'relative',
  aspectRatio: '16/9',
  bg: 'neutral.100',
  overflow: 'hidden',
});

export const cardThumbnailImage = css({
  objectFit: 'cover',
  transition: 'all 0.3s',
  _groupHover: {
    transform: 'scale(1.03)',
    filter: 'brightness(1.05)',
  },
});

export const cardThumbnailPlaceholder = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'xs',
  background:
    'linear-gradient(135deg, {colors.neutral.50} 0%, {colors.neutral.100} 100%)',
  color: 'text.muted',
});

export const cardThumbnailPlaceholderIcon = css({
  w: '32px',
  h: '32px',
  opacity: 0.4,
});

export const cardThumbnailPlaceholderText = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  opacity: 0.6,
});

// システム名ラベル（リキッドカーブ付き）
export const cardSystemLabelWrapper = css({
  position: 'absolute',
  top: 0,
  left: 0,
  maxW: '70%',
  zIndex: 1,
});

export const cardSystemLabel = css({
  position: 'relative',
  bg: 'overlay.light',
  backdropFilter: 'blur(8px)',
  px: 'sm',
  py: '1.5',
  minH: '32px',
  display: 'flex',
  alignItems: 'center',
  borderBottomRightRadius: '12px',
});

export const cardSystemLabelText = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'neutral.700',
  truncate: true,
});

// リキッドカーブ（右側）- radial-gradientで逆角丸を実現（透過対応）
export const cardSystemLabelCurveRight = css({
  position: 'absolute',
  top: 0,
  right: '-12px',
  w: '12px',
  h: '12px',
  background:
    'radial-gradient(circle 12px at 100% 100%, transparent 11.5px, {colors.overlay.light} 12px)',
});

// リキッドカーブ（下側）- radial-gradientで逆角丸を実現（透過対応）
export const cardSystemLabelCurveBottom = css({
  position: 'absolute',
  bottom: '-12px',
  left: 0,
  w: '12px',
  h: '12px',
  background:
    'radial-gradient(circle 12px at 100% 100%, transparent 11.5px, {colors.overlay.light} 12px)',
});

// お気に入りボタン
export const cardFavoriteButton = css({
  position: 'absolute',
  top: '6px',
  right: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  px: 'sm',
  py: '4px',
  borderRadius: 'full',
  bg: 'overlay.dark',
  backdropFilter: 'blur(4px)',
  transition: 'background 0.2s',
  zIndex: 1,
  _hover: {
    bg: 'overlay.darkHover',
  },
});

export const cardFavoriteIcon = css({
  w: '14px',
  h: '14px',
  color: 'white/90',
});

export const cardFavoriteIconActive = css({
  w: '14px',
  h: '14px',
  color: 'amber.400',
  fill: 'amber.400',
});

export const cardFavoriteCount = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'white/90',
});

export const cardContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  p: 'sm',
  flex: 1,
});

export const cardTitle = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'neutral.800',
  lineClamp: 2,
  lineHeight: 'tight',
  textWrap: 'balance',
});

export const cardMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  fontSize: 'sm',
  color: 'text.muted',
});

export const cardMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

export const cardMetaIcon = css({
  w: '14px',
  h: '14px',
});

export const cardTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
});

export const cardTag = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: 'sm',
  py: '2px',
  fontSize: 'xs',
  bg: 'neutral.50',
  borderRadius: 'md',
  color: 'text.secondary',
  shadow: 'sm',
});

export const cardDescription = css({
  fontSize: 'xs',
  color: 'text.muted',
  lineClamp: 3,
  lineHeight: 'relaxed',
});

// ScenarioList スタイル
export const scenarioListContainer = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'lg',
});

export const scenarioListEmpty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: '2xl',
  gap: 'md',
  color: 'text.muted',
});

export const scenarioListEmptyIcon = css({
  fontSize: '3xl',
});

export const scenarioListEmptyText = css({
  fontSize: 'md',
  textAlign: 'center',
});

// SearchPanel スタイル
export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'lg',
  bg: 'bg.card',
  borderRadius: 'xl',
  mb: 'xl',
  shadow: 'card.default',
});

export const searchPanelRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'md',
  alignItems: 'flex-end',
});

export const searchPanelField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  minW: '200px',
  flex: 1,
  border: 'none',
  padding: 0,
  margin: 0,
  // legendはflexboxのgapが効かないため明示的にマージンを設定
  '& > legend': {
    mb: 'sm',
  },
});

// ラベルのスタイル改善
export const searchPanelLabel = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.secondary',
  letterSpacing: '0.01em',
});

// チップコンテナ
export const searchPanelChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const searchDivider = css({
  border: 'none',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
  my: 'md',
});

export const searchActions = css({
  display: 'flex',
  gap: 'sm',
});

export const rangeInput = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  fontSize: 'sm',
  color: 'text.secondary',
});

export const rangeInputField = css({
  w: '80px',
});

// ページスタイル
export const pageContainer = css({
  maxW: '1200px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
});

export const pageHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 'lg',
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const resultCount = css({
  fontSize: 'sm',
  color: 'text.secondary',
  mb: 'md',
});

export const sortSelect = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  mb: 'md',
});
