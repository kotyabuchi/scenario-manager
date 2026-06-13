import { css } from '@/styled-system/css';

export const searchPanel = css({
  bg: 'white',
  shadow: '[0 2px 4px rgba(0, 0, 0, 0.05)]',
  py: '6',
  px: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const searchPanel_row = css({
  display: 'flex',
  gap: '4',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
});

export const searchPanel_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  border: 'none',
  padding: '0',
  margin: '0',
});

export const searchPanel_fieldSearchButton = css({
  w: '[100px]',
});

export const searchPanel_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.500',
});

export const searchPanel_systemField = css({
  width: '[200px]',
  flexShrink: '0',
});

export const searchPanel_dateField = css({
  width: '[280px]',
  flexShrink: '0',
});

export const searchPanel_statusField = css({
  width: '[160px]',
  flexShrink: '0',
});

export const searchPanel_scenarioField = css({
  flex: '[1]',
  minWidth: '0',
});

export const searchPanel_submitButton = css({
  width: 'full',
});

export const searchPanel_dateRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const searchPanel_dateSep = css({
  fontSize: '[14px]',
  color: 'gray.500',
});
