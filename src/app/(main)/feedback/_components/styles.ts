import { css, cva } from '@/styled-system/css';

import type { SystemStyleObject } from '@/styled-system/types';

// ===== FeedbackContent =====

export const contentHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  p: '6',
});

export const categoryChips = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '3',
});

export const chipDivider = css({
  h: '6',
  w: '[1px]',
  bg: 'gray.300',
  mx: '1',
  flexShrink: '0',
});

export const categoryChip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    py: '2',
    px: '6',
    fontSize: 'sm',
    fontWeight: 'medium',
    borderRadius: 'full',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'primary.500',
    },
  },
  variants: {
    isActive: {
      true: {
        bg: 'primary.100',
        color: 'primary.900',
        fontWeight: 'semibold',
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
    isActive: false,
  },
});

export const searchInputWrapper = css({
  position: 'relative',
  w: 'full',
});

export const filterControlRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

export const searchIcon = css({
  position: 'absolute',
  left: '3',
  top: '[50%]',
  transform: 'translateY(-50%)',
  color: 'gray.400',
  pointerEvents: 'none',
});

/** 共通 Input コンポーネントの css prop オーバーライド */
export const searchInputOverrides = {
  pl: '10',
  borderRadius: 'lg',
} satisfies SystemStyleObject;

export const sortSelectWrapper = css({
  width: '[160px]',
  flexShrink: '0',
});

export const fetchError = css({
  fontSize: 'sm',
  color: 'red.600',
  bg: 'red.50',
  borderRadius: 'lg',
  px: '4',
  py: '3',
  mb: '4',
});

export const resultsArea = css({
  flex: '1',
  position: 'relative',
  px: '6',
  pb: '6',
});

export const resultCount = css({
  fontSize: '[13px]',
  color: 'gray.600',
  mb: '4',
});

export const loadMoreContainer = css({
  pt: '4',
});

export const loadMoreButton = css({
  w: 'full',
  justifyContent: 'center',
});

export const loadMoreIcon = css({
  color: 'gray.500',
});

// ===== FeedbackList =====

export const listContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const listEmpty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1',
  py: '2xl',
  gap: '6',
});

export const listEmptyIconFrame = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '20',
  h: '20',
});

export const listEmptyIcon = css({
  w: '9',
  h: '9',
  color: 'gray.400',
});

export const listEmptyText = css({
  fontSize: '[18px]',
  fontWeight: 'semibold',
  color: 'gray.700',
  textAlign: 'center',
});

export const listEmptySubtext = css({
  fontSize: 'sm',
  fontWeight: 'normal',
  color: 'gray.600',
  textAlign: 'center',
});

export const listEmptyActions = css({
  display: 'flex',
  gap: '4',
});

// ===== FeedbackCard =====

export const card = css({
  display: 'flex',
  flexDirection: 'row',
  gap: '5',
  bg: 'white',
  borderRadius: '2xl',
  p: '5',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  transitionTimingFunction: '[cubic-bezier(0.4, 0, 0.2, 1)]',
  shadow: 'card.default',
  textDecoration: 'none',
  color: '[inherit]',
  _hover: {
    shadow: 'card.hover',
  },
});

export const card_body = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minW: '0',
});

export const card_titleRow = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '4',
  mb: '2',
});

export const card_titleLeft = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

export const card_title = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.800',
  lineClamp: 1,
});

export const card_categoryBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '2.5',
    py: '0.5',
    fontSize: 'xs',
    fontWeight: 'medium',
    borderRadius: 'md',
    flexShrink: '0',
  },
  variants: {
    category: {
      BUG: { bg: 'red.100', color: 'red.800' },
      FEATURE: { bg: 'primary.100', color: 'primary.800' },
      UI_UX: { bg: 'purple.100', color: 'purple.800' },
      OTHER: { bg: 'gray.200', color: 'gray.700' },
    },
  },
  defaultVariants: {
    category: 'OTHER',
  },
});

export const card_statusBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '3',
    py: '1',
    borderRadius: 'full',
    fontSize: 'xs',
    fontWeight: 'semibold',
    flexShrink: '0',
  },
  variants: {
    status: {
      NEW: { bg: 'blue.50', color: 'blue.700' },
      TRIAGED: { bg: 'amber.50', color: 'amber.800' },
      PLANNED: { bg: 'primary.50', color: 'primary.700' },
      IN_PROGRESS: { bg: 'blue.50', color: 'blue.700' },
      DONE: { bg: 'primary.100', color: 'primary.800' },
      WONT_FIX: { bg: 'gray.100', color: 'gray.600' },
      DUPLICATE: { bg: 'gray.100', color: 'gray.600' },
    },
  },
  defaultVariants: {
    status: 'NEW',
  },
});

export const card_description = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineClamp: 2,
  lineHeight: '[1.6]',
  mb: '4',
});

export const card_divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
  mt: 'auto',
});

export const card_meta = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pt: '4',
  fontSize: 'xs',
  color: 'gray.500',
});

export const card_metaLeft = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const card_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
});

// ===== VoteButton =====

export const voteArea = css({
  display: 'grid',
  gridTemplateRows: '1fr auto 1fr',
  gap: '2',
  justifyItems: 'center',
  flexShrink: '0',
});

export const voteButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    flexShrink: '0',
    border: 'none',
    bg: 'transparent',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'primary.500',
    },
  },
  variants: {
    size: {
      sm: {
        w: '[36px]',
        aspectRatio: 'square',
        borderRadius: 'lg',
        alignSelf: 'end',
      },
      md: {
        flexDirection: 'column',
        gap: '0.5',
        w: 'auto',
        minH: 'auto',
        p: '0',
        borderRadius: 'lg',
      },
    },
    hasVoted: {
      true: {
        color: 'primary.700',
        _hover: {
          bg: 'primary.50',
        },
      },
      false: {
        color: 'gray.400',
        _hover: {
          bg: 'gray.50',
        },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
    hasVoted: false,
  },
});

export const voteButton_count = css({
  fontWeight: 'bold',
  fontSize: 'xl',
  lineHeight: '[1]',
  color: 'gray.700',
});
