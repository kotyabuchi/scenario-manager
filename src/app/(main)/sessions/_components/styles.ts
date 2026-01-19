import { css, cva } from '@/styled-system/css';

// ページスタイル
export const pageContainer = css({
  maxW: '1200px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
});

export const pageHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 'lg',
});

export const pageTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
});

// タブスタイル
export const tabContainer = css({
  display: 'flex',
  gap: 'xs',
  borderBottom: '1px solid',
  borderColor: 'border.subtle',
  mb: 'lg',
});

export const tabButton = cva({
  base: {
    px: 'lg',
    py: 'sm',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.muted',
    bg: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: '2px solid transparent',
    mb: '-1px',
    _hover: {
      color: 'text.primary',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    active: {
      true: {
        color: 'primary.default',
        borderColor: 'primary.default',
        _hover: {
          color: 'primary.default',
        },
      },
    },
  },
});

// 検索パネルスタイル
export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'lg',
  bg: 'bg.card',
  borderRadius: 'xl',
  mb: 'lg',
  shadow: 'card.default',
});

export const searchPanelRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'md',
  alignItems: 'flex-end',
});

export const searchPanelField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  minW: '200px',
  flex: 1,
});

export const searchPanelLabel = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.secondary',
});

export const searchPanelChips = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const searchActions = css({
  display: 'flex',
  gap: 'sm',
});

// チップスタイル
export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'xs',
    px: 'sm',
    py: '5px',
    fontSize: 'sm',
    fontWeight: 'medium',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
    _focusVisible: {
      boxShadow:
        '0 0 0 2px {colors.bg.card}, 0 0 0 4px {colors.primary.focusRing}',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.default',
        color: 'primary.foreground.white',
        shadow: 'chip.selected',
        _hover: {
          bg: 'primary.emphasized',
        },
      },
      false: {
        bg: 'chip.default',
        color: 'text.primary',
        shadow: 'chip.default',
        _hover: {
          bg: 'chip.hover',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

// セッションカードスタイル
export const sessionCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'bg.card',
  borderRadius: 'xl',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s',
  shadow: 'card.default',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
});

export const sessionCard_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 'md',
  py: 'sm',
  borderBottom: '1px solid',
  borderColor: 'border.subtle',
});

export const sessionCard_headerLeft = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const sessionCard_phaseBadge = cva({
  base: {
    px: 'sm',
    py: '2px',
    fontSize: 'xs',
    fontWeight: 'medium',
    borderRadius: 'full',
  },
  variants: {
    phase: {
      RECRUITING: {
        bg: 'success.50',
        color: 'success.700',
      },
      PREPARATION: {
        bg: 'warning.50',
        color: 'warning.700',
      },
      IN_PROGRESS: {
        bg: 'primary.50',
        color: 'primary.700',
      },
      COMPLETED: {
        bg: 'neutral.100',
        color: 'neutral.600',
      },
      CANCELLED: {
        bg: 'error.50',
        color: 'error.700',
      },
    },
  },
});

export const sessionCard_dateTime = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const sessionCard_roleBadge = cva({
  base: {
    px: 'sm',
    py: '2px',
    fontSize: 'xs',
    fontWeight: 'medium',
    borderRadius: 'md',
  },
  variants: {
    role: {
      KEEPER: {
        bg: 'primary.50',
        color: 'primary.700',
      },
      PLAYER: {
        bg: 'neutral.100',
        color: 'neutral.600',
      },
      SPECTATOR: {
        bg: 'neutral.50',
        color: 'neutral.500',
      },
    },
  },
});

export const sessionCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  p: 'md',
  flex: 1,
});

export const sessionCard_title = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.primary',
  lineClamp: 2,
  lineHeight: 'tight',
});

export const sessionCard_system = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const sessionCard_meta = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'xs',
  fontSize: 'sm',
  color: 'text.muted',
});

export const sessionCard_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const sessionCard_metaIcon = css({
  w: '14px',
  h: '14px',
  flexShrink: 0,
});

export const sessionCard_badges = css({
  display: 'flex',
  gap: 'xs',
  mt: 'auto',
});

export const sessionCard_badge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  px: 'xs',
  py: '1px',
  fontSize: 'xs',
  color: 'text.muted',
  bg: 'neutral.50',
  borderRadius: 'sm',
});

// セッションリストスタイル
export const sessionListContainer = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 'lg',
});

