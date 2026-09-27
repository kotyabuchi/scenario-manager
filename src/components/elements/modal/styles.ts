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

export const positioner = cva({
  base: {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'modal',
    p: { base: '2', md: '4' },
  },
  variants: {
    mobileSheet: {
      true: {
        alignItems: { base: 'flex-end', md: 'center' },
        p: { base: '0', md: '4' },
      },
    },
  },
});

export const content = cva({
  base: {
    bg: 'dialog.bg',
    borderRadius: { base: 'xl', md: '2xl' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border.paper',
    boxShadow: 'dialog.default',
    outline: 'none',
    w: 'full',
    maxH: { base: '[95dvh]', md: '[90dvh]' },
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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
      md: { maxW: '[560px]' },
      lg: { maxW: '[640px]' },
    },
    mobileSheet: {
      true: {
        borderRadius: { base: '[24px 24px 0 0]', md: '2xl' },
        maxH: { base: '[94dvh]', md: '[90dvh]' },
      },
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
  p: { base: '5', md: '6' },
  flexShrink: '0',
});

export const title = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  color: 'dialog.title',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '11',
  h: '11',
  borderRadius: 'md',
  border: 'none',
  bg: 'transparent',
  color: 'dialog.close',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'primary.subtleHover',
    color: 'text.title',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
});

export const body = css({
  p: { base: '5', md: '6' },
  color: 'dialog.content',
  overflowY: 'auto',
  minH: '0',
  flex: '1',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
  p: { base: '4', md: '6' },
  flexShrink: '0',
  bg: 'dialog.bg',
});

export const divider = css({
  height: '[1px]',
  bg: 'border.paper',
  border: 'none',
  m: '0',
});

export const sheetHandle = css({
  display: { base: 'block', md: 'none' },
  w: '10',
  h: '1',
  borderRadius: 'full',
  bg: 'border.default',
  alignSelf: 'center',
  mt: '3',
  mb: '0',
  flexShrink: '0',
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
