import { css } from '@/styled-system/css';

/**
 * ToggleGroupルートスタイル
 */
export const toggleGroupRoot = css({
  display: 'flex',
  gap: '4px',
  padding: '4px',
  bg: '#F3F4F6',
  borderRadius: '8px',
});

/**
 * ToggleGroupアイテムスタイル
 */
export const toggleGroupItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s',
  bg: 'transparent',
  border: 'none',
  color: '#9CA3AF',
  _pressed: {
    bg: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    color: '#1F2937',
  },
  _hover: {
    color: '#6B7280',
    bg: '#E5E7EB',
  },
  _disabled: {
    color: '#D1D5DB',
    cursor: 'not-allowed',
  },
});
