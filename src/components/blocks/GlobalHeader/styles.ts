import { css, cva } from '@/styled-system/css';

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  height: '64px',
  px: '8',
  bg: 'white',
  shadow: 'xs',
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
  width: '32px',
  height: '32px',
  borderRadius: 'md',
  bg: 'oklch(0.92 0.05 160)',
});

export const logoIcon = css({
  color: 'oklch(0.55 0.15 160)',
});

export const logoText = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'oklch(0.55 0.15 160)',
});

export const navLinks = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6',
});

export const navLink = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
    _hover: {
      opacity: 0.8,
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
        color: 'oklch(0.55 0.15 160)',
      },
      false: {
        fontWeight: 'medium',
        color: 'oklch(0.45 0.02 150)',
      },
    },
  },
});

export const navLinkLine = cva({
  base: {
    width: '100%',
    height: '2px',
    borderRadius: 'full',
    transition: 'all 0.2s',
  },
  variants: {
    active: {
      true: {
        bg: 'oklch(0.55 0.15 160)',
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
  width: '36px',
  height: '36px',
  borderRadius: 'full',
  bg: 'oklch(0.90 0.01 150)',
  overflow: 'hidden',
  cursor: 'pointer',
});

export const avatarImage = css({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const registerButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '4',
  height: '36px',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'button.primaryText',
  bg: 'button.primaryBg',
  boxShadow: 'button.primary',
  borderRadius: 'md',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textDecoration: 'none',
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
    transition: 'all 0.2s',
  },
  variants: {
    variant: {
      login: {
        color: 'oklch(0.55 0.15 160)',
        bg: 'transparent',
        _hover: {
          bg: 'oklch(0.95 0.02 150)',
        },
      },
      signup: {
        color: 'white',
        bg: 'oklch(0.55 0.15 160)',
        _hover: {
          bg: 'oklch(0.50 0.15 160)',
        },
      },
    },
  },
});
