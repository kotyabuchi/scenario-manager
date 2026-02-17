import {
  mockBugFeedback,
  mockDoneFeedback,
  mockFeatureFeedback,
  mockUIFeedback,
} from './_mocks';
import { FeedbackCard } from './FeedbackCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Feedback/FeedbackCard',
  component: FeedbackCard,
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
} satisfies Meta<typeof FeedbackCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 機能要望 - 投票済み・多数投票 */
export const FeatureVoted: Story = {
  args: {
    feedback: mockFeatureFeedback,
  },
};

/** バグ報告 - 未投票 */
export const BugReport: Story = {
  args: {
    feedback: mockBugFeedback,
  },
};

/** UI/UX改善 - アバターなし */
export const UIUXNoAvatar: Story = {
  args: {
    feedback: mockUIFeedback,
  },
};

/** 完了済み - 高投票数 */
export const Completed: Story = {
  args: {
    feedback: mockDoneFeedback,
  },
};

/** 説明文なし */
export const NoDescription: Story = {
  args: {
    feedback: {
      ...mockFeatureFeedback,
      description: '',
    },
  },
};

/** 長いタイトル */
export const LongTitle: Story = {
  args: {
    feedback: {
      ...mockFeatureFeedback,
      title:
        'セッション募集画面でプレイヤー人数やプレイ時間のフィルタリングを行った際にシステム名が長いシナリオが正しく表示されない不具合について',
    },
  },
};
