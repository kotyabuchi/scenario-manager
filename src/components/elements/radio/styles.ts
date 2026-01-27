import { css } from '@/styled-system/css';

/**
 * RadioGroupのルートスタイル
 */
export const radioGroupRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

/**
 * RadioItemのスタイル
 */
export const radioItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  _disabled: {
    cursor: 'not-allowed',
    opacity: 'disabled',
  },
});

/**
 * RadioControlのスタイル
 */
export const radioControl = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '20px',
  h: '20px',
  borderRadius: '50%',
  bg: 'white',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
  transition: 'all {durations.fast}',
  flexShrink: 0,
  _checked: {
    bg: '#10B981',
    boxShadow: 'none',
  },
  _disabled: {
    bg: '#E5E7EB',
    boxShadow: 'none',
  },
  _focus: {
    outline: '2px solid',
    outlineColor: 'border.focus',
    outlineOffset: '2px',
  },
});

/**
 * RadioIndicatorのスタイル
 */
export const radioIndicator = css({
  w: '8px',
  h: '8px',
  borderRadius: '50%',
  bg: 'white',
});

/**
 * RadioTextのスタイル
 */
export const radioText = css({
  fontSize: '14px',
  color: '#374151',
  _disabled: {
    color: '#9CA3AF',
  },
});
