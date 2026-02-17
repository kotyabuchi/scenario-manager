import { css } from '@/styled-system/css';

/**
 * Slider スタイル定義 - 画面設計準拠
 */

export const slider_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  w: 'full',
});

// 後方互換性のため残す（旧レイアウト用）
export const slider_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const slider_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.700',
});

export const slider_labelHidden = css({
  srOnly: true,
});

export const slider_rangeLabels = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const slider_rangeLabel = css({
  fontSize: '[12px]',
  fontWeight: 'normal',
  color: 'gray.500',
});

export const slider_valueContainer = css({
  display: 'flex',
  justifyContent: 'center',
});

export const slider_output = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'slider.valueText',
});

export const slider_control = css({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  h: '6',
  cursor: 'pointer',
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
  },
});

export const slider_track = css({
  position: 'relative',
  w: 'full',
  h: '1.5',
  borderRadius: 'full',
  bg: 'slider.track',
});

export const slider_range = css({
  position: 'absolute',
  h: 'full',
  borderRadius: 'full',
  bg: 'slider.fill',
});

export const slider_thumb = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '5',
  h: '5',
  borderRadius: 'full',
  bg: 'slider.thumb',
  boxShadow: 'slider.thumb',
  cursor: 'grab',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    transform: '[scale(1.1)]',
  },
  _active: {
    cursor: 'grabbing',
    transform: '[scale(1.15)]',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[-1px]',
  },
  _disabled: {
    cursor: 'not-allowed',
    _hover: {
      transform: 'none',
    },
  },
});

export const slider_markerGroup = css({
  position: 'relative',
  w: 'full',
  mt: '1',
});

export const slider_marker = css({
  fontSize: '[12px]',
  color: 'text.secondary',
  position: 'absolute',
  transform: '[translateX(-50%)]',
});
