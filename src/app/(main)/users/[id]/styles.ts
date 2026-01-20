import { css } from '@/styled-system/css';

export const container = css({
  maxW: '800px',
  mx: 'auto',
  px: '4',
  py: '8',
});

export const title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '6',
});

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const section = css({});

export const sectionTitle = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '4',
});

export const emptyMessage = css({
  color: 'gray.500',
  fontSize: 'sm',
  textAlign: 'center',
  py: '8',
});

export const notFound = css({
  textAlign: 'center',
  py: '16',
});

export const notFoundTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '2',
});

export const notFoundMessage = css({
  color: 'gray.500',
  fontSize: 'sm',
});
