import { css } from '@/styled-system/css';

/**
 * Tooltipコンテンツスタイル
 */
export const tooltipContent = css({
  bg: 'gray.800',
  color: 'white',
  padding: '[6px 10px]',
  borderRadius: 'md',
  fontSize: '[12px]',
  maxWidth: '[200px]',
  zIndex: '[50]',
});

/**
 * Tooltip矢印スタイル
 */
export const tooltipArrowTip = css({
  '--arrow-size': '[8px]',
  '--arrow-background': 'gray.800',
});
