import { css } from '@/styled-system/css';

/**
 * ScenarioListPanel（一覧ペイン）スタイル
 *
 * 2ペイン左側の一覧ペイン。上部インラインフィルター（ScenarioFilters）＋
 * 検索結果ヘッダー（件数/並び替え）＋カードグリッド（ScenarioList）を
 * 縦に積む自己完結パネル。ScenarioDetailPanel と対になる粒度。
 */
export const panel = css({
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  minWidth: '0',
});

// 検索結果ヘッダー（件数 + 並び替え）
export const resultHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
});

export const resultCount = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const sortArea = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const sortLabel = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const sortSelectWrapper = css({
  width: '[140px]',
});

export const loadMoreContainer = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '4',
});

export const loadMoreButton = css({
  px: '8',
  shadow: 'header.default',
});

export const loadMoreIcon = css({
  color: 'icon.muted',
});
