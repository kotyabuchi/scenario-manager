import { css } from '@/styled-system/css';

export const pageContainer = css({
  maxW: '800px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
});

export const pageHeader = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  mb: 'xl',
});

export const pageBackButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '40px',
  h: '40px',
  borderRadius: 'full',
  bg: 'white',
  color: 'text.default',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  border: 'none',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  _hover: {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-2px)',
  },
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.default',
});
