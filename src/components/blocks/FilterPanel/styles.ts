import { css, cva } from '@/styled-system/css';

// サイドバー（デスクトップ）
export const sidebar = css({
  display: 'flex',
  flexDirection: 'column',
  width: '[280px]',
  height: '[fit-content]',
  maxHeight: '[calc(100vh - 140px)]',
  overflowY: 'auto',
  position: 'sticky',
  top: '[140px]',
  bg: 'white',
  borderRadius: '2xl',
  padding: '5',
  gap: '6',
  shadow: 'card.default',
});

// インライン（タブレット用フィルターバー内）
export const inline = css({
  display: 'flex',
  flexDirection: 'column',
  width: 'full',
  gap: '4',
});

// ボトムシート内
export const bottomsheet = css({
  display: 'flex',
  flexDirection: 'column',
  width: 'full',
  gap: '5',
  padding: '0',
});

// フィルターパネルのvariant
export const filterPanel = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
  },
  variants: {
    variant: {
      sidebar: {
        width: '[280px]',
        height: '[fit-content]',
        maxHeight: '[calc(100vh - 140px)]',
        overflowY: 'auto',
        position: 'sticky',
        top: '[140px]',
        bg: 'white',
        borderRadius: '2xl',
        padding: '5',
        gap: '6',
        shadow: 'card.default',
      },
      inline: {
        width: 'full',
        gap: '4',
      },
      bottomsheet: {
        width: 'full',
        gap: '5',
        padding: '0',
      },
    },
  },
  defaultVariants: {
    variant: 'sidebar',
  },
});

// フィルターセクション
export const filterSection = css({
  display: 'flex',
  flexDirection: 'column',
  width: 'full',
  gap: '3',
});

export const filterSection_label = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.700',
});

export const filterSection_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

// チップコンテナ
export const chipContainer = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// 選択可能チップ
export const selectableChip = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5',
    height: '7',
    paddingX: '2.5',
    borderRadius: 'md',
    fontSize: 'xs',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'all',
    transitionDuration: 'fast',
    _hover: {
      transform: 'translateY(-1px)',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.100',
        color: 'primary.800',
      },
      false: {
        bg: 'gray.100',
        color: 'gray.600',
        _hover: {
          bg: 'gray.200',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

// チップの×アイコン
export const chipRemoveIcon = css({
  cursor: 'pointer',
  opacity: '[0.7]',
  _hover: {
    opacity: '[1]',
  },
});

// 「すべて表示」ボタン
export const showAllButton = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  paddingX: '2',
  paddingY: '1',
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'gray.500',
  bg: 'gray.100',
  borderRadius: 'sm',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.200',
    color: 'gray.600',
  },
});

// 展開エリア
export const expandableArea = cva({
  base: {
    overflow: 'hidden',
    transition: 'all',
    transitionDuration: 'normal',
  },
  variants: {
    expanded: {
      true: {
        maxHeight: '[200px]',
        overflowY: 'auto',
        opacity: '[1]',
      },
      false: {
        maxHeight: '0',
        opacity: '[0]',
      },
    },
  },
  defaultVariants: {
    expanded: false,
  },
});

// プレイ時間チップ（単一選択）
export const durationChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

// クリアボタン
export const clearButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  paddingY: '2',
  fontSize: 'sm',
  fontWeight: 'normal',
  color: 'gray.500',
  cursor: 'pointer',
  _hover: {
    color: 'gray.700',
  },
});

// スライダーコンテナ
export const sliderContainer = css({
  paddingX: '1',
});

// セパレーター（hrの代わりに視覚的区切り）
export const separator = css({
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderColor: 'gray.100',
  marginY: '2',
});
