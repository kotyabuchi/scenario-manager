import { css } from '@/styled-system/css';

/**
 * DatePicker スタイル定義 - 画面設計準拠
 */

export const datePicker_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  w: 'full',
});

export const datePicker_control = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  h: '44px',
  borderRadius: '8px',
  bg: 'input.bg',
  overflow: 'hidden',
  transition: 'all 150ms ease-out',
  _focusWithin: {
    outline: '2px solid',
    outlineColor: 'input.focusBorder',
  },
  _hover: {
    bg: 'gray.200',
  },
});

export const datePicker_input = css({
  w: 'full',
  px: '12px',
  py: '8px',
  border: 'none',
  bg: 'transparent',
  color: 'input.text',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  _placeholder: {
    color: 'input.placeholder',
  },
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const datePicker_trigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '8px',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  transition: 'color 150ms ease-out',
  _hover: {
    color: 'icon.default',
  },
});

export const datePicker_clearTrigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '4px',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  transition: 'color 150ms ease-out',
  _hover: {
    color: 'icon.default',
  },
});

export const datePicker_positioner = css({
  zIndex: 'dropdown',
});

export const datePicker_content = css({
  bg: 'menu.bg',
  borderRadius: '12px',
  boxShadow: 'menu.default',
  p: '16px',
  outline: 'none',
  _hidden: {
    display: 'none',
  },
});

export const datePicker_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '8px',
});

export const datePicker_navButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  border: 'none',
  bg: 'transparent',
  color: 'text.secondary',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'gray.100',
  },
  _disabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
});

export const datePicker_viewTrigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  px: '8px',
  py: '4px',
  border: 'none',
  bg: 'transparent',
  color: 'text.body',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'gray.100',
  },
});

export const datePicker_table = css({
  w: 'full',
  borderCollapse: 'separate',
  borderSpacing: '1px',
});

export const datePicker_tableHeader = css({
  fontSize: '12px',
  color: 'text.secondary',
  fontWeight: '500',
  textAlign: 'center',
  pb: '4px',
});

export const datePicker_tableCell = css({
  textAlign: 'center',
  p: '1px',
});

export const datePicker_day = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  border: 'none',
  bg: 'transparent',
  color: 'text.body',
  fontSize: '14px',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 150ms ease-out',
  position: 'relative',
  _hover: {
    bg: 'gray.100',
  },
  _selected: {
    bg: 'primary.default',
    color: 'primary.textOnPrimary',
    fontWeight: '600',
  },
  _today: {
    fontWeight: '700',
    _before: {
      content: '""',
      position: 'absolute',
      bottom: '2px',
      left: '50%',
      transform: 'translateX(-50%)',
      w: '4px',
      h: '4px',
      borderRadius: 'full',
      bg: 'primary.default',
    },
  },
  '&[data-outside-range]': {
    color: 'text.secondary',
    opacity: 0.5,
  },
  _disabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
    _hover: {
      bg: 'transparent',
    },
  },
});

export const datePicker_monthYear = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '4px',
});

export const datePicker_monthYearCell = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '16px',
  py: '8px',
  border: 'none',
  bg: 'transparent',
  color: 'text.body',
  fontSize: '14px',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'gray.100',
  },
  _selected: {
    bg: 'primary.default',
    color: 'primary.textOnPrimary',
    fontWeight: '600',
  },
  _disabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
});
