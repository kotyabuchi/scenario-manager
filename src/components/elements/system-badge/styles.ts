import { css } from '@/styled-system/css';

export const badge = (size: 'sm' | 'md') =>
  css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'semibold',
    color: 'white',
    borderRadius: '[0 0 8px 0]',
    ...(size === 'sm'
      ? {
          fontSize: '[10px]',
          py: '1',
          px: '2',
        }
      : {
          fontSize: '[11px]',
          py: '1.5',
          px: '3',
        }),
  });
