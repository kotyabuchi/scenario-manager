import type {
  GameSessionRow,
  ScenarioRow,
  ScenarioSystemRow,
  TagRow,
  UserReviewRow,
  UserRow,
  VideoLinkRow,
} from '@/db/helpers';

// 基本型
type Scenario = ScenarioRow;
type ScenarioSystem = ScenarioSystemRow;
type Tag = TagRow;
type User = UserRow;
type GameSession = GameSessionRow;
type UserReview = UserReviewRow;
type VideoLink = VideoLinkRow;

// レビュー（ユーザー情報付き）
type ReviewWithUser = UserReview & {
  user: Pick<User, 'userId' | 'nickname' | 'userName' | 'image'>;
};

// セッション（GM情報・参加者数付き）
type SessionWithKeeper = Pick<
  GameSession,
  | 'gameSessionId'
  | 'sessionName'
  | 'scenarioId'
  | 'sessionPhase'
  | 'createdAt'
  | 'updatedAt'
> & {
  keeper: Pick<User, 'userId' | 'nickname' | 'image'> | null;
  participantCount: number;
  scheduleDate: string | null;
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
