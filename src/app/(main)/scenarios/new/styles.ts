import { css } from '@/styled-system/css';

// 共通ページレイアウトスタイル
export { pageContainer } from '../_styles/pageLayout';

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

// ヘッダー右側リンク（新規作成ページ固有）
export const pageHeaderLink = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  fontSize: '[13px]',
  color: 'primary.700',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
    color: 'primary.800',
  },
});
