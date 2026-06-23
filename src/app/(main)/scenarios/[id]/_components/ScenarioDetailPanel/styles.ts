import { css, cva } from '@/styled-system/css';

/**
 * ScenarioDetailPanel（詳細ペイン）スタイル
 *
 * 2ペイン右側の詳細。タブを使わずセクション縦並び＋目次（SectionToc）。
 * パネル幅でレイアウトを切り替えるためコンテナクエリを使う。
 */
export const panel = css({
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const layout = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '6',
  // パネルが広い時だけ右に目次カラムを出す
  '@container (min-width: 900px)': {
    gridTemplateColumns: '[1fr_200px]',
    gap: '10',
  },
});

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  minWidth: '0',
});

// アンカースクロール時に上端へ余白を確保
export const sectionAnchor = css({
  scrollMarginTop: '6',
});

export const aside = css({
  display: 'none',
  '@container (min-width: 900px)': {
    display: 'block',
    position: 'sticky',
    top: '6',
    alignSelf: 'start',
  },
});

// --- ScenarioDetailHead（上部情報群 / first-view）---

export const head = css({
  // サムネをカード端まで余白なしで出すため padding は持たない。
  // はみ出しは overflow:hidden で角丸に合わせて切る。
  containerType: 'inline-size',
  display: 'flex',
  flexWrap: 'wrap',
  // 背景は持たず背後に一致させる。シャドウも使わず最も薄い灰色のボーダーで輪郭を出す
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.50',
  overflow: 'hidden',
});

export const head_thumbnail = css({
  position: 'relative',
  width: 'full',
  aspectRatio: '[16/9]',
  flexShrink: 0,
  // 広い時は左に固定幅で縦に伸ばす（カード端まで余白なし）
  '@container (min-width: 560px)': {
    width: '[300px]',
    aspectRatio: '[auto]',
    alignSelf: 'stretch',
    minHeight: '[220px]',
  },
});

export const head_thumbnailPlaceholder = css({
  display: 'grid',
  placeItems: 'center',
  width: 'full',
  aspectRatio: '[16/9]',
  flexShrink: 0,
  bgGradient: 'to-br',
  gradientFrom: 'gray.50',
  gradientTo: 'gray.200',
  color: 'icon.muted',
  '@container (min-width: 560px)': {
    width: '[300px]',
    aspectRatio: '[auto]',
    alignSelf: 'stretch',
    minHeight: '[220px]',
  },
});

export const head_content = css({
  flex: '1',
  minWidth: '[240px]',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  // padding は content 側に持たせる（サムネは余白なし）
  p: '5',
});

// シナリオ名の上の行。
// 狭い時: 縦並び・左寄せ / 広い時: 左=バッジ群（残り領域）/ 右=評価（縮小なし）
export const head_topRow = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2',
  '@container (min-width: 560px)': {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3',
  },
});

export const head_badges = css({
  flex: '1',
  minWidth: '0',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5',
});

// シナリオ名＋システムは余白を詰めて1グループに
export const head_titleGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const head_title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  lineHeight: 'tight',
  color: 'text.body',
});

export const head_system = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const head_tags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5',
});

export const head_description = css({
  fontSize: 'sm',
  lineHeight: 'relaxed',
  color: 'text.secondary',
});

export const head_metaRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '5',
  rowGap: '3',
  mt: '1',
});

export const head_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const head_metaIcon = css({
  color: 'icon.muted',
  flexShrink: 0,
});

export const head_metaText = css({
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 'tight',
});

export const head_metaLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const head_metaValue = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
});

export const head_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export const head_ratingStars = css({
  display: 'flex',
  color: 'rating.filled',
});

// 星の塗り/空きの濃淡（インラインstyleを避ける）
export const head_star = cva({
  base: {},
  variants: {
    filled: {
      true: { opacity: '[1]' },
      false: { opacity: '[0.3]' },
    },
  },
});

// next/image (fill) の object-fit をクラスで指定
export const head_thumbnailImage = css({
  objectFit: 'cover',
});

export const head_ratingText = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const head_distribute = css({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '1',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.text',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
});
