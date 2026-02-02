import { css, cva } from '@/styled-system/css';

// ===== Page Layout =====

export const pageContainer = css({
  bg: 'bg.page',
  minH: '[100vh]',
});

export const pageLayout = css({
  display: 'flex',
  flexDirection: 'column',
});

// ===== Tab Bar =====

export const tabBar = css({
  bg: 'white',
  h: '[56px]',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  px: '8',
  shadow: '[0 2px 4px rgba(0, 0, 0, 0.05)]',
});

export const tabContainer = css({
  display: 'flex',
  bg: 'gray.100',
  borderRadius: 'md',
  p: '1',
});

export const tabButton = cva({
  base: {
    border: 'none',
    borderRadius: 'md',
    fontSize: '[14px]',
    fontFamily: '[Inter, sans-serif]',
    px: '4',
    h: '9',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      color: 'gray.800',
    },
    _disabled: {
      opacity: '[0.5]',
      cursor: 'not-allowed',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'white',
        color: 'gray.800',
        fontWeight: 'medium',
        shadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
      },
      false: {
        bg: 'transparent',
        color: 'gray.500',
        fontWeight: 'normal',
        shadow: '[none]',
      },
    },
  },
});

export const loginPrompt = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1',
  minH: '[400px]',
  gap: '4',
});

export const loginPromptText = css({
  fontSize: '[16px]',
  color: 'gray.500',
});

// ===== Search Panel (公開卓) =====

export const searchPanel = css({
  bg: 'white',
  shadow: '[0 2px 4px rgba(0, 0, 0, 0.05)]',
  py: '6',
  px: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const searchPanel_row = css({
  display: 'flex',
  gap: '4',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
});

export const searchPanel_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  border: 'none',
  padding: '0',
  margin: '0',
});

export const searchPanel_fieldSystem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[200px]',
  border: 'none',
  padding: '0',
  margin: '0',
});

export const searchPanel_fieldDate = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[280px]',
  border: 'none',
  padding: '0',
  margin: '0',
});

export const searchPanel_fieldPhase = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[160px]',
  border: 'none',
  padding: '0',
  margin: '0',
});

export const searchPanel_fieldScenario = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  flex: '[1]',
  minW: '[200px]',
  border: 'none',
  padding: '0',
  margin: '0',
});

export const searchPanel_fieldSearchButton = css({
  w: '[100px]',
});

export const searchPanel_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.500',
});

// ===== Filter Panel (履歴) =====

export const filterPanel = css({
  bg: 'white',
  shadow: '[0 2px 4px rgba(0, 0, 0, 0.05)]',
  py: '6',
  px: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const filterPanel_row = css({
  display: 'flex',
  gap: '4',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
});

export const filterPanel_fieldSystem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[180px]',
});

export const filterPanel_fieldRole = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[140px]',
});

export const filterPanel_fieldStatus = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[140px]',
});

export const filterPanel_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.500',
});

// ===== Content Area =====

export const contentArea_public = css({
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

export const contentArea_history = css({
  maxW: '[1440px]',
  mx: 'auto',
  w: 'full',
  pt: '4',
  px: '8',
  pb: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

// ===== Result Header =====

export const resultHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const resultHeader_count = css({
  fontSize: '[14px]',
  color: 'gray.500',
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

// ===== Public Cards (Card/Default component) =====

export const publicCardsGrid = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(auto-fill, minmax(320px, 1fr))]',
  gap: '5',
});

// ===== My Session List (vertical layout) =====

export const mySessionListContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const publicCard = css({
  w: '[320px]',
  bg: 'white',
  borderRadius: 'xl',
  shadow: '[0 4px 16px 0 rgba(0, 0, 0, 0.06)]',
  overflow: 'hidden',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    shadow: '[0 8px 24px 0 rgba(0, 0, 0, 0.12)]',
    transform: '[translateY(-2px)]',
  },
});

export const publicCard_thumbnail = css({
  h: '[100px]',
  bg: '[linear-gradient(135deg, #667eea 0%, #764ba2 100%)]',
  position: 'relative',
});

export const publicCard_systemBadge = css({
  position: 'absolute',
  bottom: '0',
  right: '0',
  bg: 'primary.500',
  color: 'white',
  fontSize: '[11px]',
  fontWeight: 'semibold',
  py: '1',
  px: '2',
  borderRadius: '[0 0 8px 0]',
});

export const publicCard_content = css({
  p: '4',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const publicCard_title = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'gray.800',
  lineClamp: 2,
});

export const publicCard_meta = css({
  display: 'flex',
  gap: '4',
  alignItems: 'center',
});

export const publicCard_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: '[13px]',
  color: 'gray.500',
});

