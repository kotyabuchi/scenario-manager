import { css, cva } from '@/styled-system/css';

// ScenarioCard スタイル
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'bg.card',
  borderRadius: 'lg',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.2s',
  shadow: 'sm',
  _hover: {
    shadow: 'md',
    transform: 'translateY(-2px)',
  },
});

export const cardThumbnail = css({
  position: 'relative',
  aspectRatio: '16/9',
  bg: 'bg.subtle',
  overflow: 'hidden',
});

export const cardThumbnailPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  color: 'text.muted',
  fontSize: 'sm',
});

export const cardOverlay = css({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  p: 'sm',
  zIndex: 1,
});

export const cardSystemLabel = css({
  px: 'sm',
  py: 'xs',
  fontSize: 'xs',
  fontWeight: 'medium',
  bg: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  borderRadius: 'sm',
  backdropFilter: 'blur(4px)',
});

export const cardRating = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  px: 'sm',
  py: 'xs',
  fontSize: 'xs',
  fontWeight: 'medium',
  bg: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  borderRadius: 'sm',
  backdropFilter: 'blur(4px)',
});

export const cardRatingStar = css({
  color: 'yellow.400',
});

export const cardContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  p: 'md',
  flex: 1,
});

export const cardTitle = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.primary',
  lineClamp: 1,
});

export const cardSystem = css({
  fontSize: 'sm',
  color: 'primary.600',
  fontWeight: 'medium',
});

export const cardMeta = css({
  display: 'flex',
  gap: 'md',
  fontSize: 'sm',
  color: 'text.secondary',
});

export const cardMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
});

export const cardMetaIcon = css({
  fontSize: 'sm',
  color: 'text.muted',
});

export const cardTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'xs',
});

export const cardTag = css({
  px: 'sm',
  py: 'xs',
  fontSize: 'xs',
  bg: 'bg.subtle',
  borderRadius: 'sm',
  color: 'text.secondary',
});

export const cardDescription = css({
  fontSize: 'sm',
  color: 'text.secondary',
  lineClamp: 2,
  lineHeight: '1.5',
  mt: 'xs',
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
