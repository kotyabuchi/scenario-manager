import {
  createMySession,
  createPublicSession,
} from '../__mocks__/sessionMocks';
import { SessionList } from './SessionList';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/一覧/SessionList',
  component: SessionList,
  tags: ['autodocs'],
} satisfies Meta<typeof SessionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicSessions: Story = {
  args: {
    sessions: [
      createPublicSession(),
      createPublicSession({
        gameSessionId: '01HSESSION0000000000000002',
        sessionName: '星辰の間 - 新規卓',
        scenarioName: '星辰の間',
        systemName: 'インセイン',
        participantCount: 1,
        maxPlayer: 3,
      }),
      createPublicSession({
        gameSessionId: '01HSESSION0000000000000003',
        sessionName: '毒入りスープ - 初心者歓迎',
        scenarioName: '毒入りスープ',
        participantCount: 0,
        maxPlayer: 2,
      }),
    ],
    variant: 'public',
  },
};

export const MySessions: Story = {
  args: {
    sessions: [
      createMySession({
        myRole: 'KEEPER',
        sessionPhase: 'RECRUITING',
      }),
      createMySession({
        gameSessionId: '01HSESSION0000000000000002',
        sessionName: '星辰の間',
        myRole: 'PLAYER',
        sessionPhase: 'PREPARATION',
      }),
    ],
    variant: 'my',
  },
};

export const EmptyList: Story = {
  args: {
    sessions: [],
    variant: 'public',
  },
};
