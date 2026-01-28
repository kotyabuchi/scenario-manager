import { css } from '@/styled-system/css';

export const backdrop = css({
  position: 'fixed',
  inset: 0,
  bg: 'overlay.backdrop',
  backdropFilter: 'blur(4px)',
  zIndex: 9998,
});

export const positioner = css({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  p: '16px',
});

export const content = css({
  bg: 'dialog.bg',
  borderRadius: '16px',
  boxShadow: 'dialog.default',
  maxW: '480px',
  w: 'full',
  maxH: '90vh',
  overflow: 'auto',
});

export const cardBody = css({
  p: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

/* ── ステップインジケーター ── */
export const stepIndicator = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  w: 'full',
});

export const stepIndicator_labelRow = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const stepIndicator_stepText = css({
  fontSize: '12px',
  fontWeight: '500',
  color: 'text.secondary',
});

export const stepIndicator_descText = css({
  fontSize: '12px',
  fontWeight: '500',
  color: 'primary.500',
});

export const stepIndicator_barBg = css({
  w: 'full',
  h: '4px',
  borderRadius: '2px',
  bg: 'gray.200',
  overflow: 'hidden',
});

export const stepIndicator_barFillStep1 = css({
  h: 'full',
  w: '50%',
  borderRadius: '2px',
  bg: 'primary.500',
  transition: 'width {durations.fast} ease, background {durations.fast} ease',
});

export const stepIndicator_barFillStep2 = css({
  h: 'full',
  w: 'full',
  borderRadius: '2px',
  bg: 'primary.500',
  transition: 'width {durations.fast} ease, background {durations.fast} ease',
});

export const stepIndicator_barFillError = css({
  h: 'full',
  w: '50%',
  borderRadius: '2px',
  bg: 'error.default',
  transition: 'width {durations.fast} ease, background {durations.fast} ease',
});

/* ── アバター ── */
export const avatarCircle = css({
  w: '64px',
  h: '64px',
  borderRadius: 'full',
  bg: 'green.100',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'primary.400',
});

/* ── タイトルグループ ── */
export const titleGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const title = css({
  fontSize: '20px',
  fontWeight: '500',
  color: 'text.title',
});

export const subtitle = css({
  fontSize: '13px',
  color: 'text.secondary',
});

/* ── フォーム ── */
export const stepForm = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const formGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  w: 'full',
});

export const errorText = css({
  fontSize: '12px',
  color: 'error.500',
  mt: '4px',
});

export const usernameStatus = css({
  fontSize: '12px',
  mt: '4px',
});

export const usernameStatusChecking = css({
  fontSize: '12px',
  mt: '4px',
  color: 'text.secondary',
});

export const usernameStatusAvailable = css({
  fontSize: '12px',
  mt: '4px',
  color: 'success.default',
});

export const fieldHint = css({
  fontSize: '12px',
  color: 'text.secondary',
});

export const charCounter = css({
  fontSize: '12px',
  color: 'text.secondary',
  textAlign: 'right',
  mt: '4px',
});

/* ── ボタン ── */
export const primaryButton = css({
  flex: 1,
  h: '44px',
  borderRadius: '8px',
  bg: 'primary.500',
  color: 'white',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  _hover: {
    bg: 'primary.600',
  },
  _disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

export const primaryButtonFullWidth = css({
  w: 'full',
  mt: '4px',
  h: '44px',
  borderRadius: '8px',
  bg: 'primary.500',
  color: 'white',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  _hover: {
    bg: 'primary.600',
  },
  _disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

export const footerButtons = css({
  display: 'flex',
  flexDirection: 'row',
  gap: '12px',
  w: 'full',
  mt: '4px',
});

export const skipButton = css({
  flex: 1,
  h: '44px',
  borderRadius: '8px',
  bg: 'white',
  color: 'text.body',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  _hover: {
    bg: 'gray.50',
  },
});

/* ── チップ ── */
export const chipGroup = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

/* ── 完了画面 ── */
export const completionCard = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  textAlign: 'center',
  p: '48px 40px',
});

export const checkCircle = css({
  w: '64px',
  h: '64px',
  borderRadius: 'full',
  bg: 'green.100',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'primary.500',
});

export const visuallyHidden = css({
  position: 'absolute',
  w: '1px',
  h: '1px',
  p: '0',
  m: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
});
