import { TimelineSection } from './TimelineSection';

import type { Meta, StoryObj } from '@storybook/react';
import type { TimelineEvent } from '../../../../interface';

const meta = {
  title: 'Sessions/詳細/TimelineSection',
  component: TimelineSection,
  tags: ['autodocs'],
} satisfies Meta<typeof TimelineSection>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockEvents: TimelineEvent[] = [
  {
    type: 'created',
    date: '2026-02-01T10:00:00Z',
    description: 'セッション作成',
  },
  {
    type: 'applied',
    date: '2026-02-02T12:00:00Z',
    actor: { userId: '01HPLAYER000000000000000001', userName: 'プレイヤーA' },
    description: 'プレイヤーAが参加申請',
  },
  {
    type: 'approved',
    date: '2026-02-02T14:00:00Z',
    actor: { userId: '01HPLAYER000000000000000001', userName: 'プレイヤーA' },
    description: 'プレイヤーAの参加を承認',
  },
];

const allTypeEvents: TimelineEvent[] = [
  ...mockEvents,
  {
    type: 'date_confirmed',
    date: '2026-02-15T10:00:00Z',
    description: '開催日程を確定',
  },
  {
    type: 'completed',
    date: '2026-03-01T18:00:00Z',
    description: 'セッション完了',
  },
];

/**
 * 基本的なタイムライン（created, applied, approved の3イベント）
 */
export const Default: Story = {
  args: {
    events: mockEvents,
  },
};

/**
 * 全5種類のイベント（created, applied, approved, date_confirmed, completed）
 */
export const AllTypes: Story = {
  args: {
    events: allTypeEvents,
  },
};

/**
 * イベントが0件の空状態
 */
export const Empty: Story = {
  args: {
    events: [],
  },
};
