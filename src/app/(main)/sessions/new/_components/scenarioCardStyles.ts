import { css } from '@/styled-system/css';

export const scenarioCard = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '4',
  p: '4',
  bg: 'bg.card',
  rounded: 'lg',
  shadow: 'card.default',
  borderLeft: '[4px solid]',
  borderLeftColor: 'primary.default',
});

export const scenarioCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  minW: '[0]',
});

export const scenarioCard_system = css({
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'primary.text',
  bg: 'primary.subtle',
  px: '2',
  py: '0.5',
  rounded: 'sm',
  w: '[fit-content]',
});

export const scenarioCard_title = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.title',
  lineClamp: '[1]',
});

export const scenarioCard_meta = css({
  display: 'flex',
  gap: '3',
  mt: '1',
});

export const scenarioCard_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const scenarioCard_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  flexShrink: '[0]',
});

export const scenarioCard_changeLink = css({
  fontSize: 'sm',
  color: 'primary.default',
  cursor: 'pointer',
  bg: 'transparent',
  border: 'none',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
});
