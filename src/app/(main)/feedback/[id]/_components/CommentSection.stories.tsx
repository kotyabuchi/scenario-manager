import { mockComments } from '../../_components/_mocks';
import { CommentSection } from './CommentSection';

import { AuthProvider } from '@/context';

import type { Meta, StoryObj } from '@storybook/react';

const mockUser = {
  userId: '01JUSER00000000000000000001',
  discordId: '123456789',
  nickname: 'テストユーザー',
  avatar: null,
  role: 'MEMBER' as const,
};

const meta = {
  title: 'Feedback/Detail/CommentSection',
  component: CommentSection,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={mockUser}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Story />
        </div>
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof CommentSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ログイン済み・コメントあり */
export const Default: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    comments: mockComments,
    isLoggedIn: true,
  },
};

/** 未ログイン（投稿フォームなし） */
export const NotLoggedIn: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    comments: mockComments,
    isLoggedIn: false,
  },
};

/** コメントなし・ログイン済み */
export const EmptyLoggedIn: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    comments: [],
    isLoggedIn: true,
  },
};

/** コメントなし・未ログイン */
export const EmptyNotLoggedIn: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    comments: [],
    isLoggedIn: false,
  },
};

/** 公式コメントのみ */
export const OfficialOnly: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    comments: mockComments.filter((c) => c.isOfficial),
    isLoggedIn: true,
  },
};

/** コメント1件（ソートトグル非表示） */
export const SingleComment: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    comments: mockComments.slice(0, 1),
    isLoggedIn: true,
  },
};
