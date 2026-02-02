import { css } from '@/styled-system/css';

/**
 * Modal スタイル定義 - 画面設計準拠
 */

export const backdrop = css({
  position: 'fixed',
  inset: '0',
  bg: 'overlay.dark',
  backdropFilter: '[blur(4px)]',
  zIndex: '[9998]',
  _open: {
    animation: '[fadeIn var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[fadeOut var(--durations-normal) ease-in]',
  },
});

export const positioner = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '[9999]',
  p: '4',
});

export const content = css({
  bg: 'dialog.bg',
  borderRadius: 'xl',
  boxShadow: 'dialog.default',
  maxW: '[500px]',
  w: 'full',
  maxH: '[90vh]',
  overflow: 'auto',
  _open: {
    animation: '[slideInUp var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[slideOutDown var(--durations-normal) ease-in]',
  },
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: '6',
  borderBottom: '[1px solid]',
  borderColor: 'border.subtle',
});

export const title = css({
  fontSize: '[18px]',
  fontWeight: 'bold',
  color: 'dialog.title',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  borderRadius: 'md',
  color: 'dialog.close',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'gray.100',
    color: 'text.title',
  },
});

export const body = css({
  p: '6',
  color: 'dialog.content',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
  p: '6',
  borderTop: '[1px solid]',
  borderColor: 'border.subtle',
});
