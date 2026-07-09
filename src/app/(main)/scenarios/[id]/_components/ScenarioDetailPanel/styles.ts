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
  gap: '4',
});

// --- ヘッダーバー（戻るリンク＋お気に入り/セッション作成） ---

export const headerBar = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  columnGap: '3',
  rowGap: '2',
});

export const headerBar_back = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.600',
  textDecoration: 'none',
  _hover: {
    color: 'primary.700',
    textDecoration: 'underline',
  },
  // ラベルのハーフレディングを刈り取り、CaretLeftと光学中央揃え
  '& > span': {
    textTrim: true,
  },
});

export const headerBar_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

// お気に入りON時の星色
export const headerBar_starActive = css({
  color: 'orange.400',
});

// ヘッド＋シナリオ概要をまとめる主カード（モック上段の白い面）
export const mainCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
  bg: 'card.bg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'paperBorder.50',
  borderRadius: '2xl',
  p: '5',
  shadow: 'card.default',
});

export const overview_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.body',
  mb: '2',
});

export const overview_text = css({
  fontSize: 'sm',
  lineHeight: 'relaxed',
  color: 'text.secondary',
  whiteSpace: 'pre-wrap',
});

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  minWidth: '0',
});

// 関連セッション/プレイ動画/コメントの独立カード
export const sectionCard = css({
  bg: 'card.bg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'paperBorder.50',
  borderRadius: '2xl',
  p: '5',
  minWidth: '0',
  shadow: 'card.default',
});

// セクションカード群の配置。狭い時は縦積み、
// 広い時はセッション全幅＋動画/コメントを2カラム（3カラム均等はコメントが窮屈になるため不採用）
export const sectionsGrid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '4',
  '@container (min-width: 900px)': {
    gridTemplateColumns: '[repeat(2, 1fr)]',
    '& > :first-child': {
      gridColumn: '[1 / -1]',
    },
  },
});

// アンカースクロール時に上端へ余白を確保
export const sectionAnchor = css({
  scrollMarginTop: '6',
});

// --- ScenarioDetailHead（上部情報群 / first-view）---

export const head = css({
  // サムネをカード端まで余白なしで出すため padding は持たない。
  // はみ出しは overflow:hidden で角丸に合わせて切る。
  containerType: 'inline-size',
  display: 'flex',
  flexWrap: 'wrap',
  // ボーダーは持たない（輪郭は主カード側の1枚だけ。概要と同じフラットな階層に揃える）
  borderRadius: 'xl',
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
