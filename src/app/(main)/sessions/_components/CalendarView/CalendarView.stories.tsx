import { createMySession } from '../../__mocks__/sessionMocks';
import { CalendarView } from './CalendarView';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/一覧/CalendarView',
  component: CalendarView,
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarView>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockSessions = [
  createMySession({
    gameSessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声',
    myRole: 'KEEPER',
    scheduleDate: '2026-03-20T14:00:00Z',
    scheduledAt: '2026-03-20T14:00:00Z',
  }),
  createMySession({
    gameSessionId: '01HSESSION0000000000000002',
    sessionName: '星辰の間',
    myRole: 'PLAYER',
    scheduleDate: '2026-03-25T14:00:00Z',
    scheduledAt: '2026-03-25T14:00:00Z',
  }),
  createMySession({
    gameSessionId: '01HSESSION0000000000000003',
    sessionName: '霧の彼方',
    myRole: 'PLAYER',
    scheduleDate: null,
    scheduledAt: null,
    sessionPhase: 'RECRUITING',
  }),
  createMySession({
    gameSessionId: '01HSESSION0000000000000004',
    sessionName: '闇の儀式',
    myRole: 'KEEPER',
    scheduleDate: '2026-03-20T18:00:00Z',
    scheduledAt: '2026-03-20T18:00:00Z',
  }),
];

/**
 * 複数セッション（scheduleDate あり/なし混在）
 */
export const Default: Story = {
  args: {
    sessions: mockSessions,
  },
};

/**
 * セッションが0件の空状態
 */
export const Empty: Story = {
  args: {
    sessions: [],
  },
};
