import { css, cva } from '@/styled-system/css';

export const workspace = css({
  display: 'grid',
  gap: '4',
  pb: '[84px]',
  md: {
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    alignItems: 'start',
    gap: '6',
    pb: '0',
  },
});

export const leftColumn = css({
  display: 'grid',
  gap: '4',
});

export const card = css({
  bg: 'white',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  boxShadow: 'sm',
});

export const cardHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '4',
  py: '3',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'gray.100',
});

export const cardTitle = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const cardBody = css({
  p: '4',
});

export const desktopSidebar = css({
  display: 'none',
  md: {
    display: 'block',
  },
});

export const mobileOnly = css({
  display: 'block',
  md: {
    display: 'none',
  },
});

export const desktopOnly = css({
  display: 'none',
  md: {
    display: 'block',
  },
});

export const mobileDrawerBackdrop = css({
  position: 'fixed',
  inset: '0',
  bg: 'overlay.dark',
  zIndex: 'overlay',
  md: {
    display: 'none',
  },
  _open: {
    animation: '[fadeIn var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[fadeOut var(--durations-normal) ease-in]',
  },
});

export const mobileDrawerPositioner = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 'modal',
  md: {
    display: 'none',
  },
});

export const mobileDrawerContent = css({
  width: 'full',
  maxH: '[85dvh]',
  bg: 'white',
  borderTopLeftRadius: '3xl',
  borderTopRightRadius: '3xl',
  boxShadow: 'dialog.default',
  display: 'grid',
  gridTemplateRows: 'auto auto minmax(0,1fr)',
  _open: {
    animation: '[slideInUp var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[slideOutDown var(--durations-normal) ease-in]',
  },
});

export const mobileDrawerHandle = css({
  display: 'flex',
  justifyContent: 'center',
  py: '2',
});

export const mobileDrawerHandleBar = css({
  width: '10',
  height: '1',
  rounded: 'full',
  bg: 'gray.300',
});

export const mobileDrawerHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '4',
  py: '3',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'gray.100',
});

export const mobileDrawerTitle = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const iconButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8',
  height: '8',
  borderRadius: 'md',
  color: 'gray.600',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.100',
    color: 'gray.800',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
});

export const mobileDrawerBody = css({
  minH: '0',
  overflowY: 'auto',
  p: '4',
});

export const calendarShell = css({
  display: 'grid',
  gap: '3',
});

export const calendarLegend = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

export const legendChip = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  px: '2',
  py: '1',
  borderRadius: 'full',
  bg: 'gray.50',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  fontSize: 'xs',
  color: 'gray.700',
});

export const legendDot = css({
  width: '2',
  height: '2',
  rounded: 'full',
  flexShrink: '0',
});

export const emptyState = css({
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'gray.100',
  bg: 'gray.50',
  p: '4',
  fontSize: 'sm',
  color: 'gray.600',
});

export const selectedTimeBlocksPanel = css({
  display: 'grid',
  gap: '3',
});

export const selectedTimeBlocksSummary = css({
  display: 'grid',
  gap: '1',
});

export const selectedTimeBlocksSummaryRow = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '3',
  fontSize: 'sm',
  color: 'gray.700',
});

export const summaryValueStrong = css({
  fontWeight: 'semibold',
  color: 'gray.900',
});

export const progressBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '2',
    py: '1',
    borderRadius: 'full',
    fontSize: 'xs',
    fontWeight: 'semibold',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  variants: {
    status: {
      neutral: {
        bg: 'gray.50',
        color: 'gray.700',
        borderColor: 'gray.100',
      },
      success: {
        bg: 'green.50',
        color: 'green.700',
        borderColor: 'green.200',
      },
      warning: {
        bg: 'amber.50',
        color: 'amber.700',
        borderColor: 'amber.200',
      },
    },
  },
  defaultVariants: {
    status: 'neutral',
  },
});

export const timeBlockList = css({
  display: 'grid',
  gap: '2',
});

export const timeBlockListItem = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  gap: '2',
  alignItems: 'center',
  p: '3',
  borderRadius: 'lg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  bg: 'white',
});

export const timeBlockListItemMain = css({
  minW: '0',
  display: 'grid',
  gap: '0.5',
});

export const timeBlockListItemLabel = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.900',
  lineHeight: '[1.3]',
});

export const timeBlockListItemSub = css({
  fontSize: 'xs',
  color: 'gray.600',
});

export const timeBlockListItemActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
});

export const miniButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '7',
  height: '7',
  px: '2',
  borderRadius: 'md',
  bg: 'transparent',
  color: 'gray.500',
  fontSize: 'xs',
  fontWeight: 'medium',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.100',
    color: 'gray.700',
  },
  _disabled: {
    opacity: '[0.4]',
    cursor: 'not-allowed',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
});

