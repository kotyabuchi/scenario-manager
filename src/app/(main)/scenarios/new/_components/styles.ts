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
  borderRadius: '16px',
  shadow: 'card.default',
  p: '32px',
  w: 'full',
  maxW: '1200px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
});

// エラーメッセージ
export const form_error = css({
  bg: 'red.50',
  color: 'red.600',
  p: '12px 16px',
  borderRadius: '8px',
  fontSize: '14px',
});

// トップ行（画像 + フィールド群）
export const form_topRow = css({
  display: 'flex',
  gap: '32px',
  flexDirection: 'column',
  lg: {
    flexDirection: 'row',
  },
});

// 画像アップロード行
export const form_imageRow = css({
  display: 'flex',
  justifyContent: 'center',
  w: '280px',
  h: '280px',
  flexShrink: 0,
  mx: 'auto',
  lg: {
    mx: 0,
  },
});

// 画像アップロードエリア（Pencil: imageUpload - 280x280, cornerRadius:12, bg:#F9FAFB）
export const form_imageUpload = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  w: '280px',
  h: '280px',
  bg: 'gray.50',
  borderRadius: '12px',
  shadow: 'sm',
  cursor: 'pointer',
  transition: 'all 0.2s',
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
  fontSize: '13px',
  color: 'gray.500',
  textAlign: 'center',
});

// 画像アップロードヒント（Pencil: uploadHint - fontSize:12, color:#9CA3AF）
export const form_uploadHint = css({
  fontSize: '12px',
  color: 'gray.400',
});

// 右側フィールド群（Pencil: rightFields）
export const form_rightFields = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  flex: 1,
  minW: 0,
});

// フィールド行（2カラム）
export const form_fieldRow = css({
  display: 'flex',
  gap: '24px',
  flexDirection: 'column',
  sm: {
    flexDirection: 'row',
  },
  '& > *': {
    flex: 1,
    minW: 0,
  },
});

// フィールド行（2カラム、間隔狭め）
export const form_fieldRow_narrow = css({
  display: 'flex',
  gap: '20px',
  flexDirection: 'column',
  sm: {
    flexDirection: 'row',
  },
  '& > *': {
    flex: 1,
    minW: 0,
  },
});

// フィールドコンテナ（NumberInput用）
export const form_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1,
  minW: 0,
});

// ラベル（Pencil: fontSize:13, fontWeight:500, color:#374151）
export const form_label = css({
  fontSize: '13px',
  fontWeight: '500',
  color: 'gray.700',
});

// 範囲入力行（min ~ max 単位）
export const form_rangeInputRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

// 範囲セパレータ（Pencil: "〜", fontSize:14, fontWeight:500, color:#6B7280）
export const form_rangeSeparator = css({
  fontSize: '14px',
  fontWeight: '500',
  color: 'gray.500',
});

// 範囲単位（Pencil: fontSize:14, color:#6B7280）
export const form_rangeUnit = css({
  fontSize: '14px',
  color: 'gray.500',
});

// スライダーコントロール群
export const form_sliderControls = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

// スライダーの現在値表示
export const form_sliderValue = css({
  fontSize: '13px',
  fontWeight: '500',
  color: 'primary.500',
  textAlign: 'center',
});

// スライダーの最小/最大値表示
export const form_sliderMinMax = css({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: 'gray.400',
});

// チップ群
export const form_chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

// フッター（Pencil: footer - justifyContent:end, gap:16）
export const form_footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '16px',
  mt: '16px',
});
