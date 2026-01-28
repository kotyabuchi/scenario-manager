import { css, cva } from '@/styled-system/css';

// ===== Page Layout =====

export const pageContainer = css({
  bg: 'bg.page',
  minH: '100vh',
});

export const pageLayout = css({
  display: 'flex',
  flexDirection: 'column',
});

// ===== Tab Bar =====

export const tabBar = css({
  bg: 'white',
  h: '56px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  px: '32px',
  shadow: 'subHeader.default',
});

export const tabContainer = css({
  display: 'flex',
  bg: '#F3F4F6',
  borderRadius: '8px',
  p: '4px',
});

export const tabButton = cva({
  base: {
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    px: '16px',
    h: '36px',
    cursor: 'pointer',
    transition: 'all {durations.fast}',
    _hover: {
      color: '#1F2937',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  },
  variants: {
    active: {
      true: {
        bg: '#FFFFFF',
        color: '#1F2937',
        fontWeight: '500',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      false: {
        bg: 'transparent',
        color: '#6B7280',
        fontWeight: 'normal',
        shadow: 'none',
      },
    },
  },
});

export const loginPrompt = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  minH: '400px',
  gap: '16px',
});

export const loginPromptText = css({
  fontSize: '16px',
  color: '#6B7280',
});

// ===== Search Panel (公開卓) =====

export const searchPanel = css({
  bg: 'white',
  shadow: 'subHeader.default',
  p: '24px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const searchPanel_row = css({
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
});

export const searchPanel_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  border: 'none',
  padding: 0,
  margin: 0,
});

export const searchPanel_fieldSystem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  w: '200px',
  border: 'none',
  padding: 0,
  margin: 0,
});

export const searchPanel_fieldDate = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  w: '280px',
  border: 'none',
  padding: 0,
  margin: 0,
});

export const searchPanel_fieldPhase = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  w: '160px',
  border: 'none',
  padding: 0,
  margin: 0,
});

export const searchPanel_fieldScenario = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  flex: 1,
  minW: '200px',
  border: 'none',
  padding: 0,
  margin: 0,
});

export const searchPanel_fieldSearchButton = css({
  w: '100px',
});

export const searchPanel_label = css({
  fontSize: '13px',
  fontWeight: '500',
  color: '#6B7280',
});

// ===== Filter Panel (履歴) =====

export const filterPanel = css({
  bg: 'white',
  shadow: 'subHeader.default',
  p: '24px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const filterPanel_row = css({
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
});

export const filterPanel_fieldSystem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  w: '180px',
});

export const filterPanel_fieldRole = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  w: '140px',
});

export const filterPanel_fieldStatus = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  w: '140px',
});

export const filterPanel_label = css({
  fontSize: '13px',
  fontWeight: '500',
  color: '#6B7280',
});

// ===== Content Area =====

