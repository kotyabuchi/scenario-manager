import { css, cva } from '@/styled-system/css';

/**
 * シナリオ一覧スタイル: Pencilデザイン準拠
 */

// カラー定義（Pencilデザインから抽出）
const colors = {
  // テキスト
  text: {
    primary: '#1F2937',
    secondary: '#374151',
    tertiary: '#4B5563',
    muted: '#6B7280',
    placeholder: '#9CA3AF',
  },
  // 背景
  bg: {
    white: '#FFFFFF',
    light: '#F3F4F6',
    hover: '#F9FAFB',
  },
  // システム別カラー
  system: {
    coc7: '#10B981', // CoC7版
    sw25: '#8B5CF6', // SW2.5
    coc6: '#F59E0B', // CoC6版
    default: '#6B7280',
  },
  // アクセント
  accent: {
    green: '#10B981',
    greenLight: '#F0FDF4',
    greenLighter: '#DCFCE7',
  },
};

// シャドウ定義（Pencilデザインから抽出）
const shadows = {
  card: '0 4px 16px rgba(0, 0, 0, 0.06)', // blur 16, #0000000F
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.10)',
  small: '0 1px 2px rgba(0, 0, 0, 0.05)', // blur 2, #0000000D
  dropdown: '0 4px 16px rgba(0, 0, 0, 0.08)', // blur 16, #00000015
};

// ScenarioCard スタイル（Pencilデザイン準拠）
export const scenarioCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: colors.bg.white,
  borderRadius: '12px', // Pencil: cornerRadius 12
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all {durations.normal} cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: shadows.card,
  _hover: {
    boxShadow: shadows.cardHover,
    transform: 'translateY(-4px)',
  },
});

export const cardThumbnail = css({
  position: 'relative',
  height: '180px', // Pencil: height 180px
  bg: colors.bg.light,
  overflow: 'hidden',
});

export const cardThumbnailImage = css({
  objectFit: 'cover',
  transition: 'all {durations.normal}',
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
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', // Pencil gradient
  color: colors.text.muted,
});

export const cardThumbnailPlaceholderIcon = css({
  w: '32px',
  h: '32px',
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
  top: 0,
  left: 0,
  maxW: '70%',
  zIndex: 1,
});

// システムバッジのベーススタイル（色はcvaで制御）
export const cardSystemLabel = cva({
  base: {
    position: 'relative',
    px: '12px', // Pencil: padding [6,12]
    py: '6px',
    display: 'flex',
    alignItems: 'center',
    borderBottomRightRadius: '8px', // Pencil: cornerRadius [0,0,8,0]
  },
  variants: {
    system: {
      coc7: { bg: colors.system.coc7 },
      sw25: { bg: colors.system.sw25 },
      coc6: { bg: colors.system.coc6 },
      default: { bg: colors.system.default },
    },
  },
  defaultVariants: {
    system: 'default',
  },
});

export const cardSystemLabelText = css({
  fontSize: '11px', // Pencil: fontSize 11
  fontWeight: '600', // Pencil: fontWeight 600
  color: 'white', // Pencil: fill #FFFFFF
  truncate: true,
});

// リキッドカーブ（右側）- 色はpropsで制御するためベーススタイルのみ
export const cardSystemLabelCurveRight = css({
  position: 'absolute',
  top: 0,
  right: '-16px',
  w: '16px',
  h: '16px',
});

// リキッドカーブ（下側）- 色はpropsで制御するためベーススタイルのみ
export const cardSystemLabelCurveBottom = css({
  position: 'absolute',
  bottom: '-16px',
  left: 0,
  w: '16px',
  h: '16px',
});

// お気に入りボタン - Pencilデザイン準拠
export const cardFavoriteButton = css({
  position: 'absolute',
  top: '12px', // Pencil: y 12
  right: '12px', // Pencil: x 280 (= right 12 for 320px card)
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '28px', // Pencil: width 28
  h: '28px', // Pencil: height 28
  borderRadius: '14px', // Pencil: cornerRadius 14 = circle
  bg: 'rgba(0, 0, 0, 0.25)', // Pencil: fill #00000040
  transition: 'all {durations.fast}',
  zIndex: 1,
  _hover: {
    bg: 'rgba(0, 0, 0, 0.4)',
  },
});

export const cardFavoriteIcon = css({
  w: '16px', // Pencil: width 16
  h: '16px', // Pencil: height 16
  color: 'white', // Pencil: fill #FFFFFF
});

export const cardFavoriteIconActive = css({
  w: '16px',
  h: '16px',
  color: '#F59E0B', // アクティブ時はオレンジ
  fill: '#F59E0B',
});

export const cardFavoriteCount = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'white',
});

export const cardContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px', // Pencil: gap 12
  p: '16px', // Pencil: padding 16
  flex: 1,
});

export const cardTitle = css({
  fontSize: '16px', // Pencil: fontSize 16
  fontWeight: '600', // Pencil: fontWeight 600
  color: colors.text.primary, // Pencil: #1F2937
  lineClamp: 2,
  lineHeight: 'tight',
  textWrap: 'balance',
});

