import { css } from '@/styled-system/css';

// カラー定義（UIデザインシステム準拠、hue 150）
const colors = {
  primary: {
    50: 'oklch(0.98 0.03 150)',
    100: 'oklch(0.95 0.05 150)',
    800: 'oklch(0.40 0.15 160)',
  },
  accent: {
    coral: 'oklch(0.85 0.10 15)',
  },
  neutral: {
    50: 'oklch(0.98 0.01 150)',
    100: 'oklch(0.95 0.01 150)',
    600: 'oklch(0.45 0.05 150)',
    700: 'oklch(0.40 0.05 150)',
    800: 'oklch(0.35 0.05 150)',
  },
  error: {
    bg: 'oklch(0.95 0.05 15)',
    text: 'oklch(0.45 0.15 15)',
  },
};

// シャドウ定義
const shadows = {
  xs: '0 1px 3px rgba(0, 0, 0, 0.06)',
};

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'lg',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
});

export const label = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: colors.neutral[700],
  letterSpacing: '0.01em',
});

export const required = css({
  color: colors.accent.coral,
  ml: '1',
});

export const radioGroup = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const radioLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  cursor: 'pointer',
  fontSize: 'sm',
  color: colors.neutral[700],
  px: 'md',
  py: 'sm',
  borderRadius: '12px',
  transition: 'all {durations.normal}',
  bg: colors.neutral[50],
  boxShadow: shadows.xs,
  _hover: {
    bg: colors.primary[50],
    transform: 'translateY(-1px)',
  },
});

export const radioLabelSelected = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  cursor: 'pointer',
  fontSize: 'sm',
  color: colors.primary[800],
  px: 'md',
  py: 'sm',
  borderRadius: '12px',
  transition: 'all {durations.normal}',
  bg: colors.primary[100],
  fontWeight: 'medium',
  boxShadow: shadows.xs,
});

export const radioInput = css({
  position: 'absolute',
  opacity: 0,
  w: 0,
  h: 0,
});

export const input = css({
  w: 'full',
  px: 'md',
  py: 'sm',
  border: 'none',
  borderRadius: 'md',
  bg: 'bg.muted',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  transition: 'background-color {durations.normal}',
  boxShadow: shadows.xs,
  _hover: {
    bg: 'bg.emphasized',
  },
  _focus: {
    bg: 'bg.emphasized',
    outline: '2px solid',
    outlineColor: 'primary.focusRing',
  },
  _placeholder: {
    color: 'text.muted',
  },
});

export const textarea = css({
  w: 'full',
  px: 'md',
  py: 'sm',
  border: 'none',
  borderRadius: 'md',
  bg: 'bg.muted',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  resize: 'vertical',
  minH: '120px',
  transition: 'background-color {durations.normal}',
  boxShadow: shadows.xs,
  _hover: {
    bg: 'bg.emphasized',
  },
  _focus: {
    bg: 'bg.emphasized',
    outline: '2px solid',
    outlineColor: 'primary.focusRing',
  },
  _placeholder: {
    color: 'text.muted',
  },
});

export const hint = css({
  fontSize: 'xs',
  color: colors.neutral[600],
});

export const serverError = css({
  bg: colors.error.bg,
  color: colors.error.text,
  p: 'md',
  borderRadius: '12px',
  fontSize: 'sm',
});

export const metaInfo = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  p: 'sm',
  bg: colors.neutral[50],
  borderRadius: '8px',
  fontSize: 'xs',
  color: colors.neutral[600],
});

export const metaLabel = css({
  fontWeight: 'medium',
  color: colors.neutral[700],
});
