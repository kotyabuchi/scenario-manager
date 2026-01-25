import { css } from '@/styled-system/css';

/**
 * Slider スタイル定義 - 画面設計準拠
 */

export const slider_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  w: 'full',
});

export const slider_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const slider_label = css({
  fontSize: '14px',
  fontWeight: '500',
  color: 'input.label',
});

export const slider_output = css({
  fontSize: '14px',
  color: 'slider.valueText',
  fontWeight: '600',
});

export const slider_control = css({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  h: '24px',
  cursor: 'pointer',
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const slider_track = css({
  position: 'relative',
  w: 'full',
  h: '6px',
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
  w: '20px',
  h: '20px',
  borderRadius: 'full',
  bg: 'slider.thumb',
  boxShadow: 'slider.thumb',
  cursor: 'grab',
  transition: 'transform 150ms ease-out',
  _hover: {
    transform: 'scale(1.1)',
  },
  _active: {
    cursor: 'grabbing',
    transform: 'scale(1.15)',
  },
  _focus: {
    outline: '2px solid',
    outlineColor: 'primary.default',
    outlineOffset: '2px',
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
  mt: '4px',
});

export const slider_marker = css({
  fontSize: '12px',
  color: 'text.secondary',
  position: 'absolute',
  transform: 'translateX(-50%)',
});
