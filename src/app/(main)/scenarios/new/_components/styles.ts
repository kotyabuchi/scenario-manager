import { css } from '@/styled-system/css';

/**
 * シナリオ登録フォーム スタイル
 *
 * モック準拠: docs/designs/mocks/scenario_create_pc/screen.png
 */

// フォームカード（maxW: 800px, overflow hidden でフッターの hr がカード端まで伸びる）
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

// 画像アップロードエリア
export const form_imageUpload = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3',
  w: '[280px]',
  h: '[280px]',
  bg: 'gray.50',
  borderRadius: 'xl',
  shadow: 'sm',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: 'gray.100',
  },
});

// 画像アップロードアイコン
export const form_uploadIcon = css({
  color: 'gray.400',
});

// 画像アップロードテキスト
export const form_uploadText = css({
  fontSize: '[13px]',
  color: 'gray.500',
  textAlign: 'center',
});

// 画像アップロードヒント
export const form_uploadHint = css({
  fontSize: 'xs',
  color: 'gray.400',
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

// 画像アップロードエラー
export const form_uploadError = css({
  fontSize: 'xs',
  color: 'red.500',
  textAlign: 'center',
});

// 右側フィールド群（name → system → handout → author を縦積み）
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
  gap: '5',
});

// フル幅セクション（概要、タグ等）
export const form_section = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
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

// スライダーフィールドコンテナ
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

// URL入力ラッパー（Linkアイコン配置用）
export const form_urlInputWrapper = css({
  position: 'relative',
});

// URLアイコン（入力フィールド左端）
export const form_urlIcon = css({
  position: 'absolute',
  left: '3',
  top: '[50%]',
  transform: 'translateY(-50%)',
  color: 'gray.400',
  pointerEvents: 'none',
  zIndex: '[1]',
});

// URL入力フィールド（左パディングでアイコン分確保）
export const form_urlInput = css({
  pl: '9',
});

// チップ群
export const form_chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// インポート誘導バナー
export const form_importBanner = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  bg: 'primary.50',
  borderRadius: 'lg',
  px: '4',
  py: '3',
  overflow: 'hidden',
});

export const form_importBanner_content = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
});

export const form_importBanner_icon = css({
  color: 'primary.700',
  flexShrink: '0',
  mt: '0.5',
});

export const form_importBanner_text = css({
  color: 'primary.700',
  fontSize: 'sm',
  lineHeight: '[1.5]',
});

// フッター区切り線
export const form_divider = css({
  borderStyle: 'none',
  borderTopStyle: 'solid',
  borderTopWidth: '[1px]',
  borderTopColor: 'gray.200',
  m: '0',
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
