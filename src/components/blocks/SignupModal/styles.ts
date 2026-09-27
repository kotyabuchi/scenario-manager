import { css } from '@/styled-system/css';

export const backdrop = css({
  position: 'fixed',
  inset: '0',
  bg: 'overlay.dark',
  backdropFilter: '[blur(4px)]',
  zIndex: 'overlay',
});

export const positioner = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 'modal',
  p: { base: '3', md: '4' },
});

export const content = css({
  bg: 'dialog.bg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border.paper',
  borderRadius: '2xl',
  boxShadow: 'dialog.default',
  maxW: '[560px]',
  w: 'full',
  maxH: '[95dvh]',
  overflowY: 'auto',
});

export const cardBody = css({
  p: { base: '6', md: '8' },
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

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
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const stepIndicator_descText = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'primary.default',
});

export const stepIndicator_barBg = css({
  w: 'full',
  h: '1',
  borderRadius: 'full',
  bg: 'input.bg',
  overflow: 'hidden',
});

const stepIndicator_barFill = {
  h: 'full',
  borderRadius: 'full',
  transitionProperty: 'common',
  transitionDuration: 'fast',
} as const;

export const stepIndicator_barFillStep1 = css({
  ...stepIndicator_barFill,
  w: '[50%]',
  bg: 'primary.default',
});

export const stepIndicator_barFillStep2 = css({
  ...stepIndicator_barFill,
  w: 'full',
  bg: 'primary.default',
});

export const stepIndicator_barFillError = css({
  ...stepIndicator_barFill,
  w: '[50%]',
  bg: 'error.default',
});

export const avatarSlot = css({
  display: 'flex',
  justifyContent: 'center',
});

export const avatarCircle = css({
  w: '16',
  h: '16',
  borderRadius: 'full',
  bg: 'primary.subtle',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'primary.default',
});

export const titleGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const titleGroupCentered = css({
  textAlign: 'center',
});

export const title = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  color: 'text.title',
});

export const subtitle = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const stepForm = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const formGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  w: 'full',
});

export const errorText = css({
  fontSize: 'xs',
  color: 'error.default',
  mt: '1',
});

export const usernameStatusChecking = css({
  fontSize: 'xs',
  mt: '1',
  color: 'text.secondary',
});

export const usernameStatusAvailable = css({
  fontSize: 'xs',
  mt: '1',
  color: 'text.success',
});

export const fieldHint = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const charCounter = css({
  fontSize: 'xs',
  color: 'text.secondary',
  textAlign: 'right',
  mt: '1',
});

export const footerButtons = css({
  display: 'flex',
  flexDirection: 'row',
  gap: '2',
  w: 'full',
  mt: '1',
});

export const chipGroup = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

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
  bg: 'primary.subtle',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'primary.default',
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
  borderWidth: '0',
});
