import { css } from '@/styled-system/css';

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'full',
  height: '[56px]',
  px: '4',
  bg: 'header.bg',
  shadow: 'xs',
  md: {
    display: 'none',
  },
});

export const logo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  textDecoration: 'none',
});

export const logoIconFrame = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8',
  height: '8',
  borderRadius: 'md',
  bg: 'header.logoBg',
});

export const logoIcon = css({
  color: 'header.logo',
});

export const logoText = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'header.logo',
});

export const userArea = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const avatar = css({
  width: '9',
  height: '9',
  borderRadius: 'full',
  bg: 'avatar.placeholder',
  overflow: 'hidden',
  cursor: 'pointer',
});

export const avatarImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});

export const loginButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  py: '1.5',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'header.textActive',
  bg: 'transparent',
  borderRadius: 'md',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: 'gray.100',
  },
});
