import { defineTokens } from '@pandacss/dev';

export const colors = defineTokens.colors({
  // ========================================
  // 画面設計準拠カラーパレット
  // ========================================

  // White
  white: { value: '#FFFFFF' },

  // Gray Scale (Tailwind Gray)
  gray: {
    50: { value: '#F9FAFB' },
    100: { value: '#F3F4F6' },
    200: { value: '#E5E7EB' },
    300: { value: '#D1D5DB' },
    400: { value: '#9CA3AF' },
    500: { value: '#6B7280' },
    600: { value: '#4B5563' },
    700: { value: '#374151' },
    800: { value: '#1F2937' },
    900: { value: '#111827' },
  },

  // Primary: Emerald (緑)
  primary: {
    50: { value: '#ECFDF5' },
    100: { value: '#D1FAE5' },
    200: { value: '#A7F3D0' },
    300: { value: '#6EE7B7' },
    400: { value: '#34D399' },
    500: { value: '#10B981' },
    600: { value: '#059669' },
    700: { value: '#047857' },
    800: { value: '#065F46' },
    900: { value: '#064E3B' },
  },

  // Purple (システムバッジ用)
  purple: {
    50: { value: '#F5F3FF' },
    100: { value: '#EDE9FE' },
    200: { value: '#DDD6FE' },
    300: { value: '#C4B5FD' },
    400: { value: '#A78BFA' },
    500: { value: '#8B5CF6' },
    600: { value: '#7C3AED' },
    700: { value: '#6D28D9' },
    800: { value: '#5B21B6' },
    900: { value: '#4C1D95' },
  },

  // Indigo (ランディングページ Feature用)
  indigo: {
    50: { value: '#EEF2FF' },
    100: { value: '#E0E7FF' },
    200: { value: '#C7D2FE' },
    300: { value: '#A5B4FC' },
    400: { value: '#818CF8' },
    500: { value: '#6366F1' },
    600: { value: '#4F46E5' },
    700: { value: '#4338CA' },
    800: { value: '#3730A3' },
    900: { value: '#312E81' },
  },

  // Pink (ランディングページ システムバッジ用)
  pink: {
    50: { value: '#FCE7F3' },
    100: { value: '#FBCFE8' },
    200: { value: '#F9A8D4' },
    500: { value: '#EC4899' },
    700: { value: '#BE185D' },
  },

  // Green (ランディングページ システムバッジ用)
  green: {
    50: { value: '#DCFCE7' },
    700: { value: '#166534' },
    800: { value: '#166534' },
  },

  // Blue (ランディングページ システムバッジ用)
  blue: {
    50: { value: '#DBEAFE' },
    800: { value: '#1E40AF' },
  },

  // Orange/Amber (警告、お気に入り)
  orange: {
    50: { value: '#FFFBEB' },
    100: { value: '#FEF3C7' },
    200: { value: '#FDE68A' },
    300: { value: '#FCD34D' },
    400: { value: '#FBBF24' },
    500: { value: '#F59E0B' },
    600: { value: '#D97706' },
    700: { value: '#B45309' },
    800: { value: '#92400E' },
    900: { value: '#78350F' },
  },

  // Red (エラー、削除)
  red: {
    50: { value: '#FEF2F2' },
    100: { value: '#FEE2E2' },
    200: { value: '#FECACA' },
    300: { value: '#FCA5A5' },
    400: { value: '#F87171' },
    500: { value: '#EF4444' },
    600: { value: '#DC2626' },
    700: { value: '#B91C1C' },
    800: { value: '#991B1B' },
    900: { value: '#7F1D1D' },
  },

  // Overlay colors
  overlay: {
    5: { value: 'rgba(0, 0, 0, 0.05)' },
    10: { value: 'rgba(0, 0, 0, 0.10)' },
    15: { value: 'rgba(0, 0, 0, 0.15)' },
    20: { value: 'rgba(0, 0, 0, 0.20)' },
    25: { value: 'rgba(0, 0, 0, 0.25)' },
    30: { value: 'rgba(0, 0, 0, 0.30)' },
    40: { value: 'rgba(0, 0, 0, 0.40)' },
    60: { value: 'rgba(0, 0, 0, 0.60)' },
  },

  // Primary shadow colors
  primaryShadow: {
    25: { value: 'rgba(16, 185, 129, 0.25)' },
  },

  // Red shadow colors
  redShadow: {
    25: { value: 'rgba(239, 68, 68, 0.25)' },
  },
});
