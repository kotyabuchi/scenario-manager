import { css } from '@/styled-system/css';

export const pageContainer = css({
  maxW: '[1200px]',
  mx: 'auto',
  px: '6',
  py: '8',
});

export const pageHeader = css({
  mb: 'xl',
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.title',
  mb: 'xs',
});

export const pageSubtitle = css({
  fontSize: 'md',
  color: 'text.secondary',
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
  color: 'text.title',
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

export const sessionsList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const sessionCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'bg.card',
  borderRadius: 'xl',
  p: '4',
  shadow: 'card.default',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'slow',
  _hover: {
    shadow: 'card.hover',
    transform: '[translateY(-2px)]',
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
  color: 'text.title',
  flex: '1',
});

export const sessionPhase = css({
  px: '2',
  py: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'md',
  shadow: 'sm',
});

export const sessionMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  fontSize: 'sm',
  color: 'text.secondary',
});

export const sessionMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const scenarioGrid = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(auto-fill, minmax(280px, 1fr))]',
  gap: '6',
});

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
