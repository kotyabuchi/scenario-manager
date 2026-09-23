import { cva } from '@/styled-system/css';

/**
 * SectionToc（目次）スタイル
 *
 * タブではなくアンカーリンクの一覧。縦（PC右固定向け）と横（狭幅の上部固定向け）。
 */
export const nav = cva({
  base: {
    display: 'flex',
  },
  variants: {
    orientation: {
      vertical: {
        flexDirection: 'column',
        gap: '0.5',
      },
      horizontal: {
        flexDirection: 'row',
        gap: '1',
        overflowX: 'auto',
        // スクロールバーは控えめに
        scrollbarWidth: '[thin]',
      },
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

export const item = cva({
  base: {
    position: 'relative',
    textDecoration: 'none',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.secondary',
    whiteSpace: 'nowrap',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    // 項目幅いっぱいの下線。左→右に伸びる
    _after: {
      content: '""',
      position: 'absolute',
      left: '0',
      bottom: '0',
      width: 'full',
      height: '[2px]',
      borderRadius: 'full',
      bg: 'primary.500',
      transform: 'scaleX(0)',
      transformOrigin: 'left',
      transitionProperty: '[transform]',
      transitionDuration: 'normal',
      transitionTimingFunction: 'ease-out',
    },
    // ホバー: 背景なし。文字色＋下線が左から伸びる
    _hover: {
      color: 'text.body',
      _after: { transform: 'scaleX(1)' },
    },
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'border.focus',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    orientation: {
      vertical: { display: 'block', px: '2', py: '1.5' },
      horizontal: { px: '2', py: '1.5', flexShrink: '0' },
    },
    active: {
      // 選択中: 明るめの緑文字＋下線（表示）。
      // 中間セクションの拾い過ぎは JS 側(activeId)の debounce で抑制する
      true: {
        color: 'primary.500',
        fontWeight: 'semibold',
        // 色が確定してから少し遅れて下線が伸びる（即時に出ないように）
        _after: { transform: 'scaleX(1)', transitionDelay: '[120ms]' },
        _hover: { color: 'primary.500' },
      },
      false: {},
    },
  },
  defaultVariants: { orientation: 'vertical', active: false },
});
