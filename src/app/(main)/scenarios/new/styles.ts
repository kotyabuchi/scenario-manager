import { css } from '@/styled-system/css';

// ページコンテナ
export const pageContainer = css({
  bg: 'bg.page',
  minH: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

// ページヘッダー（Pencil: header）
export const pageHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  bg: 'white',
  px: '32px',
  py: '8px',
  shadow: 'panel.default',
});

export const pageHeaderLeft = css({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

// 戻るボタン（Pencil: backBtn - 36x36, cornerRadius:10, bg:#F7F6F3）
export const pageBackButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '36px',
  h: '36px',
  borderRadius: '10px',
  bg: '#F7F6F3',
  color: 'gray.500',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  border: 'none',
  _hover: {
    bg: 'gray.200',
  },
});

// ページタイトル（Pencil: fontSize:18, fontWeight:700, color:#1F2937）
export const pageTitle = css({
  fontSize: '18px',
  fontWeight: '700',
  color: 'gray.800',
});

// メインコンテンツエリア
export const mainContent = css({
  display: 'flex',
  justifyContent: 'center',
  p: '32px 48px',
  flex: 1,
});
