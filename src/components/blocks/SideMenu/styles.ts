import { css, cva } from '@/styled-system/css';

/**
 * SideMenu（PCグローバルナビ）スタイル
 *
 * PC（lg以上）でのみ表示する左固定サイドメニュー。
 * モバイルは BottomNav / SpeedDialFAB が担うため非表示。
 */
export const sideMenu = css({
  display: 'none',
  lg: {
    display: 'flex',
  },
  flexDirection: 'column',
  gap: '8',
  position: 'sticky',
  top: '0',
  height: '[100dvh]',
  width: '[240px]',
  flexShrink: '0',
  overflowY: 'auto',
  bg: 'sideMenu.bg',
  px: '4',
  py: '6',
});

// ロゴエリア
export const logo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  px: '2',
  textDecoration: 'none',
});

export const logoIconFrame = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '9',
  height: '9',
  borderRadius: 'lg',
  bg: 'primary.50',
  flexShrink: '0',
});

export const logoIcon = css({
  color: 'sideMenu.brand',
});

export const logoTexts = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minW: '0',
});

export const logoTitle = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'sideMenu.brand',
  lineHeight: 'tight',
  truncate: true,
});

export const logoSubtitle = css({
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: 'tight',
  truncate: true,
});

// ナビゲーション
export const nav = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
});

export const navItem = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    px: '3',
    py: '3',
    borderRadius: 'lg',
    fontSize: 'sm',
    fontWeight: 'medium',
    textDecoration: 'none',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'border.focus',
      outlineOffset: '[-2px]',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'sideMenu.activeItemBg',
        color: 'sideMenu.activeItemText',
        fontWeight: 'semibold',
      },
      false: {
        color: 'sideMenu.inactiveItemText',
        _hover: {
          bg: 'sideMenu.itemBgHover',
        },
      },
    },
  },
});

export const navIcon = cva({
  base: {
    flexShrink: '0',
  },
  variants: {
    active: {
      true: { color: 'sideMenu.activeItemIcon' },
      false: { color: 'sideMenu.inactiveItemIcon' },
    },
  },
});

// 下部エリア（CTA + ユーザー）
export const bottom = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  mt: 'auto',
});

export const aboutLink = css({
  alignSelf: 'center',
  color: 'text.secondary',
  fontSize: 'xs',
  textDecoration: 'underline',
  textUnderlineOffset: '[3px]',
  _hover: { color: 'primary.text' },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[3px]',
  },
});

export const registerButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  width: 'full',
  height: '10',
  px: '4',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'button.primaryText',
  bg: 'button.primaryBg',
  boxShadow: 'button.primary',
  borderRadius: 'lg',
  cursor: 'pointer',
  border: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'button.primaryBgHover',
  },
});

export const userButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: 'full',
  px: '2',
  py: '2',
  borderRadius: 'lg',
  bg: 'transparent',
  cursor: 'pointer',
  border: 'none',
  textDecoration: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'sideMenu.itemBgHover',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[-2px]',
  },
});

export const avatar = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '9',
  height: '9',
  borderRadius: 'full',
  bg: 'avatar.bg',
  color: 'avatar.icon',
  overflow: 'hidden',
  flexShrink: '0',
});

export const avatarImage = css({
  width: 'full',
  height: 'full',
  objectFit: 'cover',
});

export const userName = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
  truncate: true,
});

export const loginButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  width: 'full',
  height: '10',
  px: '4',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'button.primaryText',
  bg: 'button.primaryBg',
  boxShadow: 'button.primary',
  borderRadius: 'lg',
  cursor: 'pointer',
  border: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'button.primaryBgHover',
  },
});
