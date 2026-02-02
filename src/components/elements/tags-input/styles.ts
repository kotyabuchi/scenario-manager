import { css } from '@/styled-system/css';

/**
 * TagsInputコンテナスタイル
 */
export const tagsInputContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  width: 'full',
});

/**
 * ラベルスタイル
 */
export const tagsInputLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.700',
});

/**
 * 必須マーク
 */
export const tagsInputRequired = css({
  color: 'red.500',
});

/**
 * タグリストコンテナスタイル（通常）
 */
export const tagsInputList = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5',
  padding: '2',
  bg: 'gray.100',
  borderRadius: 'md',
  position: 'relative',
});

/**
 * タグリストコンテナスタイル（エラー）
 */
export const tagsInputListError = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5',
  padding: '2',
  bg: 'red.50',
  borderRadius: 'md',
  border: '[1px solid #EF4444]',
  position: 'relative',
});

/**
 * タグリストコンテナスタイル（disabled）
 */
export const tagsInputListDisabled = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5',
  padding: '2',
  bg: 'gray.200',
  borderRadius: 'md',
  position: 'relative',
});

/**
 * タグアイテムスタイル
 */
export const tagsInputItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  py: '1',
  px: '2',
  bg: 'white',
  borderRadius: 'xs',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
  fontSize: '[13px]',
  color: 'gray.700',
});

/**
 * タグ削除ボタン
 */
export const tagsInputRemoveButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'gray.400',
  _hover: { color: 'gray.500' },
});

/**
 * 入力フィールド
 */
export const tagsInputField = css({
  flex: '1',
  minWidth: '[80px]',
  bg: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '[14px]',
  color: 'gray.800',
  _placeholder: { color: 'gray.400' },
  _disabled: { cursor: 'not-allowed' },
});

/**
 * サジェストドロップダウン
 */
export const tagsInputSuggestions = css({
  position: 'absolute',
  top: '[100%]',
  left: '0',
  right: '0',
  mt: '1',
  bg: 'white',
  borderRadius: 'md',
  boxShadow: '[0 4px 16px rgba(0, 0, 0, 0.08)]',
  padding: '1',
  zIndex: '[10]',
});

/**
 * サジェストアイテム
 */
export const tagsInputSuggestionItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'full',
  height: '9',
  py: '0',
  px: '3',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'sm',
  fontSize: '[13px]',
  color: 'gray.700',
  cursor: 'pointer',
  textAlign: 'left',
  _hover: { bg: 'green.50', color: 'primary.500' },
});

/**
 * エラーメッセージ
 */
export const tagsInputError = css({
  fontSize: '[12px]',
  color: 'red.500',
});

/**
 * Disabled状態のコンテナ
 */
export const tagsInputContainerDisabled = css({
  opacity: 'disabled',
});
