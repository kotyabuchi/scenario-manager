import { css } from '@/styled-system/css';

// カレンダー全体のルート
export const calendar_root = css({
  p: '0',
  display: 'block',
  userSelect: 'none',
  width: 'full',
});

// 月グリッドのコンテナ
export const calendar_months = css({
  display: 'flex',
  flexDir: 'column',
  gap: '3',
  width: 'full',
});

// 1か月分のラッパー
// navLayout="around" では prev / caption / next / table が兄弟になるため、
// 1行目に月移動+caption、2行目にtableを配置する。
export const calendar_month = css({
  display: 'grid',
  gridTemplateColumns: '[40px_minmax(0,1fr)_40px]',
  gridTemplateRows: '[auto_auto]',
  rowGap: '2',
  columnGap: '2',
  alignItems: 'center',
  width: 'full',
});

// 月キャプション（月名 + ナビゲーション）
export const calendar_month_caption = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  py: '1',
  gridColumn: '[2]',
  gridRow: '[1]',
});

// キャプションラベル（月・年テキスト）
export const calendar_caption_label = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: '[#334155]',
  textAlign: 'center',
});

// ナビゲーションバー
export const calendar_nav = css({
  display: 'contents',
});

// ナビゲーションボタン（前月・次月）
export const calendar_navButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '9',
  h: '9',
  p: '1.5',
  rounded: 'full',
  cursor: 'pointer',
  color: '[#64748b]',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: '[#eef2f7]',
    color: '[#334155]',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: '[#10b981]',
    outlineOffset: '[2px]',
  },
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  gridRow: '[1]',
  '&[aria-label="前の月"]': {
    gridColumn: '[1]',
    justifySelf: 'start',
  },
  '&[aria-label="次の月"]': {
    gridColumn: '[3]',
    justifySelf: 'end',
  },
});

// 曜日ヘッダーの行
export const calendar_weekdays = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  mb: '2',
});

// 曜日ヘッダーのセル
export const calendar_weekday = css({
  h: '[28px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'xs',
  color: '[#64748b]',
  fontWeight: 'semibold',
  '&:nth-child(1)': {
    color: '[#ef4444]',
  },
  '&:nth-child(7)': {
    color: '[#2563eb]',
  },
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
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
});

// 月グリッド（table要素）
export const calendar_month_grid = css({
  borderCollapse: 'separate',
  borderSpacing: '0',
  width: 'full',
  tableLayout: 'fixed',
  gridColumn: '[1 / 4]',
  gridRow: '[2]',
});

// 日付セルのラッパー（td要素）
export const calendar_day = css({
  h: '[52px]',
  position: 'relative',
});

// 日付ボタン（button要素）
export const calendar_day_button = css({
  w: 'full',
  h: 'full',
  display: 'flex',
  flexDir: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '0.5',
  pt: '1',
  rounded: 'lg',
  cursor: 'pointer',
  fontSize: 'sm',
  color: '[#475569]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: '[#f1f5f9]',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: '[#10b981]',
    outlineOffset: '[2px]',
  },
});

export const calendar_dayNumber = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[30px]',
  height: '[30px]',
  rounded: 'full',
  fontSize: 'sm',
  fontWeight: 'semibold',
  lineHeight: '[1]',
  position: 'relative',
  transitionProperty: 'common',
  transitionDuration: 'fast',
});

export const calendar_markerRow = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5',
  minH: '[12px]',
});

export const calendar_markerSpacer = css({
  display: 'block',
  minH: '[12px]',
});

export const calendar_markerDot = css({
  width: '[8px]',
  height: '[8px]',
  rounded: 'full',
  borderWidth: '1px',
  borderColor: 'white',
  borderStyle: 'solid',
  boxShadow: '[0_0_0_1px_rgba(255,255,255,0.6)]',
});

export const calendar_markerOverflow = css({
  fontSize: '[9px]',
  lineHeight: '[1]',
  color: '[#64748b]',
  fontWeight: 'bold',
});

// 選択状態の日付セル
export const calendar_selected = css({
  '& button': {
    bg: 'transparent!',
  },
  '& button [data-day-number]': {
    bg: '[#10b981]',
    color: 'white',
    fontWeight: 'bold',
    boxShadow: '[0_6px_14px_-6px_rgba(16,185,129,0.8)]',
  },
});

// 今日の日付セル
export const calendar_today = css({
  '& button [data-day-number]': {
    bg: '[#e5e7eb]',
    color: '[#475569]',
    fontWeight: 'bold',
    _after: {
      content: '""',
      position: 'absolute',
      top: '[2px]',
      right: '[2px]',
      width: '[6px]',
      height: '[6px]',
      rounded: 'full',
      bg: '[#10b981]',
      boxShadow: '[0_0_0_2px_white]',
    },
  },
});

// 無効日の日付セル
export const calendar_disabled = css({
  opacity: '[0.35]',
  cursor: 'not-allowed',
  pointerEvents: 'none',
});

// 月外の日付（非表示）
export const calendar_outside = css({
  visibility: 'visible',
  '& button': {
    color: '[#cbd5e1]',
    pointerEvents: 'none',
    _hover: {
      bg: 'transparent',
    },
  },
  '& button [data-day-number]': {
    color: '[#cbd5e1]',
  },
});

// シェブロン（非表示 - ボタン内のデフォルトSVGを使わないため）
export const calendar_chevron = css({
  display: 'none',
});
