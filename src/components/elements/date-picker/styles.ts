import { css } from '@/styled-system/css';

/**
 * DatePicker スタイル定義 - 画面設計準拠
 */

export const datePicker_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  w: 'full',
});

export const datePicker_control = css({
  display: 'flex',
  alignItems: 'center',
  h: '[44px]',
  borderRadius: '[2]',
  bg: 'input.bg',
  overflow: 'hidden',
  transitionProperty: 'background',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _focusWithin: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
  },
  _hover: {
    bg: 'gray.200',
  },
});

export const datePicker_input = css({
  w: 'full',
  pl: '3',
  py: '2',
  border: 'none',
  bg: 'transparent',
  color: 'input.text',
  fontSize: '[14px]',
  fontFamily: '[Inter, sans-serif]',
  outline: 'none',
  _placeholder: {
    color: 'input.placeholder',
  },
  _disabled: {
    opacity: '[disabled]',
    cursor: 'not-allowed',
  },
});

export const datePicker_trigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: '2',
  border: 'none',
  borderRadius: '[1]',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  transitionProperty: 'colors',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  outline: 'none',
  _focusWithin: {
    color: 'border.focus',
  },
  _hover: {
    color: 'icon.default',
  },
});

export const datePicker_clearTrigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '1',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  transitionProperty: 'colors',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    color: 'icon.default',
  },
});

export const datePicker_positioner = css({
  zIndex: 'dropdown',
});

export const datePicker_content = css({
  bg: 'menu.bg',
  borderRadius: '[3]',
  boxShadow: 'menu.default',
  p: '4',
  outline: 'none',
  _hidden: {
    display: 'none',
  },
});

export const datePicker_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '2',
});

export const datePicker_navButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  border: 'none',
  bg: 'transparent',
  color: 'text.secondary',
  cursor: 'pointer',
  borderRadius: '[2]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'gray.100',
  },
  _disabled: {
    opacity: '[muted]',
    cursor: 'not-allowed',
  },
});

export const datePicker_viewTrigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '1',
  border: 'none',
  bg: 'transparent',
  color: 'text.body',
  fontSize: '[14px]',
  fontWeight: 'semibold',
  cursor: 'pointer',
  borderRadius: '[2]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'gray.100',
  },
});

export const datePicker_table = css({
  w: 'full',
  borderCollapse: 'separate',
  borderSpacing: '[1px]',
});

export const datePicker_tableHeader = css({
  fontSize: '[12px]',
  color: 'text.secondary',
  fontWeight: 'medium',
  textAlign: 'center',
  pb: '1',
  '&[data-holiday-type="sunday"]': {
    color: 'error.default',
  },
  '&[data-holiday-type="saturday"]': {
    color: 'info.default',
  },
});

export const datePicker_tableCell = css({
  textAlign: 'center',
  p: '[1px]',
});

export const datePicker_day = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  border: 'none',
  bg: 'transparent',
  color: 'text.body',
  fontSize: '[14px]',
  cursor: 'pointer',
  borderRadius: '[2]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  position: 'relative',
  _hover: {
    bg: 'gray.100',
  },
  _selected: {
    bg: 'primary.default',
    color: 'primary.textOnPrimary',
    fontWeight: 'semibold',
  },
  _today: {
    fontWeight: 'bold',
    _before: {
      content: '""',
      position: 'absolute',
      bottom: '[2px]',
      left: '[50%]',
      transform: '[translateX(-50%)]',
      w: '1',
      h: '1',
      borderRadius: 'full',
      bg: 'primary.default',
    },
  },
  '&[data-in-range]&:not([data-selected])': {
    bg: 'primary.subtle',
    color: 'primary.text',
    fontWeight: 'semibold',
  },
  '&[data-outside-range]': {
    color: 'text.secondary',
    opacity: '[disabled]',
  },
  '&[data-holiday-type="sunday"]&:not([data-selected])&:not([data-in-range])': {
    color: 'error.default',
  },
  '&[data-holiday-type="saturday"]&:not([data-selected])&:not([data-in-range])':
    {
      color: 'info.default',
    },
  _disabled: {
    opacity: '[muted]',
    cursor: 'not-allowed',
    _hover: {
      bg: 'transparent',
    },
  },
});

export const datePicker_monthYear = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(3, 1fr)]',
  gap: '1',
});

export const datePicker_monthYearCell = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '4',
  py: '2',
  border: 'none',
  bg: 'transparent',
  color: 'text.body',
  fontSize: '[14px]',
  cursor: 'pointer',
  borderRadius: '[2]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'gray.100',
  },
  _selected: {
    bg: 'primary.default',
    color: 'primary.textOnPrimary',
    fontWeight: 'semibold',
  },
  _disabled: {
    opacity: '[muted]',
    cursor: 'not-allowed',
  },
});
