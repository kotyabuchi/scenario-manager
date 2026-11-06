import { css, cva } from '@/styled-system/css';

/**
 * SideMenu（PCグローバルナビ）スタイル
 *
 * PC（lg以上）でのみ表示する左サイドメニュー。折りたたみ時は内容に合わせた幅になる。
 * モバイルは BottomNav / SpeedDialFAB が担うため非表示。
 */
export const sideMenu = cva({
  base: {
    display: 'none',
    lg: { display: 'flex' },
    flexDirection: 'column',
    position: 'sticky',
    top: '0',
    height: '[100dvh]',
    flexShrink: '0',
    zIndex: 'sticky',
    bg: 'sideMenu.bg',
    boxShadow: 'xl',
  },
  variants: {
    collapsed: {
      true: { width: '[max-content]' },
      // false: { width: '[240px]' },
    },
  },
  defaultVariants: { collapsed: false },
});

export const sideMenuContent = css({
  display: 'flex',
  flexDirection: 'column',
  height: 'full',
  overflowY: 'auto',
  p: '4',
  gap: '8',
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  minHeight: '11',
});

export const toggleHandle = css({
  position: 'absolute',
  top: '[50%]',
  right: '-6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '6',
  height: '28',
  bg: 'transparent',
  transform: 'translateY(-50%)',
  color: 'primary.default',
  cursor: 'pointer',
  _hover: { color: 'sideMenu.brand' },
  _focusVisible: { outline: '[2px solid]', outlineColor: 'border.focus' },
  _before: {
    content: '""',
    position: 'absolute',
    inset: '[0 auto 0 0]',
    width: '5',
    background: 'sideMenu.bg',
    clipPath:
      'path("M 0 0 C 0 18 2 25 7 31 C 15 36 20 44 20 56 C 20 68 15 76 7 81 C 2 87 0 94 0 112 Z")',
    filter: '[drop-shadow(5px 2px 5px rgb(28 51 32 / .08))]',
    transition: '[background 180ms ease]',
  },
});

export const toggleHandleIcon = css({
  position: 'relative',
  zIndex: '[1]',
  marginLeft: '-3',
});

// ロゴエリア
export const logo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2.5',
  height: '9',
  minW: '0',
  textDecoration: 'none',
});

export const logoCollapsed = css({
  justifyContent: 'center',
  mx: 'auto',
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
    justifyContent: 'flex-start',
    gap: '3',
    px: '3',
    height: '11',
    flexShrink: '0',
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

export const compactAction = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'full',
  height: '10',
  borderRadius: 'lg',
  color: 'sideMenu.inactiveItemIcon',
  cursor: 'pointer',
  _hover: { bg: 'sideMenu.itemBgHover' },
  _focusVisible: { outline: '[2px solid]', outlineColor: 'border.focus' },
});

export const compactPrimaryAction = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'full',
  height: '10',
  borderRadius: 'lg',
  color: 'button.primaryText',
  bg: 'button.primaryBg',
  cursor: 'pointer',
  _hover: { bg: 'button.primaryBgHover' },
  _focusVisible: { outline: '[2px solid]', outlineColor: 'border.focus' },
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
  lineHeight: 'normal',
  textDecoration: 'underline',
  textUnderlineOffset: '[3px]',
  _hover: { color: 'primary.text' },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[3px]',
  },
});

export const aboutPlaceholder = css({
  fontSize: 'xs',
  lineHeight: 'normal',
  visibility: 'hidden',
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
