import { css, cva } from '@/styled-system/css';

// ========================================
// AppSidebar
// ========================================

export const appSidebar_container = css({
  position: 'sticky',
  top: '0',
  height: '[100dvh]',
  display: 'none',
  flexDirection: 'column',
  flexShrink: '0',
  gap: '6',
  px: '3',
  py: '4',
  bg: 'appSidebar.bg',
  shadow: 'panel.default',
  overflowY: 'auto',
  overflowX: 'hidden',
  transitionProperty: '[width]',
  transitionDuration: 'normal',
  transitionTimingFunction: 'ease-in-out',
  md: {
    display: 'flex',
  },
  '&[data-collapsed="false"]': {
    width: '[240px]',
  },
  '&[data-collapsed="true"]': {
    width: '[64px]',
  },
  '&[data-collapsed="auto"]': {
    width: '[64px]',
    lg: {
      width: '[240px]',
    },
  },
});

export const appSidebar_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
  '[data-collapsed="true"] &': {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '3',
  },
  '[data-collapsed="auto"] &': {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '3',
  },
  lg: {
    '[data-collapsed="auto"] &': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: '2',
    },
  },
});

export const appSidebar_logo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minWidth: '0',
  cursor: 'pointer',
  textDecoration: 'none',
});

export const appSidebar_logoIconFrame = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  width: '8',
  height: '8',
  borderRadius: 'md',
  bg: 'header.logoBg',
});

export const appSidebar_logoIcon = css({
  color: 'header.logo',
});

export const appSidebar_logoText = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'header.logo',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '[data-collapsed="true"] &': {
    display: 'none',
  },
  '[data-collapsed="auto"] &': {
    display: 'none',
  },
  lg: {
    '[data-collapsed="auto"] &': {
      display: 'inline',
    },
  },
});

export const appSidebar_toggleButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  width: '8',
  height: '8',
  borderRadius: 'md',
  color: 'appSidebar.navText',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'appSidebar.navHoverBg',
  },
});

export const appSidebar_nav = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  flex: '1',
});

export const appSidebar_footer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  mt: 'auto',
});

export const appSidebar_ctaButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  width: 'full',
  height: '10',
  px: '2',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'button.primaryText',
  bg: 'button.primaryBg',
  boxShadow: 'button.primary',
  borderRadius: 'lg',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: 'button.primaryBgHover',
  },
});

export const appSidebar_ctaLabel = css({
  whiteSpace: 'nowrap',
  '[data-collapsed="true"] &': {
    display: 'none',
  },
  '[data-collapsed="auto"] &': {
    display: 'none',
  },
  lg: {
    '[data-collapsed="auto"] &': {
      display: 'inline',
    },
  },
});

// ========================================
// SidebarNavItem
// ========================================

export const sidebarNavItem_link = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    height: '10',
    px: '3',
    borderRadius: 'full',
    fontSize: 'sm',
    fontWeight: 'medium',
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    '[data-collapsed="true"] &': {
      justifyContent: 'center',
      px: '0',
    },
    '[data-collapsed="auto"] &': {
      justifyContent: 'center',
      px: '0',
    },
    lg: {
      '[data-collapsed="auto"] &': {
        justifyContent: 'flex-start',
        px: '3',
      },
    },
  },
  variants: {
    active: {
      true: {
        bg: 'appSidebar.navActiveBg',
        color: 'appSidebar.navTextActive',
        fontWeight: 'semibold',
      },
      false: {
        color: 'appSidebar.navText',
        _hover: {
          bg: 'appSidebar.navHoverBg',
        },
      },
    },
  },
});

export const sidebarNavItem_icon = css({
  flexShrink: '0',
});

export const sidebarNavItem_label = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '[data-collapsed="true"] &': {
    display: 'none',
  },
  '[data-collapsed="auto"] &': {
    display: 'none',
  },
  lg: {
    '[data-collapsed="auto"] &': {
      display: 'inline',
    },
  },
});

// ========================================
// SidebarUserMenu
// ========================================

export const sidebarUserMenu_trigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  width: 'full',
  p: '1.5',
  borderRadius: 'lg',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'appSidebar.navHoverBg',
  },
  '[data-collapsed="true"] &': {
    justifyContent: 'center',
  },
  '[data-collapsed="auto"] &': {
    justifyContent: 'center',
  },
  lg: {
    '[data-collapsed="auto"] &': {
      justifyContent: 'flex-start',
    },
  },
});

export const sidebarUserMenu_avatar = css({
  display: 'flex',
  width: '9',
  height: '9',
  borderRadius: 'full',
  bg: 'avatar.placeholder',
  overflow: 'hidden',
  flexShrink: '0',
});

export const sidebarUserMenu_avatarImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});

export const sidebarUserMenu_nickname = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.700',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '[data-collapsed="true"] &': {
    display: 'none',
  },
  '[data-collapsed="auto"] &': {
    display: 'none',
  },
  lg: {
    '[data-collapsed="auto"] &': {
      display: 'inline',
    },
  },
});
