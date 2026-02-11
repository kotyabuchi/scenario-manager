import { css } from '@/styled-system/css';

// 共通ページレイアウトスタイル
export { mainContent, pageContainer } from '../_styles/pageLayout';

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
