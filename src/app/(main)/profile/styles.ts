import { css } from '@/styled-system/css';

export const container = css({
  maxW: '800px',
  mx: 'auto',
  px: '4',
  py: '8',
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: '6',
});

export const title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'gray.900',
});

export const viewProfileLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '3',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.600',
  bg: 'transparent',
  borderRadius: 'md',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  textDecoration: 'none',
  _hover: {
    bg: 'primary.50',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'primary.500',
    outlineOffset: '2px',
  },
});

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const section = css({});
