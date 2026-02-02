import { css } from '@/styled-system/css';

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const applicantInfo = css({
  bg: '[surface.subtle]',
  rounded: 'lg',
  p: '4',
});

export const applicantHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: '3',
});

export const applicantName = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: '[text.default]',
});

export const appliedAt = css({
  fontSize: 'sm',
  color: '[text.muted]',
});

export const messageSection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: '[text.muted]',
});

export const applicantMessage = css({
  color: '[text.default]',
  whiteSpace: 'pre-wrap',
  lineHeight: '[1.6]',
});

export const noMessage = css({
  color: '[text.muted]',
  fontStyle: 'italic',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const textarea = css({
  px: '3',
  py: '2',
  rounded: 'md',
  bg: '[surface.input]',
  border: 'none',
  outline: 'none',
  color: '[text.default]',
  minH: '[80px]',
  resize: 'vertical',
  _placeholder: {
    color: '[text.placeholder]',
  },
  _focus: {
    ring: '[2]',
    ringColor: '[primary.500]',
  },
});
