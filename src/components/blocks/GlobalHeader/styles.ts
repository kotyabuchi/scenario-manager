import { css, cva } from '@/styled-system/css';

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'full',
  height: '[56px]',
  px: '4',
  bg: 'white',
  shadow: 'xs',
  md: {
    height: '[64px]',
    px: '8',
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
  bg: '[oklch(0.94 0.045 163)]',
});

export const logoIcon = css({
  color: '[oklch(0.59 0.13 163)]',
});

export const logoText = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: '[oklch(0.59 0.13 163)]',
});

export const navLinks = css({
  display: 'none',
  alignItems: 'center',
  gap: '6',
  md: {
    display: 'flex',
  },
});

export const navLink = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1',
    cursor: 'pointer',
    textDecoration: 'none',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    _hover: {
      opacity: 'hover',
    },
  },
  variants: {
    active: {
      true: {},
      false: {},
    },
  },
});

export const navLinkText = cva({
  base: {
    fontSize: 'sm',
  },
  variants: {
    active: {
      true: {
        fontWeight: 'semibold',
        color: '[oklch(0.59 0.13 163)]',
      },
      false: {
        fontWeight: 'medium',
        color: '[oklch(0.45 0.02 150)]',
      },
    },
  },
});

export const navLinkLine = cva({
  base: {
    width: 'full',
    height: '[2px]',
    borderRadius: 'full',
    transitionProperty: 'common',
    transitionDuration: 'normal',
  },
  variants: {
    active: {
      true: {
        bg: '[oklch(0.59 0.13 163)]',
      },
      false: {
        bg: 'transparent',
      },
    },
  },
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
  bg: '[oklch(0.90 0.01 150)]',
  overflow: 'hidden',
  cursor: 'pointer',
});

export const avatarImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});

export const registerButton = css({
  display: 'none',
  alignItems: 'center',
  md: {
    display: 'flex',
  },
  gap: '2',
  px: '4',
  height: '9',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'button.primaryText',
  bg: 'button.primaryBg',
  boxShadow: 'button.primary',
  borderRadius: 'md',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  textDecoration: 'none',
  border: 'none',
  _hover: {
    bg: 'button.primaryBgHover',
  },
});

export const authButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    px: '3',
    py: '1.5',
    fontSize: 'sm',
    fontWeight: 'medium',
    borderRadius: 'md',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'normal',
  },
  variants: {
    variant: {
      login: {
        color: '[oklch(0.59 0.13 163)]',
        bg: 'transparent',
        _hover: {
          bg: '[oklch(0.95 0.02 150)]',
        },
      },
      signup: {
        color: 'white',
        bg: '[oklch(0.59 0.13 163)]',
        _hover: {
          bg: '[oklch(0.50 0.105 163)]',
        },
      },
    },
  },
});
