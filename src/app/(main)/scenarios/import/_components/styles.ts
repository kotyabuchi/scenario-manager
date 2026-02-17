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
  fontSize: 'xs',
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

// URL入力ステップのアクション行
export const urlStep_actions = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mt: '6',
});

// フォームカード（手動登録に統一: maxW 800px, レスポンシブ）
export const form_card = css({
  bg: 'white',
  borderRadius: '0',
  shadow: '[none]',
  w: 'full',
  maxW: '[800px]',
  overflow: 'hidden',
  lg: {
    borderRadius: '2xl',
    shadow: 'card.default',
  },
});

// カード内部のコンテンツエリア
export const form_body = css({
  p: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
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
  fontSize: 'xs',
  textDecoration: 'underline',
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  _hover: {
    color: 'primary.800',
  },
});

// フッター区切り線
export const form_divider = css({
  borderStyle: 'none',
  borderTopStyle: 'solid',
  borderTopWidth: '[1px]',
  borderTopColor: 'gray.200',
  m: '0',
});

// セクション見出し
export const form_sectionTitle = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
});

// インポート済み情報セクション
export const form_infoSection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

// 手動入力セクション
export const form_manualSection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
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

// readOnly入力フィールドの背景
export const form_readonlyInput = css({
  bg: 'input.bgReadonly',
});

// トップ行（画像 + 右フィールド群）
export const form_topRow = css({
  display: 'flex',
  gap: '8',
  flexDirection: 'column',
  lg: {
    flexDirection: 'row',
  },
});

// 画像セクション
export const form_imageSection = css({
  flexShrink: '0',
  alignSelf: 'center',
  lg: {
    alignSelf: 'flex-start',
  },
});

// 画像アップロードラッパー
export const form_imageUploadWrapper = css({
  w: '[280px]',
});

// 画像プレビュー
export const form_imagePreview = css({
  position: 'relative',
  w: '[280px]',
  h: '[280px]',
  borderRadius: 'xl',
  overflow: 'hidden',
  shadow: 'sm',
});

// プレビュー画像
export const form_previewImage = css({
  w: 'full',
  h: 'full',
  objectFit: 'cover',
});

// 画像削除ボタン
export const form_imageRemove = css({
  position: 'absolute',
  bottom: '2',
  right: '2',
  px: '3',
  py: '1.5',
  bg: '[rgba(0, 0, 0, 0.6)]',
  color: 'white',
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

// 右側フィールド群
export const form_rightFields = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
  flex: '1',
  minW: '0',
});

// ラジオボタン横並び
export const form_radioRow = css({
  flexDirection: 'row',
  alignItems: 'center',
  h: '[44px]',
});

// チップ群
export const form_chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// スライダーグリッド（プレイ人数 + プレイ時間の2カラム）
export const form_sliderGrid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '6',
  sm: {
    gridTemplateColumns: '1fr 1fr',
  },
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
  color: 'gray.700',
});

// スライダーコントロール群
export const form_sliderControls = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

// スライダーの現在値表示
export const form_sliderValue = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'primary.700',
  textAlign: 'center',
});

// スライダーの最小/最大値表示
export const form_sliderMinMax = css({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'xs',
  color: 'gray.400',
});

// 著作権注意メッセージ
export const form_notice = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: '[1.6]',
});

export const form_noticeIcon = css({
  flexShrink: '0',
  mt: '0.5',
  color: 'text.placeholder',
});

// フッター（キャンセル + 登録を右寄せ）
export const form_footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '4',
  px: '8',
  py: '6',
});
