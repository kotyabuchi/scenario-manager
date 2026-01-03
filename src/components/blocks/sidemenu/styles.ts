import { css, cva } from '@/styled-system/css';

export const sideMenu = cva({
  base: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    padding: '6px',
    rounded: 'lg',
    background: 'primary.subtle',
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
        minWidth: '56px',
        width: '56px',
      },
    },
  },
});

export const mainPages = css({
  width: '100%',
  gap: '6px',
  overflow: 'hidden',
});
