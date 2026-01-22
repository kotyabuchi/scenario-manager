import { css } from '@/styled-system/css';

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
  px: '3',
  py: '2',
  rounded: 'md',
  bg: 'surface.input',
  border: 'none',
  outline: 'none',
  color: 'text.default',
  _placeholder: {
    color: 'text.placeholder',
  },
  _focus: {
    ring: '2',
    ringColor: 'primary.500',
  },
});

export const textarea = css({
  px: '3',
  py: '2',
  rounded: 'md',
  bg: 'surface.input',
  border: 'none',
  outline: 'none',
  color: 'text.default',
  minH: '120px',
  resize: 'vertical',
  _placeholder: {
    color: 'text.placeholder',
  },
  _focus: {
    ring: '2',
    ringColor: 'primary.500',
  },
});

export const select = css({
  px: '3',
  py: '2',
  rounded: 'md',
  bg: 'surface.input',
  border: 'none',
  outline: 'none',
  color: 'text.default',
  cursor: 'pointer',
  _focus: {
    ring: '2',
    ringColor: 'primary.500',
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
  w: '4',
  h: '4',
  cursor: 'pointer',
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
});

export const radio = css({
  w: '4',
  h: '4',
  cursor: 'pointer',
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
