import { css } from '@/styled-system/css';

// カレンダー全体のルート
export const calendar_root = css({
  p: '4',
  bg: 'bg.card',
  rounded: '2xl',
  shadow: 'card.default',
  display: 'inline-block',
  userSelect: 'none',
});

// 月グリッドのコンテナ
export const calendar_months = css({
  display: 'flex',
  flexDir: 'column',
  gap: '4',
});

// 1か月分のラッパー
export const calendar_month = css({
  display: 'flex',
  flexDir: 'column',
  gap: '2',
});

// 月キャプション（月名 + ナビゲーション）
export const calendar_month_caption = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '1',
  mb: '1',
});

// キャプションラベル（月・年テキスト）
export const calendar_caption_label = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.title',
});

// ナビゲーションバー
export const calendar_nav = css({
  display: 'flex',
  gap: '1',
});

// ナビゲーションボタン（前月・次月）
export const calendar_navButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  p: '1.5',
  rounded: 'md',
  cursor: 'pointer',
  color: 'text.secondary',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: 'bg.input',
    color: 'text.body',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[2px]',
  },
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
});

// 曜日ヘッダーの行
export const calendar_weekdays = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, [44px])',
  mb: '1',
});

// 曜日ヘッダーのセル
export const calendar_weekday = css({
  w: '[44px]',
  h: '[32px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
});

// 週行グループ
export const calendar_weeks = css({
  display: 'flex',
  flexDir: 'column',
  gap: '1',
});

// 週の行
export const calendar_week = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, [44px])',
});

// 月グリッド（table要素）
export const calendar_month_grid = css({
  borderCollapse: 'separate',
  borderSpacing: '0',
});

// 日付セルのラッパー（td要素）
export const calendar_day = css({
  w: '[44px]',
  h: '[44px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
});

// 日付ボタン（button要素）
export const calendar_day_button = css({
  w: '[36px]',
  h: '[36px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  rounded: 'lg',
  cursor: 'pointer',
  fontSize: 'sm',
  color: 'text.body',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'bg.input',
    color: 'text.title',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[2px]',
  },
});

// 選択状態の日付セル
export const calendar_selected = css({
  '& button': {
    bg: 'primary.subtle!',
    color: 'primary.text!',
    fontWeight: 'bold',
  },
});

// 今日の日付セル
export const calendar_today = css({
  '& button': {
    outline: '[2px solid]',
    outlineColor: 'primary.default',
    outlineOffset: '[-2px]',
  },
});

// 無効日の日付セル
export const calendar_disabled = css({
  opacity: 'disabled',
  cursor: 'not-allowed',
  pointerEvents: 'none',
});

// 月外の日付（非表示）
export const calendar_outside = css({
  visibility: 'hidden',
});

// シェブロン（非表示 - ボタン内のデフォルトSVGを使わないため）
export const calendar_chevron = css({
  display: 'none',
});
