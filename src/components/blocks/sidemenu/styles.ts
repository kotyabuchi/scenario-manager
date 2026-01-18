import { css, cva } from '@/styled-system/css';

export const sideMenu = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    padding: 'sm',
    rounded: 'xl',
    background: 'bg.subtle',
    shadow: 'md',
    overflow: 'hidden',
    textAlign: 'left',
    alignItems: 'flex-start',
    transition: 'all {durations.normal}',
  },
  variants: {
    open: {
      true: {
        minWidth: '200px',
        width: 'fit-content',
      },
      false: {
        minWidth: '64px',
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
