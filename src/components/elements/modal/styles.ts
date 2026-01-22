import { css } from '@/styled-system/css';

export const backdrop = css({
  position: 'fixed',
  inset: 0,
  backdropFilter: 'blur(4px)',
  zIndex: 9998,
  _open: {
    animation: 'fadeIn 0.2s ease-out',
  },
  _closed: {
    animation: 'fadeOut 0.2s ease-in',
  },
});

export const positioner = css({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  p: 'md',
});

export const content = css({
  bg: 'white',
  borderRadius: '16px',
  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.10)',
  maxW: '500px',
  w: 'full',
  maxH: '90vh',
  overflow: 'auto',
  _open: {
    animation: 'slideInUp 0.2s ease-out',
  },
  _closed: {
    animation: 'slideOutDown 0.2s ease-in',
  },
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: 'lg',
  borderBottom: '1px solid',
  borderColor: 'oklch(0.95 0.01 150)',
});

export const title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'oklch(0.35 0.05 150)',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  borderRadius: '8px',
  color: 'oklch(0.45 0.05 150)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    bg: 'oklch(0.95 0.01 150)',
    color: 'oklch(0.35 0.05 150)',
  },
});

export const body = css({
  p: 'lg',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'sm',
  p: 'lg',
  borderTop: '1px solid',
  borderColor: 'oklch(0.95 0.01 150)',
});
