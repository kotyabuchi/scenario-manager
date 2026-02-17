import { VoteButton } from './VoteButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Feedback/VoteButton',
  component: VoteButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VoteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 未投票（sm） */
export const Default: Story = {
  args: {
    feedbackId: 'feedback-1',
    initialHasVoted: false,
    initialVoteCount: 12,
    size: 'sm',
  },
};

/** 投票済み（sm） */
export const Voted: Story = {
  args: {
    feedbackId: 'feedback-1',
    initialHasVoted: true,
    initialVoteCount: 42,
    size: 'sm',
  },
};

/** 未投票（md） */
export const MediumDefault: Story = {
  args: {
    feedbackId: 'feedback-1',
    initialHasVoted: false,
    initialVoteCount: 7,
    size: 'md',
  },
};

/** 投票済み（md） */
export const MediumVoted: Story = {
  args: {
    feedbackId: 'feedback-1',
    initialHasVoted: true,
    initialVoteCount: 128,
    size: 'md',
  },
};

/** 投票数0 */
export const ZeroVotes: Story = {
  args: {
    feedbackId: 'feedback-1',
    initialHasVoted: false,
    initialVoteCount: 0,
    size: 'sm',
  },
};
