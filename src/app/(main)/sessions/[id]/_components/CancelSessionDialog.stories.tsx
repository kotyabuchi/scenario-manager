import { fn } from '@storybook/test';

import { CancelSessionDialog } from './CancelSessionDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/CancelSessionDialog',
  component: CancelSessionDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof CancelSessionDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示。危険ヘッダー + 情報ボックス + キャンセル理由（任意）フォーム。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    open: true,
  },
};
