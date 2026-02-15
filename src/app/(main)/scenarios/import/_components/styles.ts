import { css } from '@/styled-system/css';

// URL入力ステップ
export const urlStep_container = css({
  bg: 'white',
  borderRadius: '2xl',
  shadow: 'card.default',
  p: '8',
  w: 'full',
  maxW: '[600px]',
  mx: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const urlStep_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
});

export const urlStep_supportedSites = css({
  fontSize: '[13px]',
  color: 'text.secondary',
});

export const urlStep_error = css({
  bg: 'red.50',
  color: 'text.error',
  py: '3',
  px: '4',
  borderRadius: 'lg',
  fontSize: 'sm',
});

// 自動解析エラーバナー
export const urlStep_autoParseError = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
  bg: 'red.50',
  color: 'text.error',
  py: '3',
  px: '4',
  borderRadius: 'lg',
  fontSize: 'sm',
  lineHeight: '[1.5]',
  outline: 'none',
});

// 自動解析ローディング
export const urlStep_loading = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3',
  py: '4',
  color: 'text.secondary',
  fontSize: 'sm',
});

// スピナーアニメーション
export const urlStep_spinner = css({
  animation: 'spin',
});

// フォームカード（Step 2）
export const form_card = css({
  bg: 'white',
  borderRadius: '2xl',
  shadow: 'card.default',
  p: '8',
  w: 'full',
  maxW: '[1200px]',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

// ソース情報バナー
export const form_sourceBanner = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  bg: 'primary.50',
  px: '4',
  py: '3',
  borderRadius: 'lg',
  fontSize: 'sm',
});

export const form_sourceLabel = css({
  color: 'primary.text',
  fontWeight: 'medium',
});

export const form_sourceLink = css({
  color: 'primary.700',
  fontSize: '[13px]',
  textDecoration: 'underline',
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  _hover: {
    color: 'primary.800',
  },
});

// セクション区切り線
export const form_divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'border.subtle',
  m: '0',
});

// セクション見出し
export const form_sectionTitle = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
});

// readOnly フィールドの視覚的区別
export const form_readonlyField = css({
  position: 'relative',
});

export const form_readonlyIcon = css({
  position: 'absolute',
  right: '3',
  top: '[50%]',
  transform: '[translateY(-50%)]',
  color: 'text.placeholder',
});

// フィールド行（2カラム）
export const form_fieldRow = css({
  display: 'flex',
  gap: '6',
  flexDirection: 'column',
  sm: {
    flexDirection: 'row',
  },
  '& > *': {
    flex: '[1]',
    minW: '0',
  },
});

// フィールド行（2カラム、間隔狭め）
export const form_fieldRow_narrow = css({
  display: 'flex',
  gap: '5',
  flexDirection: 'column',
  sm: {
    flexDirection: 'row',
  },
  '& > *': {
    flex: '[1]',
    minW: '0',
  },
});

// ラジオボタン横並び
export const form_radioRow = css({
  flexDirection: 'row',
  alignItems: 'center',
  h: '[44px]',
});

// フィールドコンテナ
export const form_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  flex: '1',
  minW: '0',
});

// ラベル
export const form_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'text.body',
});

// 範囲入力行
export const form_rangeInputRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const form_rangeSeparator = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const form_rangeUnit = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

// スライダーコントロール群
export const form_sliderControls = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const form_sliderValue = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'primary.700',
  textAlign: 'center',
});

export const form_sliderMinMax = css({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'xs',
  color: 'text.placeholder',
});

// チップ群
export const form_chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// 画像アップロード
export const form_imageSection = css({
  display: 'flex',
  gap: '8',
  flexDirection: 'column',
  lg: {
    flexDirection: 'row',
  },
});

export const form_imageArea = css({
  display: 'flex',
  justifyContent: 'center',
  w: '[280px]',
  h: '[280px]',
  flexShrink: '0',
  mx: 'auto',
  lg: {
    mx: '0',
  },
});

export const form_imageUploadWrapper = css({
  w: '[280px]',
});

export const form_imagePreview = css({
  position: 'relative',
  w: '[280px]',
  h: '[280px]',
  borderRadius: 'xl',
  overflow: 'hidden',
  shadow: 'sm',
});

export const form_previewImage = css({
  w: 'full',
  h: 'full',
  objectFit: 'cover',
});

export const form_imageRemove = css({
  position: 'absolute',
  bottom: '2',
  right: '2',
  px: '3',
  py: '1.5',
  bg: 'overlay.darkHover',
  color: 'text.white',
  fontSize: 'xs',
  fontWeight: 'medium',
  borderRadius: 'md',
  cursor: 'pointer',
  transitionProperty: '[background]',
  transitionDuration: 'normal',
  _hover: {
    bg: '[rgba(0, 0, 0, 0.8)]',
  },
});

export const form_fieldsArea = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  flex: '1',
  minW: '0',
});

// URL入力ステップのアクション行
export const urlStep_actions = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mt: '6',
});

// セクション内フィールド群
export const form_sectionFields = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  mt: '4',
});

// セクション見出し（上マージン付き）
export const form_sectionTitle_mt = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
  mt: '6',
});

// readOnly入力フィールドの背景
export const form_readonlyInput = css({
  bg: 'input.bgReadonly',
});

// 著作権注意メッセージ
export const form_notice = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
  mt: '2',
  fontSize: '[13px]',
  color: 'text.secondary',
  lineHeight: '[1.6]',
});

export const form_noticeIcon = css({
  flexShrink: '0',
  mt: '0.5',
  color: 'text.placeholder',
});

// フッター
export const form_footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '4',
  mt: '4',
});
