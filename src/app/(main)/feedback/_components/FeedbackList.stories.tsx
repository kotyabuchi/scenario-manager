import { fn } from '@storybook/test';

import { mockFeedbackList } from './_mocks';
import { FeedbackList } from './FeedbackList';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Feedback/FeedbackList',
  component: FeedbackList,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeedbackList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 複数のフィードバックカード */
export const Default: Story = {
  args: {
    feedbacks: mockFeedbackList,
    hasFilters: false,
  },
};

/** フィルタ適用中で結果あり */
export const WithFilters: Story = {
  args: {
    feedbacks: mockFeedbackList.slice(0, 2),
    hasFilters: true,
    onReset: fn(),
  },
};

/** フィルタ適用中で結果なし */
export const EmptyWithFilters: Story = {
  args: {
    feedbacks: [],
    hasFilters: true,
    onReset: fn(),
  },
};

/** フィードバックが一件もない状態 */
export const EmptyNoFilters: Story = {
  args: {
    feedbacks: [],
    hasFilters: false,
  },
};

/** カード1件のみ */
export const SingleItem: Story = {
  args: {
    feedbacks: mockFeedbackList.slice(0, 1),
    hasFilters: false,
  },
};
