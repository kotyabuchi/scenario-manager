import type {
  GameScheduleRow,
  GameScheduleSlotRow,
  GameSessionRow,
  ScenarioRow,
  ScenarioSystemRow,
  SessionLinkRow,
  SessionParticipantRow,
  UserRow,
} from '@/db/helpers';
import type { Database } from '@/db/types';

// 基本型
type GameSession = GameSessionRow;
type GameSchedule = GameScheduleRow;
type GameScheduleSlot = GameScheduleSlotRow;
type Scenario = ScenarioRow;
type ScenarioSystem = ScenarioSystemRow;
type SessionParticipant = SessionParticipantRow;
type User = UserRow;
type SessionLink = SessionLinkRow;

// 参加者（ユーザー情報付き）
type ParticipantWithUser = SessionParticipant & {
  user: User;
};

// タイムラインイベント
type TimelineEvent = {
  type: 'created' | 'applied' | 'approved' | 'date_confirmed' | 'completed';
  date: string;
  actor?: Pick<User, 'userId' | 'userName'>;
  description: string;
};

// セッション詳細ページ用の統合型
type SessionDetail = GameSession & {
  scenario:
    | (Scenario & {
        system: ScenarioSystem;
      })
    | null;
  schedule: GameSchedule | null;
  scheduleSlots: GameScheduleSlot[];
  participants: ParticipantWithUser[];
  links: SessionLink[];
  keeper: Pick<User, 'userId' | 'userName'> | null;
  creator: Pick<User, 'userId' | 'userName'>;
};

// セッション（リレーション込み）
type SessionWithRelations = GameSession & {
  scenario:
    | (Scenario & {
        system: ScenarioSystem;
      })
    | null;
  schedule: GameSchedule | null;
  scheduleSlots: GameScheduleSlot[];
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
  scheduleDate: string | null;
  schedulePhase: string | null;
  keeperName: string | null;
  keeperUserId: string | null;
  participantCount: number;
  maxPlayer: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  createdAt: string;
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

// 役割フィルタ（複数選択）
type RoleFilterValue = 'keeper' | 'player' | 'spectator';

// ステータスフィルタ（複数選択）
type StatusFilterValue = 'completed' | 'cancelled';

// セッションフェーズ（Supabase生成型から導出: SSoT）
type SessionPhase = Database['public']['Enums']['session_phase'];

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
  scheduleDate: string | null;
  myRole: 'KEEPER' | 'PLAYER' | 'SPECTATOR';
};

type CalendarData = {
  sessions: CalendarSession[];
  unscheduledSessions: CalendarSession[];
};

export type {
  GameSession,
  GameSchedule,
  GameScheduleSlot,
  Scenario,
  ScenarioSystem,
  SessionParticipant,
  User,
  SessionLink,
  ParticipantWithUser,
  TimelineEvent,
  SessionDetail,
  SessionWithRelations,
  MySessionWithRole,
  PublicSession,
  TabType,
  ViewType,
  PublicSortOption,
  UpcomingSortOption,
  HistorySortOption,
  RoleFilterValue,
  StatusFilterValue,
  SessionPhase,
  PublicSearchParams,
  SearchResult,
  PublicSearchResult,
  CalendarSession,
  CalendarData,
};

/** ユーザーのセッションにおける役割 */
export type UserRole = 'manager' | 'participant' | 'guest';
