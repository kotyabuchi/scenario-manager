import { fn } from '@storybook/test';

import { ApplicationCard } from './ApplicationCard';

import type { Meta, StoryObj } from '@storybook/react';
import type { ApplicationWithUser } from '../adapter';

const baseApplication: ApplicationWithUser = {
  sessionId: '01HSESSION0000000000000001',
  userId: '01HUSER0000000000000000001',
  participantType: 'PLAYER',
  participantStatus: 'PENDING',
  applicationMessage: null,
  appliedAt: '2026-02-10T12:00:00Z',
  approvedAt: null,
  user: {
    userId: '01HUSER0000000000000000001',
    userName: 'testuser01',
    nickname: 'テストユーザー01',
    image: null,
    bio: null,
  },
};

const meta = {
  title: 'Sessions/参加申請管理/ApplicationCard',
  component: ApplicationCard,
  tags: ['autodocs'],
  args: {
    sessionId: '01HSESSION0000000000000001',
    onStatusChange: fn(),
  },
} satisfies Meta<typeof ApplicationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  name: 'Pending（承認待ち）',
  args: {
    application: {
      ...baseApplication,
      participantStatus: 'PENDING',
    },
  },
};

export const Confirmed: Story = {
  name: 'Confirmed（承認済み）',
  args: {
    application: {
      ...baseApplication,
      userId: '01HUSER0000000000000000002',
      participantStatus: 'CONFIRMED',
      approvedAt: '2026-02-11T09:00:00Z',
      user: {
        userId: '01HUSER0000000000000000002',
        userName: 'approveduser',
        nickname: '承認済みユーザー',
        image: null,
        bio: null,
      },
    },
    optimisticStatus: 'CONFIRMED',
  },
};

export const WithMessage: Story = {
  name: 'WithMessage（申請メッセージ付き）',
  args: {
    application: {
      ...baseApplication,
      userId: '01HUSER0000000000000000003',
      participantStatus: 'PENDING',
      applicationMessage:
        'クトゥルフ神話TRPGは初めてですが、ぜひ参加させてください！ホラーシナリオが好きで、雰囲気を大切にロールプレイします。',
      user: {
        userId: '01HUSER0000000000000000003',
        userName: 'newcomer',
        nickname: '新参者',
        image: null,
        bio: null,
      },
    },
  },
};
