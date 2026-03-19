import { css } from '@/styled-system/css';

export const publicCardsGrid = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(auto-fill, minmax(320px, 1fr))]',
  gap: '5',
});

export const mySessionListContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});
