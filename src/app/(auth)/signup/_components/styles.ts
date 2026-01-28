import { css } from '@/styled-system/css';

export const container = css({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: 'gray.50',
  px: '4',
  py: '8',
});

export const card = css({
  bg: 'white',
  borderRadius: 'xl',
  boxShadow: 'lg',
  p: '8',
  w: 'full',
  maxW: '400px',
});

export const title = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.900',
  textAlign: 'center',
  mb: '2',
});

export const subtitle = css({
  fontSize: 'sm',
  color: 'gray.500',
  textAlign: 'center',
  mb: '6',
});

export const avatarWrapper = css({
  display: 'flex',
  justifyContent: 'center',
  mb: '6',
});

export const avatar = css({
  w: '80px',
  h: '80px',
  borderRadius: 'full',
  border: '3px solid',
  borderColor: 'gray.200',
});

export const error = css({
  bg: 'red.50',
  color: 'red.700',
  p: '3',
  borderRadius: 'md',
  fontSize: 'sm',
  mb: '4',
});

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.700',
});

export const required = css({
  color: 'red.500',
  ml: '1',
});

export const input = css({
  w: 'full',
  px: '3',
  py: '2',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: 'sm',
  outline: 'none',
  transition: 'border-color {durations.normal}',
  _focus: {
    borderColor: 'primary.500',
    boxShadow: '0 0 0 1px var(--colors-primary-500)',
  },
  _placeholder: {
    color: 'gray.400',
  },
});

export const hint = css({
  fontSize: 'xs',
  color: 'gray.400',
});

export const submitButton = css({
  w: 'full',
  py: '3',
  px: '4',
  bg: 'primary.600',
  color: 'primary.foreground.white',
  borderRadius: 'lg',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background {durations.normal}',
  border: 'none',
  fontSize: 'md',
  mt: '2',
  _hover: {
    bg: 'primary.700',
  },
  _disabled: {
    bg: 'gray.400',
    cursor: 'not-allowed',
  },
});
