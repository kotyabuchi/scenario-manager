import { css } from '@/styled-system/css';

export const pageContainer = css({
  minH: 'screen',
  bg: 'bg.page',
  px: '4',
  md: { px: '6' },
  xl: { px: '8' },
});

export const pageLayout = css({
  display: 'grid',
  maxW: '[1440px]',
  mx: 'auto',
  py: '6',
  gap: '6',
  alignItems: 'start',
  xl: { gridTemplateColumns: 'minmax(0, 1fr) 200px' },
});

export const pageMain = css({
  minW: '0',
  display: 'grid',
  gap: '4',
});

export const desktopToc = css({
  display: 'none',
  xl: { display: 'block' },
});

export const tocSticky = css({
  position: 'sticky',
  top: '6',
  bg: 'card.bg',
  borderRadius: 'xl',
  p: '4',
  shadow: 'card.default',
});

export const tocTitle = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.body',
  mb: '3',
});

export const mobileToc = css({
  position: 'sticky',
  top: '0',
  zIndex: 'sticky',
  display: 'flex',
  justifyContent: 'flex-end',
  xl: { display: 'none' },
});

export const mobileTocTrigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  py: '2',
  px: '3',
  borderRadius: 'lg',
  bg: 'card.bg',
  color: 'text.body',
  shadow: 'card.default',
  fontSize: 'sm',
  fontWeight: 'semibold',
  cursor: 'pointer',
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[2px]',
  },
});

export const drawerBackdrop = css({
  position: 'fixed',
  inset: '0',
  bg: 'overlay.dark',
  zIndex: 'overlay',
  _open: {
    animation: '[fadeIn var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[fadeOut var(--durations-normal) ease-in]',
  },
});

export const drawerPositioner = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 'modal',
});

export const drawerContent = css({
  outline: 'none',
  width: 'full',
  maxH: '[85dvh]',
  overflowY: 'auto',
  bg: 'card.bg',
  borderTopLeftRadius: '2xl',
  borderTopRightRadius: '2xl',
  p: '5',
  shadow: 'dialog.default',
  _open: {
    animation: '[slideInUp var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[slideOutDown var(--durations-normal) ease-in]',
  },
});

export const drawerHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  mb: '4',
});
