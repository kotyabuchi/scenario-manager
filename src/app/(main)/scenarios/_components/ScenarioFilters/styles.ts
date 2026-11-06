import { css } from '@/styled-system/css';

/**
 * ScenarioFilters（インライン検索フィルター）スタイル
 *
 * 一覧ペイン上部に置くインライン版。基本行（キーワード）を常時表示し、
 * 詳細フィルター（FilterPanel）をアコーディオンで展開する。
 */
export const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  bg: 'card.bg',
  borderRadius: '2xl',
  // 影は持たず lightGreen.border で区切る（ペイン枠の中なので影は二重にしない）
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'lightGreen.border',
  p: '4',
});

export const basicRow = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '3',
});

export const keywordWrap = css({
  position: 'relative',
  flex: '1',
  minW: '[200px]',
});

export const keywordIcon = css({
  position: 'absolute',
  left: '3',
  top: '[50%]',
  transform: 'translateY(-50%)',
  width: '4',
  height: '4',
  color: 'icon.muted',
  pointerEvents: 'none',
});

export const keywordInput = css({
  width: 'full',
  height: '[44px]',
  pl: '9',
  pr: '4',
  bg: 'input.bg',
  color: 'input.text',
  fontSize: 'sm',
  border: 'none',
  borderRadius: 'lg',
  outline: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: { bg: 'gray.200' },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
  },
  _placeholder: { color: 'input.placeholder' },
});

// 「詳細フィルター」collapsible（ボーダー＋淡い緑背景のボックス）
export const collapsible = css({
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'lightGreen.border',
  bg: 'lightGreen.bg',
  borderRadius: 'lg',
  overflow: 'hidden',
});

// Trigger は「ボタン」ではなくボックスの見出し行として見せる
export const collapsibleHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'full',
  px: '4',
  py: '3',
  bg: 'transparent',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[-2px]',
  },
});

export const collapsibleTitleGroup = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.body',
});

export const toggleBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '[20px]',
  height: '[20px]',
  px: '1.5',
  borderRadius: 'full',
  bg: 'primary.default',
  color: 'primary.textOnPrimary',
  fontSize: 'xs',
  fontWeight: 'semibold',
});

export const indicator = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'icon.default',
  transitionProperty: '[transform]',
  transitionDuration: 'fast',
  '&[data-state=open]': { transform: 'rotate(180deg)' },
});

export const detail = css({
  px: '4',
  pt: '1',
  pb: '4',
});

export const footer = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '3',
});