export const publicCard_metaIcon = css({
  w: '[14px]',
  h: '[14px]',
  color: 'gray.500',
});

export const publicCard_tags = css({
  display: 'flex',
  gap: '1.5',
  flexWrap: 'wrap',
});

export const publicCard_phaseTag = cva({
  base: {
    borderRadius: 'sm',
    h: '6',
    fontSize: '[11px]',
    fontWeight: 'medium',
    px: '[8px]',
    display: 'inline-flex',
    alignItems: 'center',
  },
  variants: {
    phase: {
      RECRUITING: {
        bg: 'green.100',
        color: 'green.600',
      },
      PREPARATION: {
        bg: 'orange.100',
        color: 'orange.600',
      },
      IN_PROGRESS: {
        bg: 'info.100',
        color: 'info.600',
      },
      COMPLETED: {
        bg: 'gray.100',
        color: 'gray.500',
      },
      CANCELLED: {
        bg: 'red.100',
        color: 'red.600',
      },
    },
  },
});

export const publicCard_tag = css({
  display: 'inline-flex',
  alignItems: 'center',
  h: '6',
  px: '[8px]',
  borderRadius: 'sm',
  fontSize: '[11px]',
  fontWeight: 'medium',
  bg: 'gray.100',
  color: 'gray.600',
});

export const publicCard_slotWarning = css({
  bg: 'red.50',
  color: 'red.600',
  fontSize: '[11px]',
  fontWeight: 'semibold',
  px: '[8px]',
  h: '6',
  borderRadius: 'sm',
  display: 'inline-flex',
  alignItems: 'center',
});

// ===== Upcoming/History Session Card (horizontal layout) =====

export const sessionCard_horizontal = css({
  bg: 'white',
  borderRadius: 'xl',
  shadow: '[0 4px 16px 0 rgba(0, 0, 0, 0.06)]',
  display: 'flex',
  gap: '4',
  p: '5',
  alignItems: 'center',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    shadow: '[0 8px 24px 0 rgba(0, 0, 0, 0.12)]',
    transform: '[translateY(-2px)]',
  },
});

export const sessionCard_dateArea = css({
  w: '[80px]',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
});

export const sessionCard_month = cva({
  base: {
    fontSize: '[13px]',
  },
  variants: {
    type: {
      upcoming: {
        color: 'gray.500',
      },
      history: {
        color: 'gray.400',
      },
    },
  },
});

export const sessionCard_day = cva({
  base: {
    fontSize: '[32px]',
    fontWeight: 'bold',
  },
  variants: {
    type: {
      upcoming: {
        color: 'gray.800',
      },
      history: {
        color: 'gray.500',
      },
    },
  },
});

export const sessionCard_weekday = cva({
  base: {
    fontSize: '[12px]',
  },
  variants: {
    type: {
      upcoming: {
        color: 'gray.500',
      },
      history: {
        color: 'gray.400',
      },
    },
  },
});

export const sessionCard_infoArea = css({
  flex: '[1]',
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const sessionCard_title = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const sessionCard_metaRow = css({
  display: 'flex',
  gap: '4',
  alignItems: 'center',
});

export const sessionCard_systemBadgeInline = css({
  bg: 'primary.500',
  color: 'white',
  fontSize: '[11px]',
  fontWeight: 'semibold',
  borderRadius: 'sm',
  py: '1',
  px: '2',
});

export const sessionCard_time = css({
  fontSize: '[13px]',
  color: 'gray.500',
});

export const sessionCard_players = css({
  fontSize: '[13px]',
  color: 'gray.500',
});

export const sessionCard_roleBadge = cva({
  base: {
    borderRadius: 'md',
    py: '1.5',
    px: '3',
    fontSize: '[12px]',
    fontWeight: 'semibold',
    flexShrink: '0',
  },
  variants: {
    role: {
      PLAYER: {
        bg: 'indigo.50',
        color: 'indigo.600',
      },
      KEEPER: {
        bg: 'orange.100',
        color: 'orange.600',
      },
      SPECTATOR: {
        bg: 'gray.100',
        color: 'gray.500',
      },
    },
  },
});

export const sessionCard_badges = css({
  display: 'flex',
  gap: '2',
  mt: '[4px]',
});

export const sessionCard_badge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '[8px]',
  py: '[2px]',
  fontSize: '[12px]',
  color: 'gray.500',
  bg: 'gray.100',
  borderRadius: 'sm',
});

