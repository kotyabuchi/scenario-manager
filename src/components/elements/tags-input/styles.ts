import { css } from '@/styled-system/css';

/**
 * TagsInputコンテナスタイル
 */
export const tagsInputContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  width: '100%',
});

/**
 * ラベルスタイル
 */
export const tagsInputLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
});

/**
 * 必須マーク
 */
export const tagsInputRequired = css({
  color: '#EF4444',
});

/**
 * タグリストコンテナスタイル（通常）
 */
export const tagsInputList = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
  padding: '8px',
  bg: '#F3F4F6',
  borderRadius: '8px',
  position: 'relative',
});

/**
 * タグリストコンテナスタイル（エラー）
 */
export const tagsInputListError = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
  padding: '8px',
  bg: '#FEF2F2',
  borderRadius: '8px',
  border: '1px solid #EF4444',
  position: 'relative',
});

/**
 * タグリストコンテナスタイル（disabled）
 */
export const tagsInputListDisabled = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
  padding: '8px',
  bg: '#E5E7EB',
  borderRadius: '8px',
  position: 'relative',
});

/**
 * タグアイテムスタイル
 */
export const tagsInputItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  bg: 'white',
  borderRadius: '4px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  fontSize: '13px',
  color: '#374151',
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
  color: '#9CA3AF',
  _hover: { color: '#6B7280' },
});

/**
 * 入力フィールド
 */
export const tagsInputField = css({
  flex: 1,
  minWidth: '80px',
  bg: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '14px',
  color: '#1F2937',
  _placeholder: { color: '#9CA3AF' },
  _disabled: { cursor: 'not-allowed' },
});

/**
 * サジェストドロップダウン
 */
export const tagsInputSuggestions = css({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  mt: '4px',
  bg: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  padding: '4px',
  zIndex: 10,
});

/**
 * サジェストアイテム
 */
export const tagsInputSuggestionItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  height: '36px',
  padding: '0 12px',
  bg: 'transparent',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#374151',
  cursor: 'pointer',
  textAlign: 'left',
  _hover: { bg: '#F0FDF4', color: '#10B981' },
});

/**
 * エラーメッセージ
 */
export const tagsInputError = css({
  fontSize: '12px',
  color: '#EF4444',
});

/**
 * Disabled状態のコンテナ
 */
export const tagsInputContainerDisabled = css({
  opacity: 'disabled',
});
