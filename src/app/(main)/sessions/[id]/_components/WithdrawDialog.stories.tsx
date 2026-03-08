import { fn } from '@storybook/test';

import { WithdrawDialog } from './WithdrawDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/WithdrawDialog',
  component: WithdrawDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof WithdrawDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示。警告ボックス + 辞退理由（必須）フォーム + 文字数カウンター。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    open: true,
  },
};
