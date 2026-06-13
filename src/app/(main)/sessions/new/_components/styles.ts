import { css } from '@/styled-system/css';

// フォームカード（maxW: 800px, overflow hidden でフッターの hr がカード端まで伸びる）
export const form_card = css({
  bg: 'white',
  borderRadius: '0',
  shadow: '[none]',
  w: 'full',
  maxW: '[800px]',
  overflow: 'hidden',
  lg: {
    borderRadius: '2xl',
    shadow: 'card.default',
  },
});

// カード内部のコンテンツエリア
export const form_body = css({
  p: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
});

export const form_section = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const form_sectionHeader = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.title',
});

export const form_sectionIcon = css({
  color: 'primary.default',
  fontSize: 'xl',
});

export const form_divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
});

export const form_charCount = css({
  textAlign: 'right',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const form_optionCard = css({
  bg: 'gray.50',
  rounded: 'xl',
  p: '5',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const form_optionRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
});

export const form_optionText = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const form_optionTitle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
});

export const form_optionBadge = css({
  bg: 'green.100',
  color: 'green.700',
  fontSize: 'xs',
  fontWeight: 'medium',
  px: '3',
  py: '1',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'green.200',
});

export const form_optionDescription = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const form_optionSelect = css({
  w: '[140px]',
});

export const form_optionDivider = css({
  h: '[1px]',
  bg: 'gray.200',
});

export const form_miscGrid = css({
  display: 'grid',
  gap: '8',
  gridTemplateColumns: '1fr',
  md: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
});

export const form_miscSpan = css({
  gridColumn: '1 / -1',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const form_helperText = css({
  fontSize: 'xs',
  color: 'text.secondary',
  mt: '1.5',
  ml: '1',
});

export const form_scheduleList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const form_scheduleRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  '&[data-has-value=true]': {
    gap: '3',
  },
});

export const form_scheduleRange = css({
  display: 'grid',
  alignItems: 'center',
  gap: '2',
  gridTemplateColumns: '1fr auto 1fr',
  flex: '1',
  w: 'full',
});

export const form_scheduleRangeSeparator = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const form_scheduleInput = css({
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
});

export const form_scheduleRemoveWrap = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  maxW: '0',
  opacity: '[0]',
  overflow: 'hidden',
  pointerEvents: 'none',
  mr: '-2',
  transform: 'translateX(8px)',
  transitionProperty: '[max-width, opacity, margin, transform]',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  '[data-has-value=true] &': {
    opacity: '[1]',
    pointerEvents: 'auto',
    maxW: '9',
    mr: '0',
    transform: 'translateX(0)',
  },
});

export const form_scheduleRemoveButton = css({
  w: '9',
  h: '9',
  p: '0',
});

export const form_membersList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const form_membersEmpty = css({
  fontSize: 'sm',
  color: 'text.secondary',
  textAlign: 'center',
  py: '4',
});

export const form_submitArea = css({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const scenario_select_divider = css({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  w: 'full',
  gap: '2',
  py: '4',
  fontSize: 'sm',
  color: 'text.secondary',
});

export const divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
});

export const scenario_select_container = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '1',
  borderRadius: 'md',
  bg: 'gray.50',
});

export const scenario_select_type_tab = css({
  w: 'full',
  fontSize: 'sm',
  '&>[data-state=on]': {
    color: 'primary.default',
  },
});

export const scenario_search_button_container = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  borderWidth: '2',
  borderStyle: 'dashed',
  borderColor: 'gray.200',
  borderRadius: 'md',
});

export const scenario_loading = css({
  color: 'primary.default',
  animation: 'spin',
});

export const scenario_emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3',
  py: '8',
  borderWidth: '2',
  borderStyle: 'dashed',
  borderColor: 'gray.200',
  borderRadius: 'md',
});

export const scenario_emptyIcon = css({
  color: 'primary.default',
  opacity: '[0.5]',
});

export const scenario_comingSoon = css({
  textAlign: 'center',
  color: 'text.secondary',
  py: '6',
  fontSize: 'sm',
});

export const text_body = css({
  fontSize: 'md',
  color: 'text.body',
});

export const text_secondary = css({
  fontSize: 'sm',
  color: 'text.secondary',
});
