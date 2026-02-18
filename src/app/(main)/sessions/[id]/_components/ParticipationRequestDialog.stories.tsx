import { fn } from '@storybook/test';

import { ParticipationRequestDialog } from './ParticipationRequestDialog';

import type { Meta, StoryObj } from '@storybook/react';

// --- Meta ---

const meta = {
  title: 'Pages/Sessions/ParticipationRequestDialog',
  component: ParticipationRequestDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    // onOpenChange はストーリー全体で共有するモック関数
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ParticipationRequestDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

/**
 * デフォルト表示。ダイアログが開いた状態で、シナリオ名あり。
 * 参加タイプ（プレイヤー/観戦者）の選択と一言メッセージ入力フィールドを確認できる。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    scenarioName: '深淵の呼び声',
    open: true,
  },
};

/**
 * シナリオ名なしの表示。シナリオに紐付かないセッションの申請ダイアログ。
 * セッション情報サマリーにシナリオ行が表示されないことを確認できる。
 */
export const WithoutScenario: Story = {
  args: {
    sessionId: '01HSESSION0000000000000002',
    sessionName: 'フリーセッション - 第3回',
    scenarioName: undefined,
    open: true,
  },
};

/**
 * ダイアログが閉じた状態。open=false のときはダイアログが非表示になる。
 */
export const Closed: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    scenarioName: '深淵の呼び声',
    open: false,
  },
};
