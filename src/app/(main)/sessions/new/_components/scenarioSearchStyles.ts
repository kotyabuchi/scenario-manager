import { css } from '@/styled-system/css';

export const searchArea = css({
  display: 'flex',
  gap: '3',
  mb: '4',
});

export const searchArea_input = css({
  flex: '[1]',
});

export const searchArea_select = css({
  w: '[200px]',
  flexShrink: '[0]',
});

export const scenarioList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  maxH: '[400px]',
  overflowY: 'auto',
});

export const scenarioList_empty = css({
  textAlign: 'center',
  color: 'text.secondary',
  py: '8',
  fontSize: 'sm',
});

export const scenarioList_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  p: '3',
  rounded: 'md',
  cursor: 'pointer',
  bg: 'transparent',
  border: 'none',
  w: 'full',
  textAlign: 'left',
  transition: 'background',
  _hover: {
    bg: 'primary.subtleHover',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
  '&[data-selected="true"]': {
    bg: 'primary.subtle',
  },
});

export const scenarioList_itemContent = css({
  flex: '[1]',
  minW: '[0]',
});

export const scenarioList_itemName = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.title',
  lineClamp: '[1]',
});

export const scenarioList_itemSystem = css({
  fontSize: 'xs',
  color: 'primary.text',
  bg: 'primary.subtle',
  px: '1.5',
  py: '0.5',
  rounded: 'sm',
  display: 'inline-block',
  mb: '1',
});

export const scenarioList_itemMeta = css({
  display: 'flex',
  gap: '3',
  mt: '0.5',
});

export const scenarioList_itemMetaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const footer = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
});
