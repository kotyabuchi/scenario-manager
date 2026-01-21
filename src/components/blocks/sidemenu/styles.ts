import { css, cva } from '@/styled-system/css';

export const sideMenu = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    padding: 'sm',
    rounded: 'xl',
    background: 'sidemenu.bg',
    shadow: 'sidemenu.default',
    overflow: 'hidden',
    textAlign: 'left',
    alignItems: 'flex-start',
    transition: 'all {durations.normal}',
  },
  variants: {
    open: {
      true: {
        width: '200px',
        shadow: 'sidemenu.hover',
      },
      false: {
        width: '64px',
      },
    },
  },
});

export const pageMenuButtons = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  overflow: 'hidden',
});

export const authButtons = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  overflow: 'hidden',
});
