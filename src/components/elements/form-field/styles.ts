import { css } from '@/styled-system/css';

/**
 * FormField スタイル定義 - 画面設計準拠
 */

// フィールドコンテナ
export const formField_container = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

// fieldset用のスタイル（グループ入力用）
export const formField_fieldset = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  border: 'none',
  padding: '0',
  margin: '0',
  '& > legend': {
    mb: '1',
  },
});

// ラベル共通スタイル
export const formField_label = css({
  fontSize: '[14px]',
  fontWeight: 'medium',
  color: 'input.label',
  letterSpacing: '[0.01em]',
});

// 必須マーク
export const formField_required = css({
  color: 'error.default',
  ml: '[2px]',
});

// ヒントテキスト
export const formField_hint = css({
  fontSize: '[12px]',
  color: 'text.secondary',
});