export const sessionListEmpty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: '2xl',
  gap: 'md',
  color: 'text.muted',
});

export const sessionListEmptyIcon = css({
  w: '48px',
  h: '48px',
  color: 'neutral.300',
});

export const sessionListEmptyText = css({
  fontSize: 'md',
  textAlign: 'center',
  color: 'text.muted',
});

export const sessionListEmptyActions = css({
  display: 'flex',
  gap: 'sm',
  mt: 'md',
});

// 結果表示スタイル
export const resultHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 'md',
});

export const resultCount = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const sortSelect = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const selectInput = css({
  px: 'sm',
  py: 'xs',
  border: '1px solid',
  borderColor: 'border.500',
  borderRadius: 'sm',
  bg: 'bg.primary',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  cursor: 'pointer',
  _focus: {
    borderColor: 'primary.500',
  },
});

// 表示切替スタイル
export const viewToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  p: '2px',
  bg: 'neutral.100',
  borderRadius: 'md',
});

export const viewToggleButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    w: '32px',
    h: '32px',
    borderRadius: 'sm',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: 'text.muted',
    bg: 'transparent',
    _hover: {
      color: 'text.primary',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'white',
        color: 'text.primary',
        shadow: 'sm',
      },
    },
  },
});

// フィルタパネルスタイル
export const filterPanel = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'md',
  p: 'md',
  bg: 'bg.card',
  borderRadius: 'lg',
  mb: 'lg',
  shadow: 'card.default',
});

export const filterRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'lg',
  alignItems: 'center',
});

export const filterItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const filterField = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  fontSize: 'sm',
});

export const filterLabel = css({
  color: 'text.secondary',
  fontWeight: 'medium',
});

// 日付入力スタイル
export const datePresetContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
});

export const dateInputContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const dateInput = css({
  px: 'sm',
  py: 'xs',
  border: '1px solid',
  borderColor: 'border.500',
  borderRadius: 'sm',
  bg: 'bg.primary',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  _focus: {
    borderColor: 'primary.500',
  },
});

// カレンダースタイル
export const calendarContainer = css({
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  overflow: 'hidden',
});

export const calendarHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  px: 'lg',
  py: 'md',
  borderBottom: '1px solid',
  borderColor: 'border.subtle',
});

export const calendarTitle = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const calendarNavButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '32px',
  h: '32px',
  borderRadius: 'md',
  border: 'none',
  bg: 'transparent',
  cursor: 'pointer',
  color: 'text.muted',
  transition: 'all 0.2s',
  _hover: {
    bg: 'neutral.100',
    color: 'text.primary',
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
  py: 'sm',
  textAlign: 'center',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.muted',
  borderBottom: '1px solid',
  borderColor: 'border.subtle',
});

export const calendarDay = cva({
  base: {
    minH: '80px',
    p: 'xs',
    borderRight: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'border.subtle',
    _last: {
      borderRight: 'none',
    },
  },
  variants: {
    isCurrentMonth: {
      true: {
        bg: 'bg.primary',
      },
      false: {
        bg: 'neutral.50',
      },
    },
    isToday: {
      true: {
        bg: 'primary.50',
      },
    },
  },
});

export const calendarDayNumber = cva({
  base: {
    fontSize: 'sm',
    fontWeight: 'medium',
    mb: 'xs',
  },
  variants: {
    isCurrentMonth: {
      true: {
        color: 'text.primary',
      },
      false: {
        color: 'text.muted',
      },
    },
    isToday: {
      true: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        w: '24px',
        h: '24px',
        borderRadius: 'full',
        bg: 'primary.default',
        color: 'white',
      },
    },
  },
});

export const calendarSessionDot = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  px: 'xs',
  py: '1px',
  fontSize: 'xs',
  bg: 'primary.50',
  color: 'primary.700',
  borderRadius: 'sm',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  _hover: {
    bg: 'primary.100',
  },
});

export const calendarUnscheduledSection = css({
  px: 'lg',
  py: 'md',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
});

export const calendarUnscheduledTitle = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
  mb: 'sm',
});

export const calendarUnscheduledList = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
});

export const calendarUnscheduledItem = css({
  px: 'sm',
  py: 'xs',
  fontSize: 'sm',
  bg: 'warning.50',
  color: 'warning.700',
  borderRadius: 'md',
});
