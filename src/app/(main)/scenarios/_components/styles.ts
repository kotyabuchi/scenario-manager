import { css, cva } from '@/styled-system/css';

/**
 * シナリオ一覧スタイル: Pencilデザイン準拠
 */

// ScenarioCard スタイル（Pencilデザイン準拠）
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  bg: 'white',
  borderRadius: '2xl',
  p: '3',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  transitionTimingFunction: '[cubic-bezier(0.4, 0, 0.2, 1)]',
  boxShadow: '[0 4px 16px rgba(0, 0, 0, 0.06)]',
  _hover: {
    boxShadow: '[0 8px 24px rgba(0, 0, 0, 0.10)]',
    transform: 'translateY(-4px)',
  },
});

export const cardThumbnail = css({
  position: 'relative',
  height: '[180px]',
  bg: 'gray.100',
  overflow: 'hidden',
  borderTopLeftRadius: '0',
  borderTopRightRadius: 'xl',
  borderBottomLeftRadius: 'xl',
  borderBottomRightRadius: 'xl',
});

export const cardThumbnailImage = css({
  objectFit: 'cover',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _groupHover: {
    transform: 'scale(1.05)',
    filter: '[brightness(1.1)]',
  },
});

export const cardThumbnailPlaceholder = css({
  width: 'full',
  height: 'full',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'xs',
  background:
    '[linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)]',
  color: 'gray.500',
});

export const cardThumbnailPlaceholderIcon = css({
  w: '8',
  h: '8',
  opacity: 'disabled',
  color: 'white',
});

export const cardThumbnailPlaceholderText = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  opacity: 'disabled',
  color: 'white',
});

// システム名ラベル（CSS mask による逆角丸カットアウト）
export const cardSystemLabel = css({
  position: 'absolute',
  top: '0',
  left: '0',
  maxW: '[70%]',
  pt: '0',
  pb: '1',
  pl: '0',
  pr: '1',
  display: 'flex',
  alignItems: 'center',
  bg: 'white',
  borderBottomRightRadius: '2xl',
  _before: {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '[100%]',
    w: '[14px]',
    h: '[14px]',
    bg: '[inherit]',
    maskImage:
      '[radial-gradient(circle at 100% 100%, transparent 13.5px, black calc(13.5px + 1px))]',
  },
  _after: {
    content: '""',
    position: 'absolute',
    top: '[100%]',
    left: '0',
    w: '[14px]',
    h: '[14px]',
    bg: '[inherit]',
    maskImage:
      '[radial-gradient(circle at 100% 100%, transparent 13.5px, black calc(13.5px + 1px))]',
  },
});

// システム名テキスト（色はシステム別）
export const cardSystemLabelText = cva({
  base: {
    px: '2',
    py: '0.5',
    fontSize: 'xs',
    fontWeight: 'bold',
    truncate: true,
  },
  variants: {
    system: {
      coc7: { color: 'primary.600' },
      sw25: { color: 'purple.600' },
      coc6: { color: 'orange.600' },
      default: { color: 'gray.600' },
    },
  },
  defaultVariants: {
    system: 'default',
  },
});

// お気に入りボタン - Pencilデザイン準拠
export const cardFavoriteButton = css({
  position: 'absolute',
  top: '3',
  right: '3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '[28px]',
  h: '[28px]',
  borderRadius: '[14px]',
  bg: '[rgba(0, 0, 0, 0.25)]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  zIndex: '[1]',
  _hover: {
    bg: '[rgba(0, 0, 0, 0.4)]',
  },
});

export const cardFavoriteIcon = css({
  w: '4',
  h: '4',
  color: 'white',
});

export const cardFavoriteIconActive = css({
  w: '4',
  h: '4',
  color: 'orange.500',
  fill: 'orange.500',
});

export const cardFavoriteCount = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'white',
});

export const cardContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  flex: '1',
});

export const cardTitle = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'gray.800',
  lineClamp: 2,
  lineHeight: 'tight',
  textWrap: 'balance',
});

export const cardMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  fontSize: '[13px]',
  color: 'gray.500',
});

export const cardMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
});

