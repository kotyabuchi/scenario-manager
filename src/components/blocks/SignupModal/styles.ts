import { css } from '@/styled-system/css';

export const backdrop = css({
  position: 'fixed',
  inset: 0,
  bg: 'overlay.backdrop',
  backdropFilter: 'blur(4px)',
  zIndex: 9998,
});

export const positioner = css({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  p: '16px',
});

export const content = css({
  bg: 'dialog.bg',
  borderRadius: '16px',
  boxShadow: 'dialog.default',
  maxW: '500px',
  w: 'full',
  maxH: '90vh',
  overflow: 'auto',
});

export const header = css({
  p: '24px',
  pb: '0',
});

export const stepIndicator = css({
  fontSize: '14px',
  color: 'text.muted',
  mb: '8px',
});

export const title = css({
  fontSize: '18px',
  fontWeight: '700',
  color: 'dialog.title',
});

export const body = css({
  p: '24px',
  color: 'dialog.content',
});

export const errorText = css({
  fontSize: '12px',
  color: 'error.500',
  mt: '4px',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  p: '24px',
  pt: '0',
});

export const chipGroup = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  mt: '4px',
});

export const usernameStatus = css({
  fontSize: '12px',
  mt: '4px',
});
