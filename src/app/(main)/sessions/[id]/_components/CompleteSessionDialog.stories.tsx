import { fn } from '@storybook/test';

import { CompleteSessionDialog } from './CompleteSessionDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/CompleteSessionDialog',
  component: CompleteSessionDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof CompleteSessionDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示。シナリオ情報カード + チェックリスト + GMメモフォーム。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    expectedUpdatedAt: '2026-01-15T10:00:00.000Z',
    scenarioName: '深淵の迷宮',
    systemName: 'クトゥルフ神話TRPG',
    scheduleLabel: '2026年3月15日',
    open: true,
  },
};

/**
 * 日程未定の場合。scheduleLabel に「日程未定」が表示される。
 */
export const WithoutSchedule: Story = {
  args: {
    sessionId: '01HSESSION0000000000000002',
    expectedUpdatedAt: '2026-01-15T10:00:00.000Z',
    scenarioName: '星の彼方の冒険',
    systemName: 'ソード・ワールド2.5',
    scheduleLabel: '日程未定',
    open: true,
  },
};

/**
 * サクセス画面。完了後のチェックマーク + レビュー誘導。
 */
export const SuccessView: Story = {
  args: {
    sessionId: '01HSESSION0000000000000003',
    expectedUpdatedAt: '2026-01-15T10:00:00.000Z',
    scenarioName: '深淵の迷宮',
    systemName: 'クトゥルフ神話TRPG',
    scheduleLabel: '2026年3月15日',
    open: true,
    initialView: 'success',
  },
};
