import { css, cva } from '@/styled-system/css';

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

export const publicCard_seatWarning = css({
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
