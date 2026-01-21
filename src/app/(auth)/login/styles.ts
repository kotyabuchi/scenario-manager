import { css } from '@/styled-system/css';

export const container = css({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: 'gray.50',
  px: '4',
});

export const card = css({
  bg: 'white',
  borderRadius: 'xl',
  boxShadow: 'lg',
  p: '8',
  w: 'full',
  maxW: '400px',
  textAlign: 'center',
});

export const title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '2',
});

export const subtitle = css({
  fontSize: 'sm',
  color: 'gray.500',
  mb: '8',
});

export const error = css({
  bg: 'red.50',
  color: 'red.700',
  p: '3',
  borderRadius: 'md',
  fontSize: 'sm',
  mb: '4',
});

export const loading = css({
  color: 'gray.400',
  fontSize: 'sm',
  py: '4',
});

export const discordButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3',
  w: 'full',
  py: '3',
  px: '4',
  bg: 'discord.default',
  color: 'primary.foreground.white',
  borderRadius: 'lg',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background {durations.normal}',
  border: 'none',
  fontSize: 'md',
  _hover: {
    bg: 'discord.hover',
  },
});

export const note = css({
  fontSize: 'xs',
  color: 'gray.400',
  mt: '6',
});
