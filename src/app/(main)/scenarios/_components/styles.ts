import { css, cva } from '@/styled-system/css';

/**
 * シナリオ一覧スタイル: Pencilデザイン準拠
 */

// ScenarioCard スタイル（Pencilデザイン準拠）
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'white',
  borderRadius: 'xl',
  overflow: 'hidden',
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

// システム名ラベル（リキッドカーブ付き）- Pencilデザイン準拠
export const cardSystemLabelWrapper = css({
  position: 'absolute',
  top: '0',
  left: '0',
  maxW: '[70%]',
  zIndex: '[1]',
});

// システムバッジのベーススタイル（色はcvaで制御）
export const cardSystemLabel = cva({
  base: {
    position: 'relative',
    px: '3',
    py: '1.5',
    display: 'flex',
    alignItems: 'center',
    borderBottomRightRadius: 'md',
  },
  variants: {
    system: {
      coc7: { bg: 'primary.500' },
      sw25: { bg: 'purple.500' },
      coc6: { bg: 'orange.500' },
      default: { bg: 'gray.500' },
    },
  },
  defaultVariants: {
    system: 'default',
  },
});

export const cardSystemLabelText = css({
  fontSize: '[11px]',
  fontWeight: 'semibold',
  color: 'white',
  truncate: true,
});

// リキッドカーブ（右側）- 色はpropsで制御するためベーススタイルのみ
export const cardSystemLabelCurveRight = css({
  position: 'absolute',
  top: '0',
  right: '-4',
  w: '4',
  h: '4',
});

// リキッドカーブ（下側）- 色はpropsで制御するためベーススタイルのみ
export const cardSystemLabelCurveBottom = css({
  position: 'absolute',
  bottom: '-4',
  left: '0',
  w: '4',
  h: '4',
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
  p: '4',
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
  borderRadius: '[40px]',
  bg: 'gray.100',
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

// ===== 新レイアウト: 3段階レスポンシブ =====

// キーワード検索バー（SP のみ表示、lg 以上は SearchTopBar に置換）
export const keywordSearchBar = css({
  bg: 'white',
  py: '4',
  px: '6',
  shadow: 'subHeader.default',
  lg: {
    display: 'none',
  },
});

export const keywordSearchContent = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  maxW: '[1400px]',
  mx: 'auto',
});

export const keywordSearchInput = css({
  flex: '1',
  height: '[44px]',
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
  maxW: '[1400px]',
  mx: 'auto',
  px: '6',
  py: '6',
  gap: '8',
  transitionProperty: 'all',
  transitionDuration: 'normal',
  transitionTimingFunction: 'ease-in-out',
});

// サイドバー（デスクトップのみ表示、折りたたみ対応）
export const sidebar = cva({
  base: {
    display: 'none',
    lg: {
      display: 'flex',
      flexDirection: 'column',
      flexShrink: '0',
      position: 'sticky',
      top: '[132px]', // GlobalHeader(64px) + SearchTopBar(68px)
      height: '[calc(100vh - 132px)]',
      overflowY: 'auto',
      bg: 'sidebar.bg',
      borderRadius: 'xl',
      shadow: 'card.default',
      transitionProperty: '[width, opacity]',
      transitionDuration: 'normal',
      transitionTimingFunction: 'ease-in-out',
      scrollbarWidth: '[none]',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
  variants: {
    collapsed: {
      true: {
        lg: {
          width: '[48px]',
          overflow: 'hidden',
          padding: '1',
          alignItems: 'center',
        },
      },
      false: {
        lg: {
          width: '[280px]',
          padding: '2',
        },
      },
    },
  },
  defaultVariants: {
    collapsed: false,
  },
});

// 結果コンテンツエリア（ローディングオーバーレイの基準位置）
export const resultsContent = css({
  flex: '1',
  position: 'relative',
  minW: '0',
});

// 検索結果ローディングオーバーレイ（isPending 時に表示）
export const resultsLoadingOverlay = css({
  position: 'absolute',
  inset: '0',
  bg: 'overlay.light',
  zIndex: 'overlay',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'xl',
});

// モバイル用フィルターボタン（lg 未満のみ表示）
export const mobileFilterRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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
  shadow: 'sm',
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

export const mobileResultCount = css({
  fontSize: 'xs',
  color: 'gray.500',
  flexShrink: '0',
});

// 検索結果ヘッダー（件数 + ソート）
export const resultHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  mb: 'lg',
  // タブレット以上で横並び
  md: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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

// ===== SearchTopBar（PC 上部検索バー、lg 以上のみ表示） =====

export const searchTopBar = css({
  display: 'none',
  lg: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    bg: 'white',
    px: '8',
    py: '4',
    shadow: 'subHeader.default',
    position: 'sticky',
    top: '[64px]', // GlobalHeader の高さ
    zIndex: 'sticky',
  },
});

export const searchTopBar_systemSelect = css({
  width: '[280px]',
  flexShrink: '0',
});

export const searchTopBar_keywordInput = css({
  flex: '1',
  height: '[44px]',
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

export const searchTopBar_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexShrink: '0',
});

// ===== SearchSidebar（サイドバー内コンテンツ） =====

// サイドバー内のフィルターコンテンツ（折りたたみ時はフェードアウト）
export const sidebarContent = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    overflow: 'hidden',
    transitionProperty: '[opacity, visibility]',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-in-out',
  },
  variants: {
    visible: {
      true: {
        opacity: '[1]',
        visibility: 'visible',
      },
      false: {
        opacity: '[0]',
        visibility: 'hidden',
      },
    },
  },
  defaultVariants: {
    visible: true,
  },
});

// サイドバー内の検索ボタン
export const sidebarSearchButton = css({
  mt: '4',
  px: '4',
  pb: '2',
});

// トグルボタン
export const sidebarToggle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  width: 'full',
  py: '2',
  px: '2',
  borderRadius: 'md',
  bg: 'sidebar.toggleBg',
  color: 'sidebar.toggleIcon',
  cursor: 'pointer',
  fontSize: 'xs',
  fontWeight: 'medium',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'sidebar.toggleBgHover',
  },
});

// 折りたたみ時のフィルターバッジ
export const sidebarCollapsedBadge = css({
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

// ===== MobileSearchBar（SP 検索バー、lg 未満のみ表示） =====

export const mobileSearchBar = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  bg: 'white',
  px: '6',
  py: '4',
  shadow: 'subHeader.default',
  lg: {
    display: 'none',
  },
});

export const mobileSearchBar_row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const mobileSearchBar_systemSelect = css({
  flex: '1',
  minW: '0',
});

// ===== ユーティリティ =====

// インラインスタイル禁止のため、width: 100% はクラスで定義
export const fullWidthButton = css({
  width: 'full',
});
