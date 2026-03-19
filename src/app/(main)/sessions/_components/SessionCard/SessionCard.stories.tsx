import {
  createMySession,
  createPublicSession,
} from '../../__mocks__/sessionMocks';
import { SessionCard } from './SessionCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/一覧/SessionCard',
  component: SessionCard,
  tags: ['autodocs'],
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicDefault: Story = {
  args: {
    session: createPublicSession(),
    variant: 'public',
  },
};

export const PublicFewSeatsLeft: Story = {
  args: {
    session: createPublicSession({
      participantCount: 3,
      maxPlayer: 4,
      sessionName: '残席わずか！探索者募集中',
    }),
    variant: 'public',
  },
};

export const PublicNoSchedule: Story = {
  args: {
    session: createPublicSession({
      scheduleDate: null,
      schedulePhase: 'NOT_STARTED',
    }),
    variant: 'public',
  },
};

export const PublicWithSchedule: Story = {
  args: {
    session: createPublicSession({
      scheduleDate: '2026-03-20T14:00:00Z',
      schedulePhase: 'CONFIRMED',
    }),
    variant: 'public',
  },
};

export const MyUpcoming: Story = {
  args: {
    session: createMySession({
      myRole: 'KEEPER',
      sessionPhase: 'RECRUITING',
    }),
    variant: 'my',
  },
};

export const MyAsPlayer: Story = {
  args: {
    session: createMySession({
      myRole: 'PLAYER',
      sessionPhase: 'PREPARATION',
    }),
    variant: 'my',
  },
};

export const MyHistory: Story = {
  args: {
    session: createMySession({
      myRole: 'PLAYER',
      sessionPhase: 'COMPLETED',
      completedAt: '2026-03-01T18:00:00Z',
    }),
    variant: 'my',
    showMeta: true,
  },
};
