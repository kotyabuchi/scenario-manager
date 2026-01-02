import { cva } from '@/styled-system/css';

export const sideMenu = cva({
  base: {
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
