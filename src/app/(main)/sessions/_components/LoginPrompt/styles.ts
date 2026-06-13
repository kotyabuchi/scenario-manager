import { css } from '@/styled-system/css';

export const loginPrompt = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1',
  minH: '[400px]',
  gap: '4',
});

export const loginPromptText = css({
  fontSize: '[16px]',
  color: 'gray.500',
});