export const cardMetaIcon = css({
  w: '3.5',
  h: '3.5',
  color: 'gray.500',
});

export const cardTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5',
});

export const cardTag = css({
  display: 'inline-flex',
  alignItems: 'center',
  h: '6',
  px: '2',
  fontSize: '[11px]',
  fontWeight: 'medium',
  bg: 'gray.100',
  borderRadius: 'sm',
  color: 'gray.600',
});

export const cardDescription = css({
  fontSize: 'xs',
  color: 'gray.500',
  lineClamp: 3,
  lineHeight: 'relaxed',
});

// ScenarioList スタイル
export const scenarioListContainer = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '8', // より広めの間隔
});

// 空状態コンテナ（Pencilデザイン準拠）
export const scenarioListEmpty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1',
  py: '2xl',
  gap: '6',
});

// 空状態アイコンフレーム（80x80 円形）
export const scenarioListEmptyIconFrame = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '20',
  h: '20',
});

export const scenarioListEmptyIcon = css({
  w: '9',
  h: '9',
  color: 'gray.400',
});

export const scenarioListEmptyText = css({
  fontSize: '[18px]',
  fontWeight: 'semibold',
  color: 'gray.700',
  textAlign: 'center',
});

export const scenarioListEmptySubtext = css({
  fontSize: 'sm',
  fontWeight: 'normal',
  color: 'gray.500',
  textAlign: 'center',
});

// 空状態アクションボタン群
export const scenarioListEmptyActions = css({
  display: 'flex',
  gap: '4',
});

// ページスタイル
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
});

// ===== 共有スタイル =====

// キーワード入力フィールド（MobileSearchBar から参照）
export const keywordSearchInput = css({
  flex: '1',
  height: '[44px]',
  minH: '[44px]',
  px: '4',
  border: 'none',
  borderRadius: 'md',
  bg: 'gray.100',
  color: 'gray.800',
  fontSize: 'sm',
  outline: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'gray.200',
  },
  _focus: {
    bg: 'gray.100',
    outline: '[2px solid]',
    outlineColor: 'primary.500',
  },
  _placeholder: {
    color: 'gray.400',
  },
});

// メインコンテンツエリア（サイドバー + 結果グリッド）
export const mainContent = css({
  display: 'flex',
  flex: '1',
  transitionProperty: '[all]',
  transitionDuration: 'normal',
  transitionTimingFunction: 'ease-in-out',
});

// 結果コンテンツエリア（ローディングオーバーレイの基準位置）
export const resultsContent = css({
  flex: '1',
  position: 'relative',
  minW: '0',
  p: '6',
});

// モバイル用フィルターボタン（lg 未満のみ表示）
export const mobileFilterRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  py: '3',
  px: '6',
  bg: 'white',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'gray.100',
  lg: {
    display: 'none',
  },
});

export const mobileFilterButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '4',
  height: '[36px]',
  bg: 'white',
  borderRadius: 'md',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.700',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.50',
  },
});

export const mobileFilterBadge = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '[20px]',
  h: '[20px]',
  px: '1.5',
  borderRadius: 'full',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'xs',
  fontWeight: 'semibold',
});

export const mobileFilterChips = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flex: '1',
  overflow: 'hidden',
});

export const mobileFilterChip = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  height: '[28px]',
  bg: 'primary.100',
  color: 'primary.800',
  borderRadius: 'md',
  fontSize: 'xs',
  fontWeight: 'medium',
  flexShrink: '0',
});

export const mobileFilterChipRemove = css({
  cursor: 'pointer',
  opacity: '[0.7]',
  _hover: {
    opacity: '[1]',
  },
});

// 検索結果ヘッダー（件数 + ソート）
export const resultHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
  mb: 'lg',
});

export const resultCount = css({
  fontSize: '[13px]',
  color: 'gray.500',
});

// ソートエリア（Pencilデザイン準拠）
export const sortArea = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const sortLabel = css({
  fontSize: '[13px]',
  color: 'gray.500',
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
  color: 'gray.500',
});

// ===== ユーティリティ =====

// インラインスタイル禁止のため、width: 100% はクラスで定義
export const fullWidthButton = css({
  width: 'full',
});
