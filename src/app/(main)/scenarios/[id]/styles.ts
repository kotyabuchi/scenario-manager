import { css } from '@/styled-system/css';

// ページ全体のコンテナ（全幅）
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  minH: '100vh',
  bg: 'gray.50', // #F9FAFB
});

// メインコンテンツエリア（Pencil: padding [32, 120]）
export const mainContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xl',
  maxW: '1440px',
  w: '100%',
  mx: 'auto',
  px: '120px',
  py: 'xl',
});

export const divider = css({
  border: 'none',
  h: '1px',
  bg: 'gray.200',
  my: 'md',
});
