import { css } from '@/styled-system/css';

// ページ全体のコンテナ（全幅）
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  minH: 'screen',
  bg: 'gray.50', // #F9FAFB
});

// メインコンテンツエリア（Pencil: padding [32, 120]）
export const mainContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  maxW: '[1440px]',
  w: 'full',
  mx: 'auto',
  px: '[120px]',
  py: '8',
});

export const divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
  my: '4',
});
