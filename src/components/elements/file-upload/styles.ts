import { css } from '@/styled-system/css';

/**
 * FileUpload スタイル定義 - 画面設計準拠
 */

export const fileUpload_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  w: 'full',
});

/** square=true 時にルートに追加するスタイル */
export const fileUpload_rootSquare = css({
  aspectRatio: 'square',
});

/** square=true 時にドロップゾーンに追加するスタイル */
export const fileUpload_dropzoneSquare = css({
  flex: '1',
  minH: '0',
});

export const fileUpload_label = css({
  fontSize: '[14px]',
  fontWeight: 'medium',
  color: 'input.label',
  letterSpacing: '[0.01em]',
});

export const fileUpload_dropzone = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  p: '8',
  borderRadius: 'xl',
  borderStyle: 'dashed',
  borderWidth: '[2px]',
  borderColor: 'gray.200',
  bg: 'input.bg',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'gray.200',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
  },
  // ドラッグ中のスタイル
  '&[data-dragging]': {
    bg: 'primary.subtle',
    outline: '[2px dashed]',
    outlineColor: 'border.focus',
  },
  _disabled: {
    opacity: 'disabled',
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
  fontSize: '[14px]',
  color: 'text.secondary',
  textAlign: 'center',
});

export const fileUpload_hint = css({
  fontSize: '[12px]',
  color: 'text.secondary',
  textAlign: 'center',
});

export const fileUpload_itemGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const fileUpload_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  p: '2',
  borderRadius: 'md',
  bg: 'input.bg',
});

export const fileUpload_itemPreview = css({
  w: '10',
  h: '10',
  borderRadius: 'xs',
  overflow: 'hidden',
  flexShrink: '0',
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
  flex: '1',
  minW: '0',
});

export const fileUpload_itemName = css({
  fontSize: '[14px]',
  color: 'text.body',
  fontWeight: 'medium',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const fileUpload_itemSize = css({
  fontSize: '[12px]',
  color: 'text.secondary',
});

export const fileUpload_itemDeleteTrigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '7',
  h: '7',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  borderRadius: 'md',
  flexShrink: '0',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'error.subtle',
    color: 'error.default',
  },
});

export const fileUpload_trigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '4',
  py: '2',
  border: 'none',
  borderRadius: 'md',
  bg: 'primary.subtle',
  color: 'primary.text',
  fontSize: '[14px]',
  fontWeight: 'medium',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    opacity: 'hover',
  },
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
  },
});