export const cardMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '16px', // Pencil: gap 16
  fontSize: '13px', // Pencil: fontSize 13
  color: colors.text.muted, // Pencil: #6B7280
});

export const cardMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px', // Pencil: gap 6
});

export const cardMetaIcon = css({
  w: '14px', // Pencil: width 14
  h: '14px', // Pencil: height 14
  color: colors.text.muted, // Pencil: #6B7280
});

export const cardTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px', // Pencil: gap 6
});

export const cardTag = css({
  display: 'inline-flex',
  alignItems: 'center',
  h: '24px', // Pencil: height 24
  px: '8px', // Pencil: padding [0,8]
  fontSize: '11px', // Pencil: fontSize 11
  fontWeight: '500', // Pencil: fontWeight 500
  bg: colors.bg.light, // Pencil: #F3F4F6
  borderRadius: '4px', // Pencil: cornerRadius 4
  color: colors.text.tertiary, // Pencil: #4B5563
});

export const cardDescription = css({
  fontSize: 'xs',
  color: colors.text.muted,
  lineClamp: 3,
  lineHeight: 'relaxed',
});

// ScenarioList スタイル
export const scenarioListContainer = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'xl', // より広めの間隔
});

// 空状態コンテナ（Pencilデザイン準拠）
export const scenarioListEmpty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  py: '2xl',
  gap: '24px', // Pencil: gap 24
});

// 空状態アイコンフレーム（80x80 円形）
export const scenarioListEmptyIconFrame = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '80px', // Pencil: width 80
  h: '80px', // Pencil: height 80
  borderRadius: '40px', // Pencil: cornerRadius 40
  bg: colors.bg.light, // Pencil: #F3F4F6
});

export const scenarioListEmptyIcon = css({
  w: '36px', // Pencil: width 36
  h: '36px', // Pencil: height 36
  color: colors.text.placeholder, // Pencil: #9CA3AF
});

export const scenarioListEmptyText = css({
  fontSize: '18px', // Pencil: fontSize 18
  fontWeight: '600', // Pencil: fontWeight 600
  color: colors.text.secondary, // Pencil: #374151
  textAlign: 'center',
});

export const scenarioListEmptySubtext = css({
  fontSize: '14px', // Pencil: fontSize 14
  fontWeight: 'normal', // Pencil: fontWeight normal
  color: colors.text.muted, // Pencil: #6B7280
  textAlign: 'center',
});

// 空状態アクションボタン群
export const scenarioListEmptyActions = css({
  display: 'flex',
  gap: '16px', // Pencil: gap 16
});

// SearchPanel スタイル（ヘッダーと一体化）
export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  px: 'xl',
  py: 'lg',
  bg: 'white',
  // ヘッダーと一体化するため、上部のborderRadiusなし、影は下方向のみ
  borderRadius: '0',
  shadow: 'subHeader.default',
});

// 検索パネルのメイン行（横並び）
export const searchPanelMainRow = css({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 'lg',
});

// システム選択フィールド
export const searchPanelSystemField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  width: '320px',
  minW: '280px',
});

// シナリオ名フィールド
export const searchPanelNameField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  flex: 1,
  minW: '200px',
});

// ボタングループ
export const searchPanelButtons = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  flexShrink: 0,
});

export const clearButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  px: 'md',
  height: '44px',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: '#374151',
  bg: 'white',
  border: 'none',
  borderRadius: 'md',
  cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  whiteSpace: 'nowrap',
  _hover: {
    bg: '#F9FAFB',
  },
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
  fontSize: '13px', // Pencil: fontSize 13
  fontWeight: '500', // Pencil: fontWeight 500
  color: colors.text.secondary, // Pencil: #374151
  letterSpacing: '0.01em',
});

export const searchPanelChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

// スライダーフィールド（固定幅280px - Pencilデザイン準拠）
export const sliderField = css({
  width: '280px',
  flexShrink: 0,
});

// タグ選択フィールド
export const tagField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  flex: 1,
  minW: '200px',
});

// 詳細条件行（プレイ人数、プレイ時間、タグを横並び）
export const detailedConditionsRow = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'lg',
});

// システム選択の入力風コンテナ
export const systemSelectContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  flexWrap: 'wrap',
  minH: '44px',
  px: 'md',
  py: 'sm',
  bg: colors.bg.light,
  borderRadius: '8px',
});

// 選択されたシステムのタグ（Pencilデザイン準拠）
export const systemTag = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px', // Pencil: gap 6
  px: '8px', // Pencil: padding [4,8]
  py: '4px',
  fontSize: '13px', // Pencil: fontSize 13
  fontWeight: 'normal', // Pencil: fontWeight normal
  bg: colors.bg.white, // Pencil: #FFFFFF
  color: colors.text.secondary, // Pencil: #374151
  borderRadius: '4px', // Pencil: cornerRadius 4
  boxShadow: shadows.small, // Pencil: blur 2, #0000000D
});

