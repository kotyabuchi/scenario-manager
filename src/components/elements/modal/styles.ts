import { css } from '@/styled-system/css';

/**
 * Modal スタイル定義 - 画面設計準拠
 */

export const backdrop = css({
  position: 'fixed',
  inset: 0,
  bg: 'overlay.backdrop',
  backdropFilter: 'blur(4px)',
  zIndex: 9998,
  _open: {
    animation: 'fadeIn {durations.normal} ease-out',
  },
  _closed: {
    animation: 'fadeOut {durations.normal} ease-in',
  },
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
  _open: {
    animation: 'slideInUp {durations.normal} ease-out',
  },
  _closed: {
    animation: 'slideOutDown {durations.normal} ease-in',
  },
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: '24px',
  borderBottom: '1px solid',
  borderColor: 'border.subtle',
});

export const title = css({
  fontSize: '18px',
  fontWeight: '700',
  color: 'dialog.title',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  borderRadius: '8px',
  color: 'dialog.close',
  cursor: 'pointer',
  transition: 'all {durations.fast} ease-out',
  _hover: {
    bg: 'gray.100',
    color: 'text.title',
  },
});

export const body = css({
  p: '24px',
  color: 'dialog.content',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  p: '24px',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
});
