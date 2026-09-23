import { css } from '@/styled-system/css';

export const container = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  width: 'full',
  maxW: '[720px]',
  mx: 'auto',
  px: '6',
  py: '12',
});

export const header = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const title = css({
  color: 'text.title',
  fontSize: '3xl',
  fontWeight: 'bold',
  lineHeight: 'tight',
});

export const description = css({
  color: 'text.body',
  fontSize: 'md',
  lineHeight: 'relaxed',
});

export const section = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const sectionTitle = css({
  color: 'text.title',
  fontSize: 'lg',
  fontWeight: 'semibold',
});

export const copyright = css({
  color: 'text.secondary',
  fontSize: 'sm',
});

export const scenarioLink = css({
  alignSelf: 'flex-start',
  color: 'primary.text',
  fontSize: 'sm',
  fontWeight: 'medium',
  textDecoration: 'underline',
  textUnderlineOffset: '[3px]',
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[3px]',
  },
});
