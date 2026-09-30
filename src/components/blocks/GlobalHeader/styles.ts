import { css, cva } from '@/styled-system/css';

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'full',
  height: '[56px]',
  px: '4',
  bg: 'bg.card',
  boxShadow: 'header.default',
  md: {
    height: '[64px]',
    px: '8',
  },
  lg: {
    display: 'none',
  },
});

export const logo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minW: '0',
  flexShrink: '0',
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
  bg: 'primary.subtle',
  flexShrink: '0',
});

export const logoIcon = css({
  color: 'primary.text',
});

export const logoText = css({
  fontSize: { base: 'md', md: 'lg' },
  fontWeight: 'bold',
  color: 'primary.text',
  whiteSpace: 'nowrap',
});

export const navLinks = css({
  display: 'none',
  alignItems: 'center',
  gap: '4',
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
    minH: '11',
    justifyContent: 'center',
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
        color: 'primary.text',
      },
      false: {
        fontWeight: 'medium',
        color: 'text.secondary',
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
        bg: 'primary.default',
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
  width: '11',
  height: '11',
  borderRadius: 'full',
  bg: 'primary.subtle',
  color: 'primary.text',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  height: '11',
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
    gap: '2',
    px: '3',
    minH: '11',
    fontSize: 'sm',
    fontWeight: 'semibold',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border.paper',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'normal',
  },
  variants: {
    variant: {
      login: {
        color: 'primary.text',
        bg: 'bg.card',
        _hover: {
          bg: 'primary.subtleHover',
        },
      },
      signup: {
        color: 'primary.textOnPrimary',
        bg: 'primary.default',
        _hover: {
          bg: 'primary.hover',
        },
      },
    },
  },
});
