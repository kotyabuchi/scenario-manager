import {
  cancelledSession,
  completedSession,
  emptySession,
  inProgressSession,
  mockSession,
  mockTimeline,
  preparationSession,
} from '../__mocks__/detailMocks';
import { SessionDetailContent } from './SessionDetailContent';

import type { Meta, StoryObj } from '@storybook/react';

// --- Meta ---

const meta = {
  title: 'Sessions/詳細/SessionDetailContent',
  component: SessionDetailContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SessionDetailContent>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

/**
 * 基本的な表示。managerロールで参加者3人、タイムライン3件。
 */
export const Default: Story = {
  args: {
    session: mockSession,
    timeline: mockTimeline,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

/**
 * participantロールで表示。編集ボタン・GMメモは非表示。
 */
export const AsParticipant: Story = {
  args: {
    session: mockSession,
    timeline: mockTimeline,
    userRole: 'participant',
    currentUserId: '01HPLAYER000000000000000001',
  },
};

/**
 * guestロールで表示。編集ボタン・GMメモは非表示。
 */
export const AsGuest: Story = {
  args: {
    session: mockSession,
    timeline: mockTimeline,
    userRole: 'guest',
    currentUserId: null,
  },
};

/**
 * 参加者0人、タイムライン0件、リンク0件の空状態。
 */
export const Empty: Story = {
  args: {
    session: emptySession,
    timeline: [],
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

/**
 * 準備中フェーズ。日程確定済み。
 */
export const Preparation: Story = {
  args: {
    session: preparationSession,
    timeline: mockTimeline,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

/**
 * セッション進行中フェーズ。
 */
export const InProgress: Story = {
  args: {
    session: inProgressSession,
    timeline: mockTimeline,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

/**
 * 完了フェーズ。完了メモあり。
 */
export const Completed: Story = {
  args: {
    session: completedSession,
    timeline: mockTimeline,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

/**
 * キャンセルフェーズ。キャンセル理由あり。
 */
export const Cancelled: Story = {
  args: {
    session: cancelledSession,
    timeline: mockTimeline,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};
