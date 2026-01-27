import { css } from '@/styled-system/css';

/**
 * Tooltipコンテンツスタイル
 */
export const tooltipContent = css({
  bg: '#1F2937',
  color: 'white',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  maxWidth: '200px',
  zIndex: 50,
});

/**
 * Tooltip矢印スタイル
 */
export const tooltipArrowTip = css({
  '--arrow-size': '8px',
  '--arrow-background': '#1F2937',
});
