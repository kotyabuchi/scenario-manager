import { css } from '@/styled-system/css';

export const shell = css({
  containerType: 'inline-size',
  display: 'flex',
  flex: '1',
  flexDirection: 'column',
  minWidth: '0',
  bg: 'bg.page',
});

export const grid = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '6',
  width: 'full',
  minWidth: '0',
  overflowX: 'clip',
});

export const twoPaneGrid = css({
  '@media (min-width: 1044px)': {
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    px: '6',
  },
});

export const listPane = css({
  position: 'relative',
  minWidth: '0',
});

export const scrollFade = css({
  '&[data-can-scroll-up="true"]': {
    maskImage:
      '[linear-gradient(to bottom, transparent, black token(spacing.8))]',
  },
  '&[data-can-scroll-down="true"]': {
    maskImage:
      '[linear-gradient(to bottom, black calc(100% - token(spacing.8)), transparent)]',
  },
  '&[data-can-scroll-up="true"][data-can-scroll-down="true"]': {
    maskImage:
      '[linear-gradient(to bottom, transparent, black token(spacing.8), black calc(100% - token(spacing.8)), transparent)]',
  },
});

export const scrollingListPane = css({
  py: '6',
  '@media (min-width: 1044px)': {
    // 余白はスクロール領域の内側に置き、トラックはビューポート端まで伸ばす。
    maxHeight: '[100dvh]',
    overflowY: 'auto',
    overscrollBehaviorY: 'contain',
  },
});

export const singleListPane = css({
  px: '6',
});

export const listPaneWithDetail = css({
  display: 'none',
  '@media (min-width: 1044px)': {
    display: 'block',
    pr: '2',
  },
});

export const narrowOnlyToc = css({
  display: 'block',
  mb: '4',
  '@media (min-width: 1044px)': {
    display: 'none',
  },
});

export const detailPane = css({
  position: 'relative',
  minWidth: '0',
});

export const detailPaneHidden = css({
  display: 'none',
});

export const detailPaneVisible = css({
  display: 'block',
  px: '6',
  py: '6',
  '@media (min-width: 1044px)': {
    pl: '0',
    pr: '2',
    maxHeight: '[100dvh]',
    overflowY: 'auto',
    overscrollBehaviorY: 'contain',
    animation:
      '[slideInFromRight var(--durations-slowest) var(--easings-ease-in-out-cubic) both]',
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: '[none]',
  },
});
