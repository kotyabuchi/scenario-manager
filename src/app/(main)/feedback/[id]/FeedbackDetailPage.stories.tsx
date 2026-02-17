import {
  mockComments,
  mockFeedbackDetail,
  mockMergedFeedbackDetail,
} from '../_components/_mocks';
import { ActionSection } from './_components/ActionSection';
import { AdminSection } from './_components/AdminSection';
import { CommentSection } from './_components/CommentSection';
import { FeedbackDetailContent } from './_components/FeedbackDetailContent';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader/PageHeader';
import { AuthProvider } from '@/context';

import type { Meta, StoryObj } from '@storybook/react';
import type { Route } from 'next';
import type { FeedbackDetail } from '../interface';

const mockUser = {
  userId: '01JUSER00000000000000000001',
  discordId: '123456789',
  nickname: 'テストユーザー',
  avatar: null,
  role: 'MEMBER' as const,
};

type FeedbackDetailPageProps = {
  feedback: FeedbackDetail;
  isAuthor: boolean;
  isModerator: boolean;
  isLoggedIn: boolean;
};

/**
 * フィードバック詳細ページの全体レイアウト。
 * page.tsx (Server Component) が組み立てる構成を再現。
 */
const FeedbackDetailPageLayout = ({
  feedback,
  isAuthor,
  isModerator,
  isLoggedIn,
}: FeedbackDetailPageProps) => (
  <>
    <PageHeader backHref={'/feedback' as Route} title="フィードバック詳細" />
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <FeedbackDetailContent feedback={feedback} />

        <ActionSection
          feedbackId={feedback.feedbackId}
          isAuthor={isAuthor}
          status={feedback.status}
          feedback={{
            category: feedback.category,
            title: feedback.title,
            description: feedback.description,
          }}
        />

        {isModerator && (
          <AdminSection
            feedbackId={feedback.feedbackId}
            currentStatus={feedback.status}
            currentPriority={feedback.priority}
            currentAdminNote={feedback.adminNote}
          />
        )}

        <CommentSection
          feedbackId={feedback.feedbackId}
          comments={feedback.comments}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  </>
);

const meta = {
  title: 'Feedback/Page/FeedbackDetailPage',
  component: FeedbackDetailPageLayout,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={mockUser}>
        <Story />
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof FeedbackDetailPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 管理者として閲覧（全セクション表示） */
export const AsModerator: Story = {
  args: {
    feedback: mockFeedbackDetail,
    isAuthor: false,
    isModerator: true,
    isLoggedIn: true,
  },
};

/** 投稿者として閲覧（編集・削除ボタン表示） */
export const AsAuthor: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      status: 'NEW',
    },
    isAuthor: true,
    isModerator: false,
    isLoggedIn: true,
  },
};

/** 一般ユーザーとして閲覧 */
export const AsUser: Story = {
  args: {
    feedback: mockFeedbackDetail,
    isAuthor: false,
    isModerator: false,
    isLoggedIn: true,
  },
};

/** 未ログインユーザー（コメント投稿不可） */
export const AsGuest: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      hasVoted: false,
      voteCount: 10,
    },
    isAuthor: false,
    isModerator: false,
    isLoggedIn: false,
  },
};

/** 統合済みフィードバック */
export const MergedFeedback: Story = {
  args: {
    feedback: mockMergedFeedbackDetail,
    isAuthor: false,
    isModerator: true,
    isLoggedIn: true,
  },
};

/** コメントなし */
export const NoComments: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      commentCount: 0,
      comments: [],
    },
    isAuthor: false,
    isModerator: true,
    isLoggedIn: true,
  },
};

/** バグ報告（対応中） */
export const BugInProgress: Story = {
  args: {
    feedback: {
      ...mockFeedbackDetail,
      category: 'BUG',
      status: 'IN_PROGRESS',
      title: 'シナリオ検索でタグフィルタが正しく動作しない',
      comments: mockComments.slice(0, 1),
      commentCount: 1,
    },
    isAuthor: false,
    isModerator: true,
    isLoggedIn: true,
  },
};
