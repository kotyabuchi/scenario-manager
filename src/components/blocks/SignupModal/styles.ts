import { css } from '@/styled-system/css';

export const backdrop = css({
  position: 'fixed',
  inset: '0',
  bg: '[overlay.backdrop]',
  backdropFilter: '[blur(4px)]',
  zIndex: '[9998]',
});

export const positioner = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '[9999]',
  p: '4',
});

export const content = css({
  bg: '[dialog.bg]',
  borderRadius: '[4]',
  boxShadow: '[dialog.default]',
  maxW: '[480px]',
  w: 'full',
  maxH: '[90vh]',
  overflow: 'auto',
});

export const cardBody = css({
  p: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

/* ── ステップインジケーター ── */
export const stepIndicator = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  w: 'full',
});

export const stepIndicator_labelRow = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const stepIndicator_stepText = css({
  fontSize: '[12px]',
  fontWeight: 'medium',
  color: '[text.secondary]',
});

export const stepIndicator_descText = css({
  fontSize: '[12px]',
  fontWeight: 'medium',
  color: '[primary.500]',
});

export const stepIndicator_barBg = css({
  w: 'full',
  h: '1',
  borderRadius: 'xs',
  bg: '[gray.200]',
  overflow: 'hidden',
});

export const stepIndicator_barFillStep1 = css({
  h: 'full',
  w: '[50%]',
  borderRadius: 'xs',
  bg: '[primary.500]',
  transitionProperty: '[width, background]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-in-out',
});

export const stepIndicator_barFillStep2 = css({
  h: 'full',
  w: 'full',
  borderRadius: 'xs',
  bg: '[primary.500]',
  transitionProperty: '[width, background]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-in-out',
});

export const stepIndicator_barFillError = css({
  h: 'full',
  w: '[50%]',
  borderRadius: 'xs',
  bg: '[error.default]',
  transitionProperty: '[width, background]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-in-out',
});

/* ── アバター ── */
export const avatarCircle = css({
  w: '16',
  h: '16',
  borderRadius: 'full',
  bg: '[green.100]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '[primary.400]',
});

/* ── タイトルグループ ── */
export const titleGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const title = css({
  fontSize: '[20px]',
  fontWeight: 'medium',
  color: '[text.title]',
});

export const subtitle = css({
  fontSize: '[13px]',
  color: '[text.secondary]',
});

/* ── フォーム ── */
export const stepForm = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const formGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  w: 'full',
});

export const errorText = css({
  fontSize: '[12px]',
  color: '[error.500]',
  mt: '1',
});

export const usernameStatus = css({
  fontSize: '[12px]',
  mt: '1',
});

export const usernameStatusChecking = css({
  fontSize: '[12px]',
  mt: '1',
  color: '[text.secondary]',
});

export const usernameStatusAvailable = css({
  fontSize: '[12px]',
  mt: '1',
  color: '[success.default]',
});

export const fieldHint = css({
  fontSize: '[12px]',
  color: '[text.secondary]',
});

export const charCounter = css({
  fontSize: '[12px]',
  color: '[text.secondary]',
  textAlign: 'right',
  mt: '1',
});

/* ── ボタン ── */
export const primaryButton = css({
  flex: '1',
  h: '[44px]',
  borderRadius: '[2]',
  bg: '[primary.500]',
  color: 'white',
  fontSize: '[14px]',
  fontWeight: 'semibold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  boxShadow: '[0 2px 4px rgba(16, 185, 129, 0.25)]',
  _hover: {
    bg: '[primary.600]',
  },
  _disabled: {
    opacity: '[0.6]',
    cursor: 'not-allowed',
  },
});

export const primaryButtonFullWidth = css({
  w: 'full',
  mt: '1',
  h: '[44px]',
  borderRadius: '[2]',
  bg: '[primary.500]',
  color: 'white',
  fontSize: '[14px]',
  fontWeight: 'semibold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  boxShadow: '[0 2px 4px rgba(16, 185, 129, 0.25)]',
  _hover: {
    bg: '[primary.600]',
  },
  _disabled: {
    opacity: '[0.6]',
    cursor: 'not-allowed',
  },
});

export const footerButtons = css({
  display: 'flex',
  flexDirection: 'row',
  gap: '3',
  w: 'full',
  mt: '1',
});

export const skipButton = css({
  flex: '1',
  h: '[44px]',
  borderRadius: '[2]',
  bg: 'white',
  color: '[text.body]',
  fontSize: '[14px]',
  fontWeight: 'medium',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '[0 1px 3px rgba(0, 0, 0, 0.1)]',
  _hover: {
    bg: '[gray.50]',
  },
});

/* ── チップ ── */
export const chipGroup = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

/* ── 完了画面 ── */
export const completionCard = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6',
  textAlign: 'center',
  py: '12',
  px: '10',
});

export const checkCircle = css({
  w: '16',
  h: '16',
  borderRadius: 'full',
  bg: '[green.100]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '[primary.500]',
});

export const visuallyHidden = css({
  position: 'absolute',
  w: '[1px]',
  h: '[1px]',
  p: '0',
  m: '[-1px]',
  overflow: 'hidden',
  clip: '[rect(0, 0, 0, 0)]',
  whiteSpace: 'nowrap',
  border: '[0]',
});
