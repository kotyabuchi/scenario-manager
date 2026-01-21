import { css, cva } from '@/styled-system/css';

/**
 * 実験用スタイル: nani.now風（淡い緑ベース）
 *
 * 参考質感:
 * - 明度: 0.85-0.98（非常に明るい）
 * - 彩度: 0.05-0.15（低彩度でソフト）
 * - シャドウ: rgba(0,0,0,0.06)程度（薄め）
 * - 角丸: 16px（4の倍数）
 */

// カラー定義（淡い緑ベース）
const colors = {
  // 背景グラデーション
  bg: {
    from: 'oklch(0.98 0.02 150)', // 淡い緑
    to: 'oklch(0.98 0.02 180)', // 淡い青緑
  },
  // プライマリ（緑系）
  primary: {
    50: 'oklch(0.98 0.03 150)',
    100: 'oklch(0.95 0.05 150)',
    200: 'oklch(0.90 0.08 150)', // メイン
    500: 'oklch(0.65 0.15 160)',
    800: 'oklch(0.40 0.15 160)', // テキスト用
  },
  // アクセント（補色系）
  accent: {
    coral: 'oklch(0.85 0.10 15)', // 淡いコーラル
    purple: 'oklch(0.80 0.12 320)', // 淡い紫
  },
  // ニュートラル
  neutral: {
    50: 'oklch(0.98 0.01 150)',
    100: 'oklch(0.95 0.01 150)',
    600: 'oklch(0.45 0.05 150)',
    700: 'oklch(0.40 0.05 150)',
    800: 'oklch(0.35 0.05 150)',
  },
};

// シャドウ定義（nani.now風の薄さ）
const shadows = {
  xs: '0 1px 3px rgba(0, 0, 0, 0.06)',
  sm: '0 4px 6px rgba(0, 0, 0, 0.08)',
  md: '0 6px 12px rgba(0, 0, 0, 0.10)',
};

// ScenarioCard スタイル
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'white',
  borderRadius: '16px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all {durations.slow} cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: shadows.xs,
  _hover: {
    boxShadow: shadows.sm,
    transform: 'translateY(-4px)',
  },
});

export const cardThumbnail = css({
  position: 'relative',
  aspectRatio: '16/9',
  bg: colors.neutral[50],
  overflow: 'hidden',
});

export const cardThumbnailImage = css({
  objectFit: 'cover',
  transition: 'all {durations.slow}',
  _groupHover: {
    transform: 'scale(1.05)',
    filter: 'brightness(1.1)',
  },
});

export const cardThumbnailPlaceholder = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'xs',
  background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
  color: colors.neutral[600],
});

export const cardThumbnailPlaceholderIcon = css({
  w: '32px',
  h: '32px',
  opacity: 0.4,
});

export const cardThumbnailPlaceholderText = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  opacity: 0.6,
});

// システム名ラベル（リキッドカーブ付き）- 淡い緑ベース
export const cardSystemLabelWrapper = css({
  position: 'absolute',
  top: 0,
  left: 0,
  maxW: '70%',
  zIndex: 1,
});

export const cardSystemLabel = css({
  position: 'relative',
  bg: colors.primary[100],
  backdropFilter: 'blur(8px)',
  px: 'md', // 余白を広く
  py: '2',
  minH: '32px', // radius 16pxの2倍の高さ（4の倍数）
  display: 'flex',
  alignItems: 'center',
  borderBottomRightRadius: '16px',
});

export const cardSystemLabelText = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: colors.primary[800],
  truncate: true,
});

// リキッドカーブ（右側）
export const cardSystemLabelCurveRight = css({
  position: 'absolute',
  top: 0,
  right: '-16px',
  w: '16px',
  h: '16px',
  background: `radial-gradient(circle 16px at 100% 100%, transparent 15.5px, ${colors.primary[100]} 16px)`,
});

// リキッドカーブ（下側）
export const cardSystemLabelCurveBottom = css({
  position: 'absolute',
  bottom: '-16px',
  left: 0,
  w: '16px',
  h: '16px',
  background: `radial-gradient(circle 16px at 100% 100%, transparent 15.5px, ${colors.primary[100]} 16px)`,
});

// お気に入りボタン - コーラルアクセント
export const cardFavoriteButton = css({
  position: 'absolute',
  top: '8px',
  right: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  px: 'sm',
  py: '4px',
  borderRadius: 'full',
  bg: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(4px)',
  transition: 'all {durations.normal}',
  zIndex: 1,
  boxShadow: shadows.xs,
  _hover: {
    bg: 'white',
    boxShadow: shadows.sm,
  },
});

