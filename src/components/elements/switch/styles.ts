import { css } from '@/styled-system/css';

/**
 * Switchのルートスタイル
 */
export const switchRoot = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  _disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
});

/**
 * Switchのコントロールスタイル
 */
export const switchControl = css({
  position: 'relative',
  w: '44px',
  h: '24px',
  borderRadius: '12px',
  bg: '#E5E7EB',
  transition: 'all 0.15s',
  _checked: {
    bg: '#10B981',
  },
});

/**
 * Switchのサムスタイル
 */
export const switchThumb = css({
  position: 'absolute',
  top: '2px',
  left: '2px',
  w: '20px',
  h: '20px',
  borderRadius: '10px',
  bg: 'white',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
  transition: 'transform 0.15s',
  _checked: {
    transform: 'translateX(20px)',
  },
});

/**
 * Switchのラベルスタイル
 */
export const switchLabel = css({
  fontSize: '14px',
  color: '#374151',
  _disabled: {
    color: '#9CA3AF',
  },
});
