import { css } from '@/styled-system/css';

/**
 * シナリオ登録フォーム スタイル: nani.now風（淡い緑ベース）
 *
 * UIデザインシステム準拠:
 * - ボーダーレス（境界線は影で表現）
 * - OKLCH カラー（hue 150 のアンダートーン）
 * - 角丸: 16px（カード/パネル）、8px（入力フィールド）
 */

// カラー定義（淡い緑ベース）
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
  success: {
    bg: 'oklch(0.95 0.05 150)',
    text: 'oklch(0.35 0.10 150)',
  },
  error: {
    bg: 'oklch(0.95 0.05 15)',
    text: 'oklch(0.45 0.15 15)',
  },
};

// シャドウ定義
const shadows = {
  xs: '0 1px 3px rgba(0, 0, 0, 0.06)',
  sm: '0 4px 6px rgba(0, 0, 0, 0.08)',
};

// フォームコンテナ
export const form_container = css({
  bg: 'white',
  borderRadius: '16px',
  boxShadow: shadows.sm,
  p: 'xl',
  maxW: '800px',
  mx: 'auto',
});

export const form_title = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: colors.neutral[800],
  mb: 'lg',
});

export const form_error = css({
  bg: colors.error.bg,
  color: colors.error.text,
  p: 'md',
  borderRadius: '12px',
  fontSize: 'sm',
  mb: 'lg',
});

export const form_success = css({
  bg: colors.success.bg,
  color: colors.success.text,
  p: 'md',
  borderRadius: '12px',
  fontSize: 'sm',
  mb: 'lg',
});

export const form_form = css({
  display: 'flex',
  flexDirection: 'column',
});

export const form_section = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'lg',
});

export const form_sectionTitle = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  color: colors.neutral[800],
  mb: 'sm',
});

export const form_divider = css({
  border: 'none',
  h: '1px',
  bg: colors.neutral[100],
  my: 'xl',
});

export const form_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  border: 'none',
  padding: 0,
  margin: 0,
  '& > legend': {
    mb: 'xs',
  },
});

export const form_fieldInline = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  md: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 'md',
  },
});

export const form_label = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: colors.neutral[700],
  letterSpacing: '0.01em',
});

export const form_required = css({
  color: colors.accent.coral,
  ml: '1',
});

export const form_input = css({
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

export const form_textarea = css({
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

export const form_hint = css({
  fontSize: 'xs',
  color: colors.neutral[600],
});

export const form_chips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const form_rangeInput = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  fontSize: 'sm',
  color: colors.neutral[700],
});

export const form_rangeInputField = css({
  w: '100px',
});

export const form_radioGroup = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'md',
});

export const form_radioLabel = css({
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

export const form_radioLabelSelected = css({
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

export const form_radioInput = css({
  w: '16px',
  h: '16px',
  accentColor: colors.primary[800],
});

export const form_actions = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'md',
});
