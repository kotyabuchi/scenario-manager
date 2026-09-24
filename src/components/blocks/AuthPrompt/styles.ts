import { css } from '@/styled-system/css';

export const positioner = css({
  position: 'fixed',
  inset: '0',
  zIndex: 'modal',
  display: 'flex',
  alignItems: { base: 'flex-end', md: 'center' },
  justifyContent: 'center',
  p: { base: '0', md: '4' },
});

export const content = css({
  w: 'full',
  maxW: { base: 'full', md: '[440px]' },
  maxH: '[90dvh]',
  overflowY: 'auto',
  bg: 'dialog.bg',
  borderTopRadius: '2xl',
  borderBottomRadius: { base: '0', md: '2xl' },
  shadow: 'dialog.default',
  px: '6',
  pb: { base: '[calc(1.5rem + env(safe-area-inset-bottom))]', md: '6' },
  _open: { animation: '[slideInUp var(--durations-normal) ease-out]' },
  _closed: { animation: '[slideOutDown var(--durations-normal) ease-in]' },
});

export const handle = css({
  display: { base: 'block', md: 'none' },
  w: '10',
  h: '1',
  mx: 'auto',
  mt: '3',
  mb: '2',
  rounded: 'full',
  bg: 'border.default',
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
  pt: { base: '3', md: '6' },
});

export const title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '10',
  h: '10',
  rounded: 'lg',
  color: 'text.secondary',
  cursor: 'pointer',
  _hover: { bg: 'bg.input' },
  _focusVisible: { outline: 'focusRing' },
});

export const description = css({
  mt: '4',
  color: 'text.body',
  lineHeight: 'relaxed',
});

export const note = css({
  mt: '2',
  fontSize: 'sm',
  color: 'text.secondary',
  lineHeight: 'relaxed',
});

export const actions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  mt: '6',
  '& > button': { w: 'full' },
});
