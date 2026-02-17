import { mockCompletedSession, mockUpcomingSessions } from './_mocks';
import { UpcomingSessions } from './UpcomingSessions';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Dashboard/UpcomingSessions',
  component: UpcomingSessions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UpcomingSessions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 3件のセッション（募集中・準備中・進行中） */
export const Default: Story = {
  args: {
    sessions: mockUpcomingSessions,
  },
};

/** セッションなし（空状態） */
export const Empty: Story = {
  args: {
    sessions: [],
  },
};

/** 1件のみ */
export const SingleSession: Story = {
  args: {
    sessions: mockUpcomingSessions.slice(0, 1),
  },
};

/** 完了済みセッションを含む */
export const WithCompleted: Story = {
  args: {
    sessions: [...mockUpcomingSessions, mockCompletedSession],
  },
};
