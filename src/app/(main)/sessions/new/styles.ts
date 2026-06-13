import { css } from '@/styled-system/css';

export const pageContainer = css({
  bg: 'bg.page',
  minH: 'screen',
  display: 'flex',
  flexDirection: 'column',
});

// メインコンテンツエリア（SP時パディングなし）
export const mainContent = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  flex: '1',
  py: '0',
  px: '0',
  lg: {
    py: '8',
    px: '12',
  },
});
