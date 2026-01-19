import type { InferSelectModel } from 'drizzle-orm';
import type {
  gameSchedules,
  gameSessions,
  scenarioSystems,
  scenarios,
  sessionParticipants,
  users,
} from '@/db/schema';

// Drizzleスキーマから型を導出
type GameSession = InferSelectModel<typeof gameSessions>;
type GameSchedule = InferSelectModel<typeof gameSchedules>;
type Scenario = InferSelectModel<typeof scenarios>;
type ScenarioSystem = InferSelectModel<typeof scenarioSystems>;
type SessionParticipant = InferSelectModel<typeof sessionParticipants>;
type User = InferSelectModel<typeof users>;

// 参加者（ユーザー情報付き）
type ParticipantWithUser = SessionParticipant & {
  user: User;
};

// セッション（リレーション込み）
type SessionWithRelations = GameSession & {
  scenario: Scenario & {
    system: ScenarioSystem;
  };
  schedule: GameSchedule | null;
  participants: ParticipantWithUser[];
};

// 自分のセッション（役割付き）
type MySessionWithRole = SessionWithRelations & {
  myRole: 'KEEPER' | 'PLAYER' | 'SPECTATOR';
  isReviewed?: boolean;
  hasVideo?: boolean;
};

// 公開セッション（ネタバレ保護）
type PublicSession = {
  gameSessionId: string;
  sessionName: string;
  sessionPhase: string;
  scenarioId: string;
  scenarioName: string;
  systemName: string;
  scheduleDate: Date | null;
  schedulePhase: string | null;
  keeperName: string | null;
  keeperUserId: string | null;
  participantCount: number;
  maxPlayer: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  createdAt: Date;
};

// タブの種類
type TabType = 'upcoming' | 'history' | 'public';

// 表示形式
type ViewType = 'list' | 'calendar';

// ソートオプション（公開卓）
type PublicSortOption = 'date_asc' | 'created_desc' | 'slots_desc';

// ソートオプション（参加予定）
type UpcomingSortOption = 'date_asc' | 'created_desc';

// ソートオプション（履歴）
type HistorySortOption = 'date_desc' | 'date_asc';

// 役割フィルタ
type RoleFilter = 'all' | 'keeper' | 'player' | 'spectator';

// ステータスフィルタ
type StatusFilter = 'all' | 'completed' | 'cancelled';

// セッションフェーズ
type SessionPhase =
  | 'RECRUITING'
  | 'PREPARATION'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// 公開卓検索パラメータ
type PublicSearchParams = {
  systemIds?: string[];
  phases?: SessionPhase[];
  dateFrom?: Date;
  dateTo?: Date;
  scenarioName?: string;
};

// 検索結果
type SearchResult<T> = {
  sessions: T[];
  totalCount: number;
};

// 公開卓検索結果
type PublicSearchResult = SearchResult<PublicSession>;

// カレンダー用データ
type CalendarSession = {
  gameSessionId: string;
  sessionName: string;
  sessionPhase: string;
  scenarioName: string;
  scheduleDate: Date;
  myRole: 'KEEPER' | 'PLAYER' | 'SPECTATOR';
};

type CalendarData = {
  sessions: CalendarSession[];
  unscheduledSessions: CalendarSession[];
};

export type {
  GameSession,
  GameSchedule,
  Scenario,
  ScenarioSystem,
  SessionParticipant,
  User,
  ParticipantWithUser,
  SessionWithRelations,
  MySessionWithRole,
  PublicSession,
  TabType,
  ViewType,
  PublicSortOption,
  UpcomingSortOption,
  HistorySortOption,
  RoleFilter,
  StatusFilter,
  SessionPhase,
  PublicSearchParams,
  SearchResult,
  PublicSearchResult,
  CalendarSession,
  CalendarData,
};
