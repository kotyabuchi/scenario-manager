import { css } from '@/styled-system/css';

// シャドウ定義
const shadows = {
  xs: '0 1px 3px rgba(0, 0, 0, 0.06)',
  input: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
};

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  maxW: '600px',
  mx: 'auto',
  p: '4',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontWeight: 'medium',
  color: 'text.default',
});

export const required = css({
  color: 'danger.text',
  ml: '1',
});

export const input = css({
  w: 'full',
  px: '3',
  py: '2.5',
  rounded: 'md',
  bg: 'bg.muted',
  border: '1px solid',
  borderColor: 'border.default',
  color: 'text.default',
  fontSize: 'sm',
  outline: 'none',
  transition: 'all {durations.normal}',
  boxShadow: shadows.input,
  _placeholder: {
    color: 'text.muted',
  },
  _hover: {
    borderColor: 'border.emphasized',
    bg: 'bg.emphasized',
  },
  _focus: {
    borderColor: 'primary.500',
    bg: 'bg.emphasized',
    outline: '2px solid',
    outlineColor: 'border.focus',
  },
});

export const textarea = css({
  w: 'full',
  px: '3',
  py: '2.5',
  rounded: 'md',
  bg: 'bg.muted',
  border: '1px solid',
  borderColor: 'border.default',
  color: 'text.default',
  fontSize: 'sm',
  minH: '120px',
  resize: 'vertical',
  outline: 'none',
  transition: 'all {durations.normal}',
  boxShadow: shadows.input,
  _placeholder: {
    color: 'text.muted',
  },
  _hover: {
    borderColor: 'border.emphasized',
    bg: 'bg.emphasized',
  },
  _focus: {
    borderColor: 'primary.500',
    bg: 'bg.emphasized',
    outline: '2px solid',
    outlineColor: 'border.focus',
  },
});

export const select = css({
  w: 'full',
  px: '3',
  py: '2.5',
  rounded: 'md',
  bg: 'bg.muted',
  border: '1px solid',
  borderColor: 'border.default',
  color: 'text.default',
  fontSize: 'sm',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all {durations.normal}',
  boxShadow: shadows.input,
  _hover: {
    borderColor: 'border.emphasized',
    bg: 'bg.emphasized',
  },
  _focus: {
    borderColor: 'primary.500',
    bg: 'bg.emphasized',
    outline: '2px solid',
    outlineColor: 'border.focus',
  },
});

export const checkboxField = css({
  display: 'flex',
  alignItems: 'center',
});

export const checkboxLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  color: 'text.default',
});

export const checkbox = css({
  w: '5',
  h: '5',
  cursor: 'pointer',
  accentColor: 'primary.500',
});

export const radioGroup = css({
  display: 'flex',
  gap: '4',
});

export const radioLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  color: 'text.default',
  px: '3',
  py: '2',
  rounded: 'md',
  bg: 'bg.muted',
  border: '1px solid',
  borderColor: 'border.default',
  transition: 'all 0.2s',
  boxShadow: shadows.xs,
  _hover: {
    borderColor: 'border.emphasized',
    bg: 'bg.emphasized',
  },
});

export const radio = css({
  w: '4',
  h: '4',
  cursor: 'pointer',
  accentColor: 'primary.500',
});

export const submitArea = css({
  display: 'flex',
  justifyContent: 'flex-end',
  pt: '4',
});

export const errorText = css({
  color: 'danger.text',
  fontSize: 'sm',
});
