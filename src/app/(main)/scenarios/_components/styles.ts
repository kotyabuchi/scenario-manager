import { css, cva } from '@/styled-system/css';

// ScenarioCard スタイル
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'bg.card',
  borderRadius: 'xl',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  _hover: {
    shadow: '0 4px 12px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)',
  },
});

export const cardThumbnail = css({
  position: 'relative',
  aspectRatio: '16/9',
  bg: 'bg.subtle',
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
  bg: 'bg.subtle',
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
  bg: 'bg.card/95',
  backdropFilter: 'blur(4px)',
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
  color: 'text.primary',
  truncate: true,
});

// リキッドカーブ（右側）
export const cardSystemLabelCurveRight = css({
  position: 'absolute',
  top: 0,
  right: '-12px',
  w: '12px',
  h: '12px',
  bg: 'bg.card/95',
  clipPath: 'path("M 0 0 L 12 0 Q 0 0 0 12 L 0 0")',
});

// リキッドカーブ（下側）
export const cardSystemLabelCurveBottom = css({
  position: 'absolute',
  bottom: '-12px',
  left: 0,
  w: '12px',
  h: '12px',
  bg: 'bg.card/95',
  clipPath: 'path("M 0 0 L 12 0 Q 0 0 0 12 L 0 0")',
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
  bg: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(4px)',
  transition: 'background 0.2s',
  zIndex: 1,
  _hover: {
    bg: 'rgba(0, 0, 0, 0.6)',
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
  color: 'text.primary',
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
  bg: 'bg.subtle',
  borderRadius: 'md',
  color: 'text.muted',
});

export const cardDescription = css({
  fontSize: 'xs',
  color: 'text.muted/70',
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
  border: '1px solid',
  borderColor: 'border.500',
  borderRadius: 'md',
  mb: 'lg',
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
  gap: 'xs',
  minW: '200px',
  flex: 1,
  border: 'none',
  padding: 0,
  margin: 0,
});

export const searchPanelLabel = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const searchPanelChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'xs',
    px: 'sm',
    py: 'xs',
    fontSize: 'sm',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid',
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.500',
        color: 'white',
        borderColor: 'primary.500',
      },
      false: {
        bg: 'transparent',
        color: 'text.primary',
        borderColor: 'border.500',
        _hover: {
          borderColor: 'primary.500',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export const chipRemove = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '16px',
  h: '16px',
  borderRadius: 'full',
  bg: 'rgba(255, 255, 255, 0.2)',
  _hover: {
    bg: 'rgba(255, 255, 255, 0.4)',
  },
});

export const searchActions = css({
  display: 'flex',
  gap: 'sm',
  pt: 'sm',
});

export const rangeInput = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
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
