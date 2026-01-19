import { css } from '@/styled-system/css';

export const pageContainer = css({
  maxW: '1200px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
});

export const pageHeader = css({
  mb: 'xl',
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
  mb: 'xs',
});

export const pageSubtitle = css({
  fontSize: 'md',
  color: 'text.muted',
});

export const section = css({
  mb: '2xl',
});

export const sectionHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 'lg',
});

export const sectionTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const sectionLink = css({
  fontSize: 'sm',
  color: 'primary.default',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  _hover: {
    color: 'primary.emphasized',
    textDecoration: 'underline',
  },
});

export const sessionsList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
});

export const sessionCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'bg.card',
  borderRadius: 'xl',
  p: 'md',
  shadow: 'card.default',
  cursor: 'pointer',
  transition: 'all 0.3s',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const sessionHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  mb: 'sm',
});

export const sessionTitle = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.primary',
  flex: 1,
});

export const sessionPhase = css({
  px: 'sm',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'md',
  shadow: 'chip.default',
});

export const sessionMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  fontSize: 'sm',
  color: 'text.muted',
});

export const sessionMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const scenarioGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'lg',
});

export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: '2xl',
  gap: 'md',
  color: 'text.muted',
});

export const emptyStateIcon = css({
  fontSize: '3xl',
});

export const emptyStateText = css({
  fontSize: 'md',
  textAlign: 'center',
});
