import { css, cva } from '@/styled-system/css';

export const contentArea_upcoming = css({
  maxW: '[1440px]',
  mx: 'auto',
  w: 'full',
  pt: '6',
  px: '8',
  pb: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const resultHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const resultHeader_sortArea = css({
  display: 'flex',
  gap: '2',
  alignItems: 'center',
});

export const resultHeader_sortLabel = css({
  fontSize: '[13px]',
  color: 'gray.500',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

export const moreButtonArea = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '4',
});

export const viewContainer = css({
  display: 'flex',
  gap: '0',
  overflow: 'hidden',
  position: 'relative',
});

export const viewContainer_pending = css({
  opacity: 'disabled',
  transitionProperty: '[opacity]',
  transitionDuration: 'normal',
});

export const listPanel = cva({
  base: {
    transitionProperty: 'common',
    transitionDuration: 'slower',
    transitionTimingFunction: '[cubic-bezier(0.4, 0, 0.2, 1)]',
    flexShrink: '0',
    overflow: 'hidden',
  },
  variants: {
    calendarView: {
      true: {
        width: '[320px]',
        minWidth: '[320px]',
      },
      false: {
        width: 'full',
        minWidth: '[0]',
      },
    },
  },
});

export const calendarPanel = cva({
  base: {
    transitionProperty: 'common',
    transitionDuration: 'slower',
    transitionTimingFunction: '[cubic-bezier(0.4, 0, 0.2, 1)]',
    overflow: 'hidden',
    flexShrink: '0',
  },
  variants: {
    calendarView: {
      true: {
        width: '[calc(100% - 320px)]',
        opacity: '[1]',
      },
      false: {
        width: '[0]',
        opacity: '[0]',
      },
    },
  },
});