export const systemTagRemove = css({
  cursor: 'pointer',
  color: colors.text.placeholder, // Pencil: #9CA3AF
  w: '12px', // Pencil: width 12
  h: '12px', // Pencil: height 12
  _hover: {
    color: colors.text.muted,
  },
});

// 入力フィールドスタイル（Pencilデザイン準拠）
export const searchInput = css({
  height: '44px', // Pencil: height 44
  px: '12px', // Pencil: padding [0,12]
  border: 'none',
  borderRadius: '8px', // Pencil: cornerRadius 8
  bg: colors.bg.light, // Pencil: #F3F4F6
  color: colors.text.primary, // Pencil: #1F2937
  fontSize: '14px', // Pencil: fontSize 14
  outline: 'none',
  transition: 'all {durations.fast}',
  _hover: {
    bg: '#E5E7EB',
  },
  _focus: {
    bg: colors.bg.light,
    outline: '2px solid',
    outlineColor: colors.accent.green, // Pencil: #10B981
  },
  _placeholder: {
    color: colors.text.placeholder, // Pencil: #9CA3AF
  },
});

// 詳細条件トグルボタン（展開/折りたたみで異なるスタイル）- Pencilデザイン準拠
export const expandButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    px: 'lg',
    height: '32px',
    fontSize: '13px',
    fontWeight: 'normal',
    border: 'none',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all {durations.fast}',
  },
  variants: {
    expanded: {
      true: {
        color: colors.accent.green, // #10B981
        bg: colors.accent.greenLight, // #F0FDF4
        _hover: {
          bg: colors.accent.greenLighter, // #DCFCE7
        },
      },
      false: {
        color: colors.text.placeholder, // #9CA3AF
        bg: 'transparent',
        _hover: {
          color: colors.text.muted, // #6B7280
          bg: colors.bg.light,
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
    gap: 'md',
    transition: 'all {durations.normal} ease-in-out',
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
  bg: colors.bg.light,
  my: 'md',
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
  color: colors.text.secondary,
});

export const rangeInputField = css({
  w: '80px',
});

// ページスタイル
export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

// 検索エリア（白背景、ヘッダーと一体化）
export const searchArea = css({
  bg: 'white',
});

// 検索エリア内のコンテンツ
export const searchAreaContent = css({
  maxW: '1400px',
  mx: 'auto',
  px: 'lg',
});

// 結果エリア（グラデーション背景）
export const resultsArea = css({
  flex: 1,
  py: 'lg',
});

// 結果エリア内のコンテンツ
export const resultsAreaContent = css({
  maxW: '1400px',
  mx: 'auto',
  px: 'lg',
});

export const pageHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: 'md',
});

export const pageTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: colors.text.primary, // Pencil: #1F2937
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
  fontSize: '13px',
  color: colors.text.muted, // Pencil: #6B7280
});

// ソートエリア（Pencilデザイン準拠）
export const sortArea = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px', // Pencil: gap 8
});

export const sortLabel = css({
  fontSize: '13px', // Pencil: fontSize 13
  color: colors.text.muted, // Pencil: #6B7280
});

export const sortSelectWrapper = css({
  width: '140px',
});

export const loadMoreContainer = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '4',
});

export const loadMoreButton = css({
  px: '32px',
  shadow: 'header.default',
});

export const loadMoreIcon = css({
  color: 'gray.500',
});

export const sortSelect = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px', // Pencil: gap 8
  height: '36px', // Pencil: height 36
  px: '12px', // Pencil: padding [0,12]
  bg: colors.bg.white, // Pencil: #FFFFFF
  borderRadius: '6px', // Pencil: cornerRadius 6
  boxShadow: shadows.small, // Pencil: blur 2, #0000000D
  cursor: 'pointer',
  transition: 'all {durations.fast}',
  _hover: {
    boxShadow: shadows.card,
  },
});

export const sortSelectText = css({
  fontSize: '13px', // Pencil: fontSize 13
  fontWeight: '500', // Pencil: fontWeight 500
  color: colors.text.secondary, // Pencil: #374151
});

export const sortSelectIcon = css({
  fontSize: '10px', // Pencil: fontSize 10
  color: colors.text.muted, // Pencil: #6B7280
});

// 旧タブスタイル（互換性のため残す）
export const sortTabs = css({
  display: 'flex',
  gap: 'xs',
  bg: 'white',
  p: 'xs',
  borderRadius: '16px',
  boxShadow: shadows.small,
});

export const sortTabButton = cva({
  base: {
    px: 'md',
    py: 'sm',
    fontSize: '13px',
    fontWeight: '500',
    color: colors.text.muted,
    bg: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all {durations.fast}',
    _hover: {
      color: colors.accent.green,
      bg: colors.accent.greenLight,
    },
  },
  variants: {
    active: {
      true: {
        color: colors.accent.green,
        bg: colors.accent.greenLight,
        fontWeight: 'bold',
        boxShadow: shadows.small,
        _hover: {
          color: colors.accent.green,
          bg: colors.accent.greenLight,
        },
      },
    },
  },
});
