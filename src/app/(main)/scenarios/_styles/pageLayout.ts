import { css } from '@/styled-system/css';

// ページコンテナ
export const pageContainer = css({
  bg: 'bg.page',
  minH: 'screen',
  display: 'flex',
  flexDirection: 'column',
});

// メインコンテンツエリア
export const mainContent = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  py: '8',
  px: '12',
  flex: '1',
});
