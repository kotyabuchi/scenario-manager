import { css } from '@/styled-system/css';

/**
 * FileUpload スタイル定義 - 画面設計準拠
 */

export const fileUpload_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  w: 'full',
});

export const fileUpload_label = css({
  fontSize: '14px',
  fontWeight: '500',
  color: 'input.label',
  letterSpacing: '0.01em',
});

export const fileUpload_dropzone = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  p: '32px',
  borderRadius: '8px',
  bg: 'input.bg',
  cursor: 'pointer',
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'gray.200',
  },
  _focus: {
    outline: '2px solid',
    outlineColor: 'primary.default',
  },
  // ドラッグ中のスタイル
  '&[data-dragging]': {
    bg: 'primary.subtle',
    outline: '2px dashed',
    outlineColor: 'primary.default',
  },
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    _hover: {
      bg: 'input.bg',
    },
  },
});

export const fileUpload_icon = css({
  color: 'icon.muted',
});

export const fileUpload_text = css({
  fontSize: '14px',
  color: 'text.secondary',
  textAlign: 'center',
});

export const fileUpload_hint = css({
  fontSize: '12px',
  color: 'text.secondary',
});

export const fileUpload_itemGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const fileUpload_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  p: '8px',
  borderRadius: '8px',
  bg: 'input.bg',
});

export const fileUpload_itemPreview = css({
  w: '40px',
  h: '40px',
  borderRadius: '4px',
  overflow: 'hidden',
  flexShrink: 0,
  bg: 'gray.200',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    w: 'full',
    h: 'full',
    objectFit: 'cover',
  },
});

export const fileUpload_itemPreviewIcon = css({
  color: 'icon.muted',
});

export const fileUpload_itemInfo = css({
  flex: 1,
  minW: 0,
});

export const fileUpload_itemName = css({
  fontSize: '14px',
  color: 'text.body',
  fontWeight: '500',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const fileUpload_itemSize = css({
  fontSize: '12px',
  color: 'text.secondary',
});

export const fileUpload_itemDeleteTrigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '28px',
  h: '28px',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  borderRadius: '8px',
  flexShrink: 0,
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'error.subtle',
    color: 'error.default',
  },
});

export const fileUpload_trigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  px: '16px',
  py: '8px',
  border: 'none',
  borderRadius: '8px',
  bg: 'primary.subtle',
  color: 'primary.text',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 150ms ease-out',
  _hover: {
    opacity: 0.9,
  },
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});
