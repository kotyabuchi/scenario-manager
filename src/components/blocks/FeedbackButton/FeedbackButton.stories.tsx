import { FeedbackButton } from './FeedbackButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/FeedbackButton',
  component: FeedbackButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeedbackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示状態
 */
export const Default: Story = {};
