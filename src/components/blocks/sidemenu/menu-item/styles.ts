import { css } from '@/styled-system/css';
import { hstack } from '@/styled-system/patterns';

export const menuItem = hstack({
  width: '100%',
  padding: '6px',
  rounded: 'md',
  textAlign: 'left',
  gap: '8px',
  color: 'primary.foreground.dark',
  transition: 'all {durations.normal} ease-in-out',
  _hover: {
    background: 'primary.default',
    color: 'primary.foreground.white',
  },
});

export const menuItemIcon = css({
  flexShrink: 0,
});

export const menuItemText = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});