export const cardFavoriteIcon = css({
  w: '14px',
  h: '14px',
  color: colors.accent.coral,
});

export const cardFavoriteIconActive = css({
  w: '14px',
  h: '14px',
  color: colors.accent.coral,
  fill: colors.accent.coral,
});

export const cardFavoriteCount = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: colors.neutral[700],
});

export const cardContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  p: 'md', // 少し広めのパディング
  flex: 1,
});

export const cardTitle = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: colors.neutral[800],
  lineClamp: 2,
  lineHeight: 'tight',
  textWrap: 'balance',
});

export const cardMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  fontSize: 'sm',
  color: colors.neutral[600],
});

export const cardMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

export const cardMetaIcon = css({
  w: '14px',
  h: '14px',
});

export const cardTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
});

export const cardTag = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: 'sm',
  py: '2px',
  fontSize: 'xs',
  bg: colors.primary[50],
  borderRadius: '12px', // 大きめの角丸
  color: colors.primary[800],
  fontWeight: 'medium',
  boxShadow: shadows.xs,
});

export const cardDescription = css({
  fontSize: 'xs',
  color: colors.neutral[600],
  lineClamp: 3,
  lineHeight: 'relaxed',
});

// ScenarioList スタイル
export const scenarioListContainer = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'xl', // より広めの間隔
});

export const scenarioListEmpty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: '2xl',
  gap: 'md',
  color: colors.neutral[600],
});

export const scenarioListEmptyIcon = css({
  fontSize: '3xl',
});

export const scenarioListEmptyText = css({
  fontSize: 'md',
  textAlign: 'center',
});

export const scenarioListEmptySubtext = css({
  fontSize: 'sm',
  textAlign: 'center',
  color: colors.neutral[600],
});

// SearchPanel スタイル
export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  p: 'lg', // より広めのパディング
  bg: 'white',
  borderRadius: '16px',
  mb: 'lg',
  boxShadow: shadows.sm,
});

export const seachConditions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
});

export const searchPanelRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'md',
  alignItems: 'flex-end',
});

export const searchPanelField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  minW: '200px',
  flex: 1,
  border: 'none',
  padding: 0,
  margin: 0,
  '& > legend': {
    mb: 'sm',
  },
});

export const searchPanelLabel = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: colors.neutral[700],
  letterSpacing: '0.01em',
});

export const searchPanelChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const expandButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'xs',
  w: '100%',
  px: 'md',
  py: 'sm',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: colors.neutral[700],
  bg: 'transparent',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  _hover: {
    color: colors.primary[800],
    bg: colors.primary[50],
  },
});

export const detailedConditions = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'md',
    transition: 'all {durations.slow} ease-in-out',
  },
  variants: {
    expanded: {
      true: {
        maxHeight: '1000px',
        opacity: 1,
        overflow: 'visible',
      },
      false: {
        maxHeight: '0',
        opacity: 0,
        overflow: 'hidden',
      },
    },
  },
  defaultVariants: {
    expanded: false,
  },
});

export const searchDivider = css({
  border: 'none',
  h: '1px',
  bg: colors.neutral[100],
  my: 'lg',
});

export const searchActions = css({
  display: 'flex',
  gap: 'sm',
});

export const rangeInput = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  fontSize: 'sm',
  color: colors.neutral[700],
});

export const rangeInputField = css({
  w: '80px',
});

// ページスタイル
export const pageContainer = css({
  maxW: '1200px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
  // 背景は(main)/layout.tsxで設定
});

export const pageHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 'xl',
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: colors.neutral[800],
});

// 検索結果ヘッダー（件数 + ソート）
export const resultHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  mb: 'lg',
  // タブレット以上で横並び
  md: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export const resultCount = css({
  fontSize: 'sm',
  color: colors.neutral[600],
});

export const sortTabs = css({
  display: 'flex',
  gap: 'xs',
  bg: 'white',
  p: 'xs',
  borderRadius: '16px',
  boxShadow: shadows.xs,
});

export const sortTabButton = cva({
  base: {
    px: 'md',
    py: 'sm',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: colors.neutral[600],
    bg: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all {durations.normal}',
    _hover: {
      color: colors.primary[800],
      bg: colors.primary[50],
    },
  },
  variants: {
    active: {
      true: {
        color: colors.primary[800],
        bg: colors.primary[100],
        fontWeight: 'bold',
        boxShadow: shadows.xs,
        _hover: {
          color: colors.primary[800],
          bg: colors.primary[100],
        },
      },
    },
  },
});
