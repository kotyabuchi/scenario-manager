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

// SearchPanel スタイル（ヘッダーと一体化）
export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  px: '8',
  py: '6',
  bg: 'white',
  // ヘッダーと一体化するため、上部のborderRadiusなし、影は下方向のみ
  borderRadius: '[0]',
  shadow: 'subHeader.default',
});

// 検索パネルのメイン行（横並び）
export const searchPanelMainRow = css({
  display: 'flex',
  alignItems: 'flex-end',
  gap: '6',
});

// システム選択フィールド
export const searchPanelSystemField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  width: '[320px]',
  minW: '[280px]',
});

// シナリオ名フィールド
export const searchPanelNameField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  flex: '1',
  minW: '[200px]',
});

// ボタングループ
export const searchPanelButtons = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  flexShrink: 0,
});

export const clearButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  px: '4',
  height: '[44px]',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.700',
  bg: 'white',
  border: 'none',
  borderRadius: 'md',
  cursor: 'pointer',
  boxShadow: '[0 1px 3px rgba(0, 0, 0, 0.1)]',
  whiteSpace: 'nowrap',
  _hover: {
    bg: 'gray.50',
  },
});

export const seachConditions = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const searchPanelRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4',
  alignItems: 'flex-end',
});

export const searchPanelField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minW: '[200px]',
  flex: '1',
  border: 'none',
  padding: '0',
  margin: '0',
  '& > legend': {
    mb: 'sm',
  },
});

export const searchPanelLabel = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.700',
  letterSpacing: '[0.01em]',
});

export const searchPanelChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// スライダーフィールド（固定幅280px - Pencilデザイン準拠）
export const sliderField = css({
  width: '[280px]',
  flexShrink: '0',
});

// タグ選択フィールド
export const tagField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  flex: '1',
  minW: '[200px]',
});

// 詳細条件行（プレイ人数、プレイ時間、タグを横並び）
export const detailedConditionsRow = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6',
});

// システム選択の入力風コンテナ
export const systemSelectContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
  minH: '[44px]',
  px: '4',
  py: '2',
  bg: 'gray.100',
  borderRadius: 'md',
});

// 選択されたシステムのタグ（Pencilデザイン準拠）
export const systemTag = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  px: '2',
  py: '1',
  fontSize: '[13px]',
  fontWeight: 'normal',
  bg: 'white',
  color: 'gray.700',
  borderRadius: 'sm',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
});

export const systemTagRemove = css({
  cursor: 'pointer',
  color: 'gray.400',
  w: '3',
  h: '3',
  _hover: {
    color: 'gray.500',
  },
});

// 入力フィールドスタイル（Pencilデザイン準拠）
export const searchInput = css({
  height: '[44px]',
  px: '3',
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

// 詳細条件トグルボタン（展開/折りたたみで異なるスタイル）- Pencilデザイン準拠
export const expandButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    px: '6',
    height: '8',
    fontSize: '[13px]',
    fontWeight: 'normal',
    border: 'none',
    borderRadius: 'full',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    expanded: {
      true: {
        color: 'primary.500',
        bg: 'green.50',
        _hover: {
          bg: 'green.100',
        },
      },
      false: {
        color: 'gray.400',
        bg: 'transparent',
        _hover: {
          color: 'gray.500',
          bg: 'gray.100',
        },
      },
    },
  },
  defaultVariants: {
    expanded: false,
  },
});

// 詳細条件トグル行
export const expandButtonRow = css({
  display: 'flex',
  justifyContent: 'center',
});

export const detailedConditions = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    transitionTimingFunction: 'ease-in-out',
  },
  variants: {
    expanded: {
      true: {
        maxHeight: '[1000px]',
        opacity: '[1]',
        overflow: 'visible',
      },
      false: {
        maxHeight: '0',
        opacity: '[0]',
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
  h: '[1px]',
  bg: 'gray.100',
  my: '4',
});

export const searchActions = css({
  display: 'flex',
  gap: '2',
});

export const rangeInput = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  color: 'gray.700',
});

export const rangeInputField = css({
  w: '20',
});

// ページスタイル
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
});

// 検索エリア（白背景、ヘッダーと一体化）
export const searchArea = css({
  bg: 'white',
});

// 検索エリア内のコンテンツ
export const searchAreaContent = css({
  maxW: '[1400px]',
  mx: 'auto',
  px: '6',
});

// 結果エリア（グラデーション背景）
export const resultsArea = css({
  flex: '1',
  py: '6',
});

// 結果エリア内のコンテンツ
export const resultsAreaContent = css({
  maxW: '[1400px]',
  mx: 'auto',
  px: '6',
});

export const pageHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '4',
});

export const pageTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.800',
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

export const sortSelect = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  height: '9',
  px: '3',
  bg: 'white',
  borderRadius: 'md',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    boxShadow: '[0 4px 16px rgba(0, 0, 0, 0.06)]',
  },
});

export const sortSelectText = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.700',
});

export const sortSelectIcon = css({
  fontSize: '[10px]',
  color: 'gray.500',
});

// 旧タブスタイル（互換性のため残す）
export const sortTabs = css({
  display: 'flex',
  gap: 'xs',
  bg: 'white',
  p: 'xs',
  borderRadius: 'lg',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
});

export const sortTabButton = cva({
  base: {
    px: '4',
    py: '2',
    fontSize: '[13px]',
    fontWeight: 'medium',
    color: 'gray.500',
    bg: 'transparent',
    border: 'none',
    borderRadius: 'md',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      color: 'primary.500',
      bg: 'green.50',
    },
  },
  variants: {
    active: {
      true: {
        color: 'primary.500',
        bg: 'green.50',
        fontWeight: 'bold',
        boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
        _hover: {
          color: 'primary.500',
          bg: 'green.50',
        },
      },
    },
  },
});
