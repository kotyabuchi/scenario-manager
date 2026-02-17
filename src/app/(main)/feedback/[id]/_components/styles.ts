import { css, cva } from '@/styled-system/css';

import type { SystemStyleObject } from '@/styled-system/types';

// === FeedbackDetailContent ===

export const detailArticle = css({
  position: 'relative',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  p: '6',
  overflow: 'hidden',
  md: { p: '8' },
});

export const detailArticle_gradientBar = css({
  position: 'absolute',
  top: '0',
  left: '0',
  w: 'full',
  h: '[4px]',
  background:
    '[linear-gradient(to right, token(colors.primary.400/40), token(colors.blue.400/40))]',
});

export const detailHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const detailHeader_meta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

export const detailHeader_title = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'gray.900',
  lineHeight: '[1.3]',
  md: { fontSize: '3xl' },
});

export const detailHeader_description = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '[1.8]',
  whiteSpace: 'pre-wrap',
});

export const detailHeader_userInfo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  fontSize: 'sm',
  color: 'gray.500',
});

export const detailHeader_nickname = css({
  fontWeight: 'medium',
  color: 'gray.700',
});

export const detailHeader_date = css({
  fontSize: 'sm',
  color: 'gray.500',
});

export const detailHeader_id = css({
  fontSize: 'xs',
  fontFamily: 'mono',
  color: 'gray.400',
  ml: 'auto',
});

export const detailHeader_categoryBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '3',
    py: '1',
    fontSize: 'xs',
    fontWeight: 'semibold',
    borderRadius: 'full',
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

export const detailHeader_statusBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '3',
    py: '1',
    fontSize: 'xs',
    fontWeight: 'semibold',
    borderRadius: 'full',
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

// === Vote Section ===

export const voteSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
  bg: 'gray.50',
  borderRadius: 'lg',
  p: '4',
  sm: {
    flexDirection: 'row',
  },
  md: { px: '6' },
});

export const voteSection_text = css({
  fontSize: 'sm',
  color: 'gray.500',
  textAlign: 'center',
  sm: { textAlign: 'left' },
});

export const voteSection_button = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  bg: 'primary.100',
  borderRadius: 'lg',
  px: '6',
  py: '3',
  shadow: 'sm',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  border: 'none',
  color: 'primary.700',
  w: 'full',
  justifyContent: 'center',
  sm: { w: 'auto' },
  _hover: {
    bg: 'primary.200',
    shadow: 'md',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'primary.500',
  },
});

export const voteSection_count = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'primary.700',
});

export const voteSection_label = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'primary.700',
  textBoxTrim: 'trim-both',
});

// === Merged Info ===

export const mergedInfo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  p: '4',
  bg: 'orange.50',
  borderRadius: 'lg',
  fontSize: 'sm',
  color: 'orange.800',
});

export const mergedInfo_link = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  color: 'primary.700',
  textDecoration: 'underline',
  fontWeight: 'medium',
  _hover: {
    color: 'primary.800',
  },
});

export const mergedInfo_count = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  p: '4',
  bg: 'blue.50',
  border: '[1px solid]',
  borderColor: 'blue.100',
  borderRadius: 'lg',
  fontSize: 'sm',
  color: 'blue.800',
  fontWeight: 'medium',
});

export const divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
  my: '2',
});

// === CommentSection ===

export const commentSection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const commentSection_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '1',
});

export const commentSection_title = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'gray.900',
});

export const commentSection_titleCount = css({
  fontSize: 'md',
  fontWeight: 'normal',
  color: 'gray.500',
});

export const commentSection_sortTabs = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const commentSection_sortTab = cva({
  base: {
    fontSize: 'xs',
    bg: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      color: 'primary.700',
    },
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'primary.500',
    },
  },
  variants: {
    isActive: {
      true: {
        color: 'gray.700',
        fontWeight: 'medium',
      },
      false: {
        color: 'gray.400',
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

export const commentFormCard = css({
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  p: '4',
  md: { p: '6' },
});

export const commentForm = css({
  display: 'flex',
  gap: '4',
});

export const commentForm_avatarWrapper = css({
  flexShrink: '0',
  display: 'none',
  sm: { display: 'block' },
});

export const commentForm_body = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  flex: '1',
});

export const commentForm_error = css({
  fontSize: 'sm',
  color: 'red.600',
});

export const commentForm_actions = css({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const commentList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const commentCard = css({
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  p: '5',
});

export const commentCard_official = css({
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  p: '5',
  borderLeft: '[4px solid]',
  borderColor: 'primary.500',
});

export const commentCard_inner = css({
  display: 'flex',
  gap: '4',
});

export const commentCard_body = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  flex: '1',
  minW: '0',
});

export const commentCard_header = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
});

export const commentCard_nickname = css({
  fontWeight: 'bold',
  color: 'gray.900',
});

export const commentCard_officialBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5',
  px: '2',
  py: '0.5',
  bg: 'primary.500',
  color: 'white',
  borderRadius: 'full',
  fontSize: '[10px]',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 'wider',
});

export const commentCard_date = css({
  fontSize: 'xs',
  color: 'gray.400',
  ml: 'auto',
});

export const commentCard_content = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '[1.7]',
  whiteSpace: 'pre-wrap',
});

export const emptyComments = css({
  textAlign: 'center',
  py: '6',
  color: 'gray.500',
  fontSize: 'sm',
});

// === AdminSection ===

export const adminSection = css({
  bg: 'gray.50',
  borderRadius: 'xl',
  p: '6',
  border: '[1px solid]',
  borderColor: 'gray.100',
  md: { p: '8' },
});

export const adminSection_header = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const adminSection_divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
  my: '4',
});

export const adminSection_headerIcon = css({
  color: 'primary.500',
});

export const adminSection_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'gray.800',
});

export const adminSection_headerBadge = css({
  ml: 'auto',
  px: '2',
  py: '0.5',
  bg: 'gray.200',
  color: 'gray.500',
  fontSize: '[10px]',
  fontWeight: 'bold',
  borderRadius: 'md',
  textTransform: 'uppercase',
});

export const adminSection_grid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '8',
  md: { gridTemplateColumns: '1fr 1fr' },
});

export const adminSection_leftCol = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const adminSection_rightCol = css({
  display: 'flex',
  flexDirection: 'column',
});

export const adminSection_priorityPills = css({
  display: 'inline-flex',
  p: '1',
  bg: 'gray.200',
  borderRadius: 'lg',
  w: 'full',
});

export const adminSection_priorityPill = cva({
  base: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: '2',
    fontSize: 'xs',
    fontWeight: 'medium',
    borderRadius: 'md',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    border: 'none',
    bg: 'transparent',
    color: 'gray.500',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'primary.500',
    },
  },
  variants: {
    isActive: {
      true: {
        bg: 'white',
        color: 'gray.900',
        shadow: 'sm',
        fontWeight: 'medium',
      },
      false: {
        _hover: {
          color: 'gray.700',
        },
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

export const adminSection_mergeButton = css({
  w: 'full',
  justifyContent: 'center',
});

/** 共通 Textarea コンポーネントの css prop オーバーライド */
export const adminSection_textareaOverrides = {
  flex: '1',
  bg: 'white',
  borderRadius: 'lg',
  minH: '[140px]',
  lineHeight: '[1.7]',
} satisfies SystemStyleObject;

export const adminSection_actions = css({
  display: 'flex',
  justifyContent: 'flex-end',
  mt: '8',
});

// === ActionSection ===

export const actionSection = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
});

export const deleteConfirm_message = css({
  fontSize: 'sm',
  color: 'gray.700',
  lineHeight: '[1.7]',
});
