import { fn } from '@storybook/test';

import { CancelSessionDialog } from './CancelSessionDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/詳細/ダイアログ/CancelSessionDialog',
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
 * デフォルト表示。対象セッションと注意文、キャンセル理由（任意）フォーム。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '週末CoC7版セッション',
    open: true,
  },
};
