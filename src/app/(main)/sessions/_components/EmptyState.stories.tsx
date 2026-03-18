import { EmptyState } from './EmptyState';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/一覧/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  args: {
    type: 'upcoming',
  },
};

export const History: Story = {
  args: {
    type: 'history',
  },
};

export const Public: Story = {
  args: {
    type: 'public',
  },
};
