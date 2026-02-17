import type { FeedbackCommentRow, FeedbackRow, UserRow } from '@/db/helpers';

// ユーザー情報（一覧・詳細で表示する最小限のフィールド）
type FeedbackUser = Pick<UserRow, 'userId' | 'nickname' | 'image'>;

// 一覧カード用
type FeedbackWithUser = FeedbackRow & {
  user: FeedbackUser;
  commentCount: number;
  hasVoted: boolean;
};

// コメント + ユーザー情報
type CommentWithUser = FeedbackCommentRow & {
  user: FeedbackUser;
};

// 詳細用
type FeedbackDetail = FeedbackRow & {
  user: FeedbackUser;
  comments: CommentWithUser[];
  hasVoted: boolean;
  mergedCount: number;
};

// 検索結果
type FeedbackSearchResult = {
  feedbacks: FeedbackWithUser[];
  totalCount: number;
};

// ソートオプション
type FeedbackSortOption = 'votes' | 'newest' | 'comments';

// 検索パラメータ
type FeedbackSearchParams = {
  category?: string;
  statuses?: string[];
  q?: string;
  mine?: boolean;
  userId?: string;
};

export type {
  FeedbackUser,
  FeedbackWithUser,
  CommentWithUser,
  FeedbackDetail,
  FeedbackSearchResult,
  FeedbackSortOption,
  FeedbackSearchParams,
};
