import type { InferSelectModel } from 'drizzle-orm';
import type {
  gameSessions,
  scenarioSystems,
  scenarios,
  tags,
  userReviews,
  userScenarioPreferences,
  users,
  videoLinks,
} from '@/db/schema';

// Drizzleスキーマから型を導出
type Scenario = InferSelectModel<typeof scenarios>;
type ScenarioSystem = InferSelectModel<typeof scenarioSystems>;
type Tag = InferSelectModel<typeof tags>;
type User = InferSelectModel<typeof users>;
type GameSession = InferSelectModel<typeof gameSessions>;
type UserReview = InferSelectModel<typeof userReviews>;
type VideoLink = InferSelectModel<typeof videoLinks>;
type UserScenarioPreference = InferSelectModel<typeof userScenarioPreferences>;

// レビュー（ユーザー情報付き）
type ReviewWithUser = UserReview & {
  user: Pick<User, 'userId' | 'nickname' | 'userName' | 'image'>;
};

// セッション（GM情報・参加者数付き）
type SessionWithKeeper = GameSession & {
  keeper: Pick<User, 'userId' | 'nickname' | 'image'> | null;
  participantCount: number;
  scheduleDate: Date | null;
};

// 動画リンク（セッション情報付き）
type VideoLinkWithSession = VideoLink & {
  session: Pick<GameSession, 'gameSessionId'>;
  user: Pick<User, 'userId' | 'nickname'>;
};

// シナリオ詳細（全リレーション込み）
type ScenarioDetail = Scenario & {
  system: ScenarioSystem;
  tags: Tag[];
  avgRating: number | null;
  reviewCount: number;
};

// ユーザーの経験情報
type UserPreference = {
  isLike: boolean;
  isPlayed: boolean;
  isWatched: boolean;
  canKeeper: boolean;
  hadScenario: boolean;
};

// レビューソートオプション
type ReviewSortOption = 'newest' | 'rating_high' | 'rating_low';

// レビューフィルタオプション
type ReviewFilterOption = 'all' | 'with_rating' | 'hidden';

// ページデータ
type ScenarioDetailPageData = {
  scenario: ScenarioDetail;
  reviews: ReviewWithUser[];
  sessions: SessionWithKeeper[];
  videoLinks: VideoLinkWithSession[];
  userPreference: UserPreference | null;
};

// コンポーネントProps
type ReviewCardProps = {
  review: ReviewWithUser;
  isOwner: boolean;
  onHide?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
};

type ReviewListProps = {
  reviews: ReviewWithUser[];
  currentUserId?: string;
  hiddenReviewIds: string[];
  showHiddenReviews: boolean;
  sortOption: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  onToggleHidden: () => void;
  onHideReview: (reviewId: string) => void;
  onShowReview: (reviewId: string) => void;
};

type SessionCardProps = {
  session: SessionWithKeeper;
};

type VideoCardProps = {
  video: VideoLinkWithSession;
  showSpoiler: boolean;
};

export type {
  Scenario,
  ScenarioSystem,
  Tag,
  User,
  GameSession,
  UserReview,
  VideoLink,
  UserScenarioPreference,
  ReviewWithUser,
  SessionWithKeeper,
  VideoLinkWithSession,
  ScenarioDetail,
  UserPreference,
  ReviewSortOption,
  ReviewFilterOption,
  ScenarioDetailPageData,
  ReviewCardProps,
  ReviewListProps,
  SessionCardProps,
  VideoCardProps,
};