export const contentArea_public = css({
  maxW: '1440px',
  mx: 'auto',
  w: '100%',
  p: '24px 32px 32px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const contentArea_upcoming = css({
  maxW: '1440px',
  mx: 'auto',
  w: '100%',
  p: '24px 32px 32px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const contentArea_history = css({
  maxW: '1440px',
  mx: 'auto',
  w: '100%',
  p: '16px 32px 32px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

// ===== Result Header =====

export const resultHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const resultHeader_count = css({
  fontSize: '14px',
  color: '#6B7280',
});

export const resultHeader_sortArea = css({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
});

export const resultHeader_sortLabel = css({
  fontSize: '13px',
  color: '#6B7280',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

// ===== Public Cards (Card/Default component) =====

export const publicCardsGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '20px',
});

// ===== My Session List (vertical layout) =====

export const mySessionListContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const publicCard = css({
  w: '320px',
  bg: 'white',
  borderRadius: '12px',
  shadow: '0 4px 16px 0 rgba(0, 0, 0, 0.06)',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  _hover: {
    shadow: '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)',
  },
});

export const publicCard_thumbnail = css({
  h: '100px',
  bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  position: 'relative',
});

export const publicCard_systemBadge = css({
  position: 'absolute',
  bottom: 0,
  right: 0,
  bg: '#10B981',
  color: 'white',
  fontSize: '11px',
  fontWeight: '600',
  p: '4px 8px',
  borderRadius: '0 0 8px 0',
});

export const publicCard_content = css({
  p: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const publicCard_title = css({
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  lineClamp: 2,
});

export const publicCard_meta = css({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
});

export const publicCard_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  color: '#6B7280',
});

export const publicCard_metaIcon = css({
  w: '14px',
  h: '14px',
  color: '#6B7280',
});

export const publicCard_tags = css({
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
});

export const publicCard_phaseTag = cva({
  base: {
    borderRadius: '4px',
    h: '24px',
    fontSize: '11px',
    fontWeight: '500',
    px: '8px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  variants: {
    phase: {
      RECRUITING: {
        bg: '#DCFCE7',
        color: '#16A34A',
      },
      PREPARATION: {
        bg: '#FEF3C7',
        color: '#D97706',
      },
      IN_PROGRESS: {
        bg: '#DBEAFE',
        color: '#2563EB',
      },
      COMPLETED: {
        bg: '#F3F4F6',
        color: '#6B7280',
      },
      CANCELLED: {
        bg: '#FEE2E2',
        color: '#DC2626',
      },
    },
  },
});

export const publicCard_tag = css({
  display: 'inline-flex',
  alignItems: 'center',
  h: '24px',
  px: '8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '500',
  bg: '#F3F4F6',
  color: '#4B5563',
});

export const publicCard_slotWarning = css({
  bg: '#FEF2F2',
  color: '#DC2626',
  fontSize: '11px',
  fontWeight: '600',
  px: '8px',
  h: '24px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
});

// ===== Upcoming/History Session Card (horizontal layout) =====

export const sessionCard_horizontal = css({
  bg: 'white',
  borderRadius: '12px',
  shadow: '0 4px 16px 0 rgba(0, 0, 0, 0.06)',
  display: 'flex',
  gap: '16px',
  p: '20px',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  _hover: {
    shadow: '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)',
  },
});

export const sessionCard_dateArea = css({
  w: '80px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
});

export const sessionCard_month = cva({
  base: {
    fontSize: '13px',
  },
  variants: {
    type: {
      upcoming: {
        color: '#6B7280',
      },
      history: {
        color: '#9CA3AF',
      },
    },
  },
});

export const sessionCard_day = cva({
  base: {
    fontSize: '32px',
    fontWeight: '700',
  },
  variants: {
    type: {
      upcoming: {
        color: '#1F2937',
      },
      history: {
        color: '#6B7280',
      },
    },
  },
});

export const sessionCard_weekday = cva({
  base: {
    fontSize: '12px',
  },
  variants: {
    type: {
      upcoming: {
        color: '#6B7280',
      },
      history: {
        color: '#9CA3AF',
      },
    },
  },
});

export const sessionCard_infoArea = css({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const sessionCard_title = css({
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
});

export const sessionCard_metaRow = css({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
});

export const sessionCard_systemBadgeInline = css({
  bg: '#10B981',
  color: 'white',
  fontSize: '11px',
  fontWeight: '600',
  borderRadius: '4px',
  p: '4px 8px',
});

export const sessionCard_time = css({
  fontSize: '13px',
  color: '#6B7280',
});

export const sessionCard_players = css({
  fontSize: '13px',
  color: '#6B7280',
});

export const sessionCard_roleBadge = cva({
  base: {
    borderRadius: '6px',
    p: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  variants: {
    role: {
      PLAYER: {
        bg: '#EEF2FF',
        color: '#4F46E5',
      },
      KEEPER: {
        bg: '#FEF3C7',
        color: '#D97706',
      },
      SPECTATOR: {
        bg: '#F3F4F6',
        color: '#6B7280',
      },
    },
  },
});

export const sessionCard_badges = css({
  display: 'flex',
  gap: '8px',
  mt: '4px',
});

export const sessionCard_badge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  px: '8px',
  py: '2px',
  fontSize: '12px',
  color: '#6B7280',
  bg: '#F3F4F6',
  borderRadius: '4px',
});

// ===== Empty State =====

export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  minH: '400px',
  gap: '16px',
});

export const emptyState_icon = css({
  w: '48px',
  h: '48px',
  color: '#D1D5DB',
});

export const emptyState_title = css({
  fontSize: '16px',
  color: '#6B7280',
});

export const emptyState_subtitle = css({
  fontSize: '13px',
  color: '#9CA3AF',
});

// ===== More Button Area =====

export const moreButtonArea = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '16px',
});

// ===== View Toggle (ToggleGroup) =====

export const viewToggle = css({
  display: 'flex',
  gap: '4px',
  bg: '#F3F4F6',
  p: '4px',
  borderRadius: '8px',
});

export const viewToggle_button = cva({
  base: {
    w: '36px',
    h: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    bg: 'transparent',
    color: '#6B7280',
    _hover: {
      color: '#1F2937',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'white',
        color: '#1F2937',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
});

// ===== Calendar Styles =====

export const calendarContainer = css({
  bg: 'white',
  borderRadius: '12px',
  shadow: '0 4px 16px 0 rgba(0, 0, 0, 0.06)',
  overflow: 'hidden',
});

export const calendarHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  p: '16px 24px',
  borderBottom: '1px solid #E5E7EB',
});

