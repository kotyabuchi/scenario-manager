import {
  mockFeedbackDetail,
  mockMergedFeedbackDetail,
} from '../../_components/_mocks';
import { FeedbackDetailContent } from './FeedbackDetailContent';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Feedback/Detail/FeedbackDetailContent',
  component: FeedbackDetailContent,
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
} satisfies Meta<typeof FeedbackDetailContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常の詳細表示（投票済み、マージ済み件数あり） */
export const Default: Story = {
  args: {
    feedback: mockFeedbackDetail,
  },
};

/** 未投票状態 */
export const NotVoted: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      hasVoted: false,
      voteCount: 10,
    },
  },
};

/** 重複としてマージされたフィードバック */
export const Merged: Story = {
  args: {
    feedback: mockMergedFeedbackDetail,
  },
};

/** マージ件数なし */
export const NoMergedCount: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      mergedCount: 0,
    },
  },
};

/** バグ報告カテゴリ */
export const BugCategory: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      category: 'BUG' as const,
      status: 'IN_PROGRESS' as const,
      title: 'シナリオ検索でタグフィルタが正しく動作しない',
    },
  },
};

/** 短い説明文 */
export const ShortDescription: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      description: 'ダークモードが欲しいです。',
    },
  },
};
