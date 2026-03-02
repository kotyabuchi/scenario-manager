import { css, cx } from '@/styled-system/css';

export { cx };

// ========================================
// リンクアイテム
// ========================================
export const linkItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  p: '3',
  borderRadius: 'lg',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'bg.input',
  },
});

export const linkItem_icon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '9',
  h: '9',
  borderRadius: 'lg',
  flexShrink: '0',
});

/** Discord: 紫系 */
export const linkItem_iconDiscord = css({
  bg: 'purple.subtle',
  color: 'purple.default',
});

/** ココフォリア: 青系 */
export const linkItem_iconCcfolia = css({
  bg: 'info.subtle',
  color: 'info.default',
});

/** その他: グレー系 */
export const linkItem_iconOther = css({
  bg: 'gray.100',
  color: 'text.secondary',
});

export const linkItem_content = css({
  flex: '1',
  minW: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
});

export const linkItem_label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
  lineHeight: 'tight',
});

export const linkItem_url = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'primary.default',
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxW: 'full',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
    borderRadius: 'sm',
  },
});

export const linkItem_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  flexShrink: '0',
});

// ========================================
// 追加ボタン
// ========================================
export const addButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1.5',
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'primary.default',
  bg: 'transparent',
  borderRadius: 'md',
  cursor: 'pointer',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'transparent',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'primary.50',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
  _disabled: {
    cursor: 'not-allowed',
    opacity: '[0.56]',
    _hover: {
      bg: 'transparent',
    },
  },
});

// ========================================
// 削除確認（インライン）
// ========================================
export const deleteConfirm = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  p: '3',
  bg: 'error.subtle',
  borderRadius: 'lg',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: 'red.200',
});

export const deleteConfirm_text = css({
  flex: '1',
  fontSize: 'xs',
  color: 'error.text',
  fontWeight: 'medium',
});

export const deleteConfirm_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  flexShrink: '0',
});

// ========================================
// リンクフォーム（Batch 2 用に先行定義）
// ========================================
export const linkForm_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
});

export const linkForm_label = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
});

export const linkForm_optionalBadge = css({
  fontSize: 'xs',
  fontWeight: 'normal',
  color: 'text.secondary',
});
