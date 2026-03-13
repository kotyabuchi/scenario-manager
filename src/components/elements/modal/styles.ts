import { css, cva } from '@/styled-system/css';

/**
 * Modal スタイル定義 - 画面設計準拠
 */

export const backdrop = css({
  position: 'fixed',
  inset: '0',
  bg: 'overlay.dark',
  backdropFilter: '[blur(4px)]',
  zIndex: 'overlay',
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
  zIndex: 'modal',
  p: { base: '2', md: '4' },
});

export const content = cva({
  base: {
    bg: 'dialog.bg',
    borderRadius: { base: 'lg', md: 'xl' },
    boxShadow: 'dialog.default',
    w: 'full',
    maxH: { base: '[95vh]', md: '[90vh]' },
    overflowX: 'hidden',
    overflowY: 'auto',
    _open: {
      animation: '[slideInUp var(--durations-normal) ease-out]',
    },
    _closed: {
      animation: '[slideOutDown var(--durations-normal) ease-in]',
    },
  },
  variants: {
    size: {
      sm: { maxW: '[420px]' },
      md: { maxW: '[500px]' },
      lg: { maxW: '[640px]' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: { base: '4', md: '6' },
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
  _focusVisible: {
    outline: 'focusRing',
  },
});

export const body = css({
  p: { base: '4', md: '6' },
  color: 'dialog.content',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
  p: { base: '4', md: '6' },
});

export const divider = css({
  height: '[1px]',
  bg: 'border.subtle',
  border: 'none',
  m: '0',
});

export const headerDanger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  p: { base: '4', md: '6' },
  bg: 'error.default',
  borderTopRadius: { base: 'lg', md: 'xl' },
});

export const titleDanger = css({
  fontSize: '[18px]',
  fontWeight: 'bold',
  color: 'error.textOnError',
});

export const headerIcon_style = css({
  color: 'error.textOnError',
  flexShrink: '0',
});