// ===== Empty State =====

export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '[1]',
  minH: '[400px]',
  gap: '4',
});

export const emptyState_icon = css({
  w: '[48px]',
  h: '12',
  color: 'gray.300',
});

export const emptyState_title = css({
  fontSize: '[16px]',
  color: 'gray.500',
});

export const emptyState_subtitle = css({
  fontSize: '[13px]',
  color: 'gray.400',
});

// ===== More Button Area =====

export const moreButtonArea = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '4',
});

// ===== View Toggle (ToggleGroup) =====

export const viewToggle = css({
  display: 'flex',
  gap: '1',
  bg: 'gray.100',
  p: '1',
  borderRadius: 'lg',
});

export const viewToggle_button = cva({
  base: {
    w: '[36px]',
    h: '9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    border: 'none',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: '[0.2s]',
    bg: 'transparent',
    color: 'gray.500',
    _hover: {
      color: 'gray.800',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'white',
        color: 'gray.800',
        shadow: '[0 1px 3px 0 rgba(0, 0, 0, 0.1)]',
      },
    },
  },
});

// ===== Calendar Styles =====

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

// ===== Common Input Styles =====

export const selectInput = css({
  px: '3',
  py: '2',
  border: 'none',
  borderRadius: 'md',
  bg: 'gray.50',
  color: 'gray.800',
  fontSize: '[13px]',
  outline: 'none',
  transitionProperty: '[background-color]',
  transitionDuration: 'normal',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.100',
  },
  _focusVisible: {
    bg: 'gray.100',
    outline: '[2px solid #4F46E5]',
    outlineOffset: '[2px]',
  },
});

export const dateInput = css({
  px: '3',
  py: '2',
  border: 'none',
  borderRadius: 'md',
  bg: 'gray.50',
  color: 'gray.800',
  fontSize: '[13px]',
  outline: 'none',
  transitionProperty: '[background-color]',
  transitionDuration: 'normal',
  _hover: {
    bg: 'gray.100',
  },
  _focusVisible: {
    bg: 'gray.100',
    outline: '[2px solid #4F46E5]',
    outlineOffset: '[2px]',
  },
});

export const textInput = css({
  px: '3',
  py: '2',
  border: 'none',
  borderRadius: 'md',
  bg: 'gray.50',
  color: 'gray.800',
  fontSize: '[13px]',
  outline: 'none',
  transitionProperty: '[background-color]',
  transitionDuration: 'normal',
  w: 'full',
  _hover: {
    bg: 'gray.100',
  },
  _focusVisible: {
    bg: 'gray.100',
    outline: '[2px solid]',
    outlineColor: 'indigo.600',
    outlineOffset: '[2px]',
  },
  _placeholder: {
    color: 'gray.400',
  },
});

// ===== Chip/Tag Styles =====

export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    px: '[8px]',
    py: '[4px]',
    fontSize: '[11px]',
    fontWeight: 'medium',
    borderRadius: 'sm',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
  },
  variants: {
    selected: {
      true: {
        bg: 'indigo.600',
        color: 'white',
        _hover: {
          bg: 'indigo.700',
        },
      },
      false: {
        bg: 'gray.100',
        color: 'gray.500',
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

// ===== Divider =====

export const calendar_sessionDots = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '[2px]',
});

export const divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
  my: '4',
});

// ===== SearchPanel Inline Style Migration =====

export const searchPanel_systemField = css({
  width: '[200px]',
  flexShrink: '0',
});

export const searchPanel_dateField = css({
  width: '[280px]',
  flexShrink: '0',
});

export const searchPanel_statusField = css({
  width: '[160px]',
  flexShrink: '0',
});

export const searchPanel_scenarioField = css({
  flex: '[1]',
  minWidth: '0',
});

export const searchPanel_submitButton = css({
  width: 'full',
});
