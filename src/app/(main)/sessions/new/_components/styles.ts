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
  gap: '10',
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
  p: '4',
});

export const form_scheduleRadio = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
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
  pt: '4',
});

export const scenario_emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3',
  py: '8',
  color: 'text.secondary',
  fontSize: 'sm',
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
