import { css, cva } from '@/styled-system/css';

export const calendarContainer = css({
  bg: 'white',
  borderRadius: 'xl',
  shadow: '[0 4px 16px 0 rgba(0, 0, 0, 0.06)]',
  overflow: 'hidden',
});

export const calendarHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '4',
  px: '6',
  borderBottom: '[1px solid #E5E7EB]',
});

export const calendarTitle = css({
  fontSize: '[18px]',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const calendarNavButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '[32px]',
  h: '8',
  borderRadius: 'md',
  border: 'none',
  bg: 'transparent',
  cursor: 'pointer',
  color: 'gray.500',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: 'gray.100',
    color: 'gray.800',
  },
});

export const calendarGrid = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(7, 1fr)]',
});

export const calendarWeekHeader = css({
  display: 'contents',
});

export const calendarWeekDay = css({
  py: '3',
  textAlign: 'center',
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.500',
  borderBottom: '[1px solid #E5E7EB]',
});

export const calendarDay = cva({
  base: {
    minH: '[80px]',
    p: '2',
    borderRight: '[1px solid #E5E7EB]',
    borderBottom: '[1px solid #E5E7EB]',
    _last: {
      borderRight: '[none]',
    },
  },
  variants: {
    isCurrentMonth: {
      true: {
        bg: 'white',
      },
      false: {
        bg: 'gray.50',
      },
    },
    isToday: {
      true: {
        bg: 'indigo.50',
      },
    },
  },
});

export const calendarDayNumber = cva({
  base: {
    fontSize: '[13px]',
    fontWeight: 'medium',
    mb: '[4px]',
  },
  variants: {
    isCurrentMonth: {
      true: {
        color: 'gray.800',
      },
      false: {
        color: 'gray.400',
      },
    },
    isToday: {
      true: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        w: '[24px]',
        h: '6',
        borderRadius: 'full',
        bg: 'indigo.600',
        color: 'white',
      },
    },
  },
});

export const calendarSessionDot = css({
  display: 'flex',
  alignItems: 'center',
  gap: '[2px]',
  px: '[6px]',
  py: '[2px]',
  fontSize: '[11px]',
  bg: 'indigo.50',
  color: 'indigo.600',
  borderRadius: 'sm',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  mb: '[2px]',
  _hover: {
    bg: 'indigo.100',
  },
});

export const calendarUnscheduledSection = css({
  px: '6',
  py: '4',
  borderTop: '[1px solid #E5E7EB]',
});

export const calendarUnscheduledTitle = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.500',
  mb: '3',
});

export const calendarUnscheduledList = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

export const calendarUnscheduledItem = css({
  px: '3',
  py: '1.5',
  fontSize: '[13px]',
  bg: 'orange.100',
  color: 'orange.600',
  borderRadius: 'md',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: '[0.2s]',
  _hover: {
    bg: 'orange.200',
  },
});

export const calendar_sessionDots = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '[2px]',
});
