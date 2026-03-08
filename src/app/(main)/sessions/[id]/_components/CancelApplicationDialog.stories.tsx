import { fn } from '@storybook/test';

import { CancelApplicationDialog } from './CancelApplicationDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/CancelApplicationDialog',
  component: CancelApplicationDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof CancelApplicationDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示。確認メッセージ + 取り消しボタン。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    open: true,
  },
};
