import { fn } from '@storybook/test';

import { ParticipationRequestDialog } from './ParticipationRequestDialog';

import type { Meta, StoryObj } from '@storybook/react';

// --- Meta ---

const meta = {
  title: 'Sessions/詳細/ダイアログ/ParticipationRequestDialog',
  component: ParticipationRequestDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ParticipationRequestDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

/**
 * デフォルト表示。GM未設定のセッションで、KEEPER/PLAYER/SPECTATOR の3択が表示される。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    scenarioName: '深淵の呼び声',
    hasKeeper: false,
    participantCount: 2,
    maxParticipantCount: 5,
    scheduleLabel: 'メンバー決定後に調整',
    open: true,
  },
};

/**
 * GM設定済みの場合。KEEPER選択肢が非表示になり、PLAYER/SPECTATOR の2択のみ。
 */
export const WithKeeper: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    scenarioName: '深淵の呼び声',
    hasKeeper: true,
    participantCount: 3,
    maxParticipantCount: 5,
    scheduleLabel: '2026/3/15',
    open: true,
  },
};

/**
 * シナリオ名なしの表示。シナリオに紐付かないセッションの申請ダイアログ。
 */
export const WithoutScenario: Story = {
  args: {
    sessionId: '01HSESSION0000000000000002',
    sessionName: 'フリーセッション - 第3回',
    scenarioName: undefined,
    hasKeeper: false,
    participantCount: 0,
    maxParticipantCount: 4,
    scheduleLabel: 'メンバー決定後に調整',
    open: true,
  },
};

/**
 * 日程調整中の表示。
 */
export const ScheduleAdjusting: Story = {
  args: {
    sessionId: '01HSESSION0000000000000003',
    sessionName: '狂気山脈セッション',
    scenarioName: '狂気山脈 〜邪神の山嵐〜',
    hasKeeper: true,
    participantCount: 4,
    maxParticipantCount: 5,
    scheduleLabel: '日程調整中',
    open: true,
  },
};

/**
 * ダイアログが閉じた状態。
 */
export const Closed: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    scenarioName: '深淵の呼び声',
    hasKeeper: false,
    participantCount: 2,
    maxParticipantCount: 5,
    scheduleLabel: 'メンバー決定後に調整',
    open: false,
  },
};