export const stickyBar = css({
  position: 'fixed',
  left: '0',
  right: '0',
  bottom: '0',
  zIndex: 'sticky',
  p: '3',
  bg: '[linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.92) 18%, rgba(255,255,255,1) 42%)]',
  backdropFilter: '[blur(8px)]',
  md: {
    display: 'none',
  },
});

export const stickyBarInner = css({
  maxW: '[920px]',
  mx: 'auto',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  bg: 'white',
  boxShadow: 'lg',
  p: '3',
  display: 'grid',
  gap: '3',
});

export const stickySummaryRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

export const stickySummaryText = css({
  fontSize: 'xs',
  color: 'gray.600',
  display: 'grid',
  gap: '0.5',
});

export const stickySummaryStrong = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.900',
});

export const stickyActions = css({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '2',
});

export const sectionStack = css({
  display: 'grid',
  gap: '4',
});

export const pendingSection = cva({
  base: {
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    pending: {
      true: {
        opacity: '[0.5]',
        pointerEvents: 'none',
      },
    },
  },
  defaultVariants: {
    pending: false,
  },
});

export const sectionHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

export const sectionTitle = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.900',
});

export const helperText = css({
  fontSize: 'xs',
  color: 'gray.600',
});

export const fieldset = css({
  display: 'grid',
  gap: '2',
});

export const fieldRow = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2',
  sm: {
    gridTemplateColumns: '1fr 1fr auto',
    alignItems: 'end',
  },
});

export const fieldLabel = css({
  display: 'grid',
  gap: '1',
  fontSize: 'xs',
  color: 'gray.700',
  fontWeight: 'medium',
});

export const input = css({
  width: 'full',
  minH: '[40px]',
  px: '3',
  py: '2',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.100',
  bg: 'white',
  color: 'gray.900',
  fontSize: 'sm',
  _focusVisible: {
    outline: 'focusRing',
  },
});

export const inlineError = css({
  fontSize: 'xs',
  color: 'error.text',
});

export const sidebarList = css({
  display: 'grid',
  gap: '2',
});

export const sidebarItemButton = cva({
  base: {
    width: 'full',
    textAlign: 'left',
    borderRadius: 'lg',
    borderWidth: '1px',
    borderStyle: 'solid',
    p: '3',
    display: 'grid',
    gap: '1',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _focusVisible: {
      outline: 'focusRing',
    },
  },
  variants: {
    state: {
      default: {
        bg: 'white',
        borderColor: 'gray.100',
        _hover: {
          bg: 'gray.50',
          borderColor: 'gray.200',
        },
      },
      selected: {
        bg: 'green.50',
        borderColor: 'green.300',
        _hover: {
          bg: 'green.100',
        },
      },
      partial: {
        bg: 'amber.50',
        borderColor: 'amber.300',
        _hover: {
          bg: 'amber.100',
        },
      },
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

export const sidebarItemTitle = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'gray.900',
  lineHeight: '[1.3]',
});

export const sidebarItemMeta = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5',
  alignItems: 'center',
  fontSize: 'xs',
  color: 'gray.600',
});

export const tagBadge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '1.5',
    py: '0.5',
    rounded: 'full',
    fontSize: '[10px]',
    fontWeight: 'semibold',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  variants: {
    tone: {
      neutral: {
        bg: 'gray.50',
        color: 'gray.700',
        borderColor: 'gray.100',
      },
      accent: {
        bg: 'blue.50',
        color: 'blue.700',
        borderColor: 'blue.200',
      },
      caution: {
        bg: 'amber.50',
        color: 'amber.700',
        borderColor: 'amber.200',
      },
      success: {
        bg: 'green.50',
        color: 'green.700',
        borderColor: 'green.200',
      },
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

export const sourceBreakdown = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  px: '1',
});

export const sourceBreakdownItem = css({
  fontSize: 'xs',
  color: 'gray.600',
});

export const recommendationGroup = css({
  display: 'grid',
  gap: '2',
});

export const recommendationGroupNote = css({
  fontSize: 'xs',
  color: 'amber.700',
  bg: 'amber.50',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'amber.200',
  px: '2.5',
  py: '2',
  rounded: 'md',
});

export const messageBox = cva({
  base: {
    rounded: 'lg',
    px: '3',
    py: '2.5',
    fontSize: 'sm',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  variants: {
    tone: {
      neutral: {
        bg: 'gray.50',
        color: 'gray.700',
        borderColor: 'gray.100',
      },
      error: {
        bg: 'red.50',
        color: 'red.700',
        borderColor: 'red.200',
      },
      success: {
        bg: 'green.50',
        color: 'green.700',
        borderColor: 'green.200',
      },
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});
