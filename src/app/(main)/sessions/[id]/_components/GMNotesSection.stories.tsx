import { GMNotesSection } from './GMNotesSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/詳細/GMNotesSection',
  component: GMNotesSection,
  tags: ['autodocs'],
} satisfies Meta<typeof GMNotesSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * メモあり（通常表示）
 */
export const WithMemo: Story = {
  args: {
    memo: 'プレイヤーBの承認を忘れずに。次回までにNPCの設定を確認。',
    sessionId: '01HSESSION0000000000000001',
    showEditButton: false,
  },
};

/**
 * メモなし（空状態）
 */
export const Empty: Story = {
  args: {
    memo: null,
    sessionId: '01HSESSION0000000000000001',
    showEditButton: false,
  },
};

/**
 * メモあり + 編集ボタン表示（managerビュー）
 */
export const WithEditButton: Story = {
  args: {
    memo: 'プレイヤーBの承認を忘れずに。次回までにNPCの設定を確認。',
    sessionId: '01HSESSION0000000000000001',
    showEditButton: true,
  },
};
