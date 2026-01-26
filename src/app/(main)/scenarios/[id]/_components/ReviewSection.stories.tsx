import { ReviewSection } from './ReviewSection';

import type { Meta, StoryObj } from '@storybook/react';
import type { ReviewWithUser } from '../interface';

const meta = {
  title: 'Scenarios/Detail/ReviewSection',
  component: ReviewSection,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'gray',
      values: [{ name: 'gray', value: '#F9FAFB' }],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ
const mockReviews: ReviewWithUser[] = [
  {
    userReviewId: 'review-1',
    userId: 'user-1',
    scenarioId: 'scenario-1',
    sessionId: 'session-1',
    rating: 5,
    openComment:
      '素晴らしいシナリオでした！初心者でも楽しめる内容で、GMも回しやすかったです。謎解き要素と戦闘のバランスが絶妙でした。',
    spoilerComment:
      '最後のどんでん返しは全員が驚いていました。NPCの正体が明かされるシーンは特に盛り上がりましたね。',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    user: {
      userId: 'user-1',
      nickname: 'たろう',
      userName: 'taro123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taro',
    },
  },
  {
    userReviewId: 'review-2',
    userId: 'user-2',
    scenarioId: 'scenario-1',
    sessionId: 'session-2',
    rating: 4,
    openComment:
      '全体的に楽しめました。ストーリーがしっかりしていて、ロールプレイしがいがあります。',
    spoilerComment: null,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    user: {
      userId: 'user-2',
      nickname: 'はなこ',
      userName: 'hanako_trpg',
      image: null,
    },
  },
  {
    userReviewId: 'review-3',
    userId: 'user-3',
    scenarioId: 'scenario-1',
    sessionId: 'session-3',
    rating: 3,
    openComment:
      '普通に楽しめるシナリオです。特筆すべき点は少ないですが、安定した内容。',
    spoilerComment:
      '中盤の展開がやや冗長に感じました。もう少しテンポよく進められると良いかも。',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    user: {
      userId: 'user-3',
      nickname: 'じろう',
      userName: 'jiro_gm',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jiro',
    },
  },
  {
    userReviewId: 'review-4',
    userId: 'user-4',
    scenarioId: 'scenario-1',
    sessionId: null,
    rating: null,
    openComment:
      'まだプレイしていませんが、期待大です！友人のおすすめで気になっています。',
    spoilerComment: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: {
      userId: 'user-4',
      nickname: 'さぶろう',
      userName: 'saburo',
      image: null,
    },
  },
  {
    userReviewId: 'review-5',
    userId: 'user-5',
    scenarioId: 'scenario-1',
    sessionId: 'session-5',
    rating: 5,
    openComment:
      '何度遊んでも楽しい！GMとしても3回、PLとしても2回遊びましたが、毎回違った展開になります。',
    spoilerComment:
      'マルチエンディングの分岐条件がよく練られています。バッドエンドも含めてすべて見たくなる。',
    createdAt: new Date('2023-12-25'),
    updatedAt: new Date('2023-12-25'),
    user: {
      userId: 'user-5',
      nickname: 'しろう',
      userName: 'shiro_keeper',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shiro',
    },
  },
];

/**
 * 複数のレビューがある状態
 */
export const Default: Story = {
  args: {
    reviews: mockReviews,
    totalCount: mockReviews.length,
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};

/**
 * 自分のレビューがある状態（編集ボタン表示）
 */
export const WithOwnReview: Story = {
  args: {
    reviews: mockReviews,
    totalCount: mockReviews.length,
    currentUserId: 'user-1',
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};

/**
 * レビューが1件のみ
 */
export const SingleReview: Story = {
  args: {
    reviews: mockReviews.slice(0, 1),
    totalCount: 1,
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};

/**
 * レビューがない状態（プレイ済み - レビュー投稿を促す）
 */
export const EmptyPlayed: Story = {
  args: {
    reviews: [],
    totalCount: 0,
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};

/**
 * レビューがない状態（未プレイ）
 */
export const EmptyNotPlayed: Story = {
  args: {
    reviews: [],
    totalCount: 0,
    scenarioId: 'scenario-1',
    isPlayed: false,
  },
};

/**
 * 高評価レビューのみ
 */
export const HighRatings: Story = {
  args: {
    reviews: mockReviews.filter((r) => r.rating && r.rating >= 4),
    totalCount: 3,
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};

/**
 * 評価なしレビューのみ
 */
export const NoRatings: Story = {
  args: {
    reviews: mockReviews.filter((r) => r.rating === null),
    totalCount: 1,
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};

/**
 * もっと見るボタン表示（件数が多い場合）
 */
export const WithLoadMore: Story = {
  args: {
    reviews: mockReviews.slice(0, 3),
    totalCount: 15,
    scenarioId: 'scenario-1',
    isPlayed: true,
  },
};