export const calendarTitle = css({
  fontSize: '18px',
  fontWeight: '600',
  color: '#1F2937',
});

export const calendarNavButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  borderRadius: '6px',
  border: 'none',
  bg: 'transparent',
  cursor: 'pointer',
  color: '#6B7280',
  transition: 'all {durations.normal}',
  _hover: {
    bg: '#F3F4F6',
    color: '#1F2937',
  },
});

export const calendarGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
});

export const calendarWeekHeader = css({
  display: 'contents',
});

export const calendarWeekDay = css({
  py: '12px',
  textAlign: 'center',
  fontSize: '13px',
  fontWeight: '500',
  color: '#6B7280',
  borderBottom: '1px solid #E5E7EB',
});

export const calendarDay = cva({
  base: {
    minH: '80px',
    p: '8px',
    borderRight: '1px solid #E5E7EB',
    borderBottom: '1px solid #E5E7EB',
    _last: {
      borderRight: 'none',
    },
  },
  variants: {
    isCurrentMonth: {
      true: {
        bg: 'white',
      },
      false: {
        bg: '#F9FAFB',
      },
    },
    isToday: {
      true: {
        bg: '#EEF2FF',
      },
    },
  },
});

export const calendarDayNumber = cva({
  base: {
    fontSize: '13px',
    fontWeight: '500',
    mb: '4px',
  },
  variants: {
    isCurrentMonth: {
      true: {
        color: '#1F2937',
      },
      false: {
        color: '#9CA3AF',
      },
    },
    isToday: {
      true: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        w: '24px',
        h: '24px',
        borderRadius: '50%',
        bg: '#4F46E5',
        color: 'white',
      },
    },
  },
});

export const calendarSessionDot = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  px: '6px',
  py: '2px',
  fontSize: '11px',
  bg: '#EEF2FF',
  color: '#4F46E5',
  borderRadius: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  mb: '2px',
  _hover: {
    bg: '#E0E7FF',
  },
});

export const calendarUnscheduledSection = css({
  px: '24px',
  py: '16px',
  borderTop: '1px solid #E5E7EB',
});

export const calendarUnscheduledTitle = css({
  fontSize: '13px',
  fontWeight: '500',
  color: '#6B7280',
  mb: '12px',
});

export const calendarUnscheduledList = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

export const calendarUnscheduledItem = css({
  px: '12px',
  py: '6px',
  fontSize: '13px',
  bg: '#FEF3C7',
  color: '#D97706',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    bg: '#FDE68A',
  },
});

// ===== Common Input Styles =====

export const selectInput = css({
  px: '12px',
  py: '8px',
  border: 'none',
  borderRadius: '6px',
  bg: '#F9FAFB',
  color: '#1F2937',
  fontSize: '13px',
  outline: 'none',
  transition: 'background-color {durations.normal}',
  cursor: 'pointer',
  _hover: {
    bg: '#F3F4F6',
  },
  _focusVisible: {
    bg: '#F3F4F6',
    outline: '2px solid #4F46E5',
    outlineOffset: '2px',
  },
});

export const dateInput = css({
  px: '12px',
  py: '8px',
  border: 'none',
  borderRadius: '6px',
  bg: '#F9FAFB',
  color: '#1F2937',
  fontSize: '13px',
  outline: 'none',
  transition: 'background-color {durations.normal}',
  _hover: {
    bg: '#F3F4F6',
  },
  _focusVisible: {
    bg: '#F3F4F6',
    outline: '2px solid #4F46E5',
    outlineOffset: '2px',
  },
});

export const textInput = css({
  px: '12px',
  py: '8px',
  border: 'none',
  borderRadius: '6px',
  bg: '#F9FAFB',
  color: '#1F2937',
  fontSize: '13px',
  outline: 'none',
  transition: 'background-color {durations.normal}',
  w: '100%',
  _hover: {
    bg: '#F3F4F6',
  },
  _focusVisible: {
    bg: '#F3F4F6',
    outline: '2px solid',
    outlineColor: 'border.focus',
    outlineOffset: '2px',
  },
  _placeholder: {
    color: '#9CA3AF',
  },
});

// ===== Chip/Tag Styles =====

export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    px: '8px',
    py: '4px',
    fontSize: '11px',
    fontWeight: '500',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all {durations.normal}',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
  },
  variants: {
    selected: {
      true: {
        bg: '#4F46E5',
        color: 'white',
        _hover: {
          bg: '#4338CA',
        },
      },
      false: {
        bg: '#F3F4F6',
        color: '#6B7280',
        _hover: {
          bg: '#E5E7EB',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

// ===== Divider =====

export const divider = css({
  border: 'none',
  h: '1px',
  bg: '#E5E7EB',
  my: '16px',
});
