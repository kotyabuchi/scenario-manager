import { css } from '@/styled-system/css';

/**
 * シナリオ登録フォーム スタイル
 *
 * Pencilデザイン準拠: docs/designs/scenarios.pen - Scenarios / 登録画面
 * 既存コンポーネント（FormField, Input, Select, NumberInput, Chip, Button, Textarea）を活用
 */

// フォームカード（Pencil: formCard）
export const form_card = css({
  bg: 'white',
  borderRadius: '2xl',
  shadow: 'card.default',
  p: '8',
  w: 'full',
  maxW: '[1200px]',
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
});

// エラーメッセージ
export const form_error = css({
  bg: 'red.50',
  color: 'red.600',
  py: '3',
  px: '4',
  borderRadius: 'lg',
  fontSize: '[14px]',
});

// トップ行（画像 + フィールド群）
export const form_topRow = css({
  display: 'flex',
  gap: '8',
  flexDirection: 'column',
  lg: {
    flexDirection: 'row',
  },
});

// 画像アップロード行
export const form_imageRow = css({
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

// 画像アップロードエリア（Pencil: imageUpload - 280x280, cornerRadius:12, bg:#F9FAFB）
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

// 画像アップロードアイコン（Pencil: uploadIcon - 40x40, color:#9CA3AF）
export const form_uploadIcon = css({
  color: 'gray.400',
});

// 画像アップロードテキスト（Pencil: uploadText - fontSize:13, color:#6B7280）
export const form_uploadText = css({
  fontSize: '[13px]',
  color: 'gray.500',
  textAlign: 'center',
});

// 画像アップロードヒント（Pencil: uploadHint - fontSize:12, color:#9CA3AF）
export const form_uploadHint = css({
  fontSize: '[12px]',
  color: 'gray.400',
});

// 画像アップロードラッパー
export const form_imageUploadWrapper = css({
  w: '[280px]',
  h: '[280px]',
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
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
  fontSize: '[12px]',
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
  fontSize: '[12px]',
  color: 'red.500',
  textAlign: 'center',
});

// 右側フィールド群（Pencil: rightFields）
export const form_rightFields = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  flex: '1',
  minW: '0',
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

// フィールドコンテナ（NumberInput用）
export const form_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  flex: '1',
  minW: '0',
});

// ラベル（Pencil: fontSize:13, fontWeight:500, color:#374151）
export const form_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.700',
});

// 範囲入力行（min ~ max 単位）
export const form_rangeInputRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

// 範囲セパレータ（Pencil: "〜", fontSize:14, fontWeight:500, color:#6B7280）
export const form_rangeSeparator = css({
  fontSize: '[14px]',
  fontWeight: 'medium',
  color: 'gray.500',
});

// 範囲単位（Pencil: fontSize:14, color:#6B7280）
export const form_rangeUnit = css({
  fontSize: '[14px]',
  color: 'gray.500',
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
  color: 'primary.500',
  textAlign: 'center',
});

// スライダーの最小/最大値表示
export const form_sliderMinMax = css({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '[12px]',
  color: 'gray.400',
});

// チップ群
export const form_chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// フッター（Pencil: footer - justifyContent:end, gap:16）
export const form_footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '4',
  mt: '4',
});
