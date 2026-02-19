import { css } from '@/styled-system/css';

export const form = css({
  bg: 'bg.card',
  shadow: 'card.default',
  rounded: '2xl',
  maxW: '[720px]',
  mx: 'auto',
  p: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
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
  borderTop: '[1px solid]',
  borderColor: 'border.subtle',
  my: '6',
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
