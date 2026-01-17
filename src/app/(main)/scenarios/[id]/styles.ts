import { css } from '@/styled-system/css';

export const pageContainer = css({
  maxW: '1000px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
});

export const header = css({
  mb: 'lg',
});

export const article = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: '300px 1fr' },
  gap: 'xl',
});

export const thumbnailSection = css({
  display: 'flex',
  justifyContent: 'center',
});

export const thumbnail = css({
  position: 'relative',
  width: '100%',
  maxW: '300px',
  aspectRatio: '3/4',
  borderRadius: 'md',
  overflow: 'hidden',
  bg: 'bg.subtle',
});

export const thumbnailPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  maxW: '300px',
  aspectRatio: '3/4',
  borderRadius: 'md',
  bg: 'bg.subtle',
  color: 'text.muted',
  fontSize: 'sm',
});

export const infoSection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
});

export const system = css({
  fontSize: 'sm',
  color: 'primary.600',
  fontWeight: 'medium',
});

export const title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const author = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const metaGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 'md',
  p: 'md',
  bg: 'bg.subtle',
  borderRadius: 'md',
});

export const metaItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
});

export const metaLabel = css({
  fontSize: 'xs',
  color: 'text.muted',
});

export const metaValue = css({
  fontSize: 'md',
  fontWeight: 'medium',
  color: 'text.primary',
});

export const tags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const tag = css({
  px: 'md',
  py: 'xs',
  fontSize: 'sm',
  bg: 'bg.subtle',
  borderRadius: 'full',
  color: 'text.secondary',
});

export const descriptionSection = css({
  mt: 'md',
});

export const sectionTitle = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.primary',
  mb: 'sm',
});

export const description = css({
  fontSize: 'md',
  color: 'text.secondary',
  lineHeight: '1.8',
  whiteSpace: 'pre-wrap',
});

export const linkSection = css({
  mt: 'md',
});

export const externalLink = css({
  color: 'primary.600',
  textDecoration: 'underline',
  _hover: {
    color: 'primary.700',
  },
});

export const actions = css({
  display: 'flex',
  gap: 'sm',
  mt: 'lg',
  pt: 'lg',
  borderTop: '1px solid',
  borderColor: 'border.500',
});
