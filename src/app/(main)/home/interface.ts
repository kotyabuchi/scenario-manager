import type { InferSelectModel } from 'drizzle-orm';
import type {
  gameSessions,
  scenarioSystems,
  scenarios,
  sessionParticipants,
  tags,
  users,
} from '@/db/schema';

// Drizzleスキーマから型を導出
type GameSession = InferSelectModel<typeof gameSessions>;
type Scenario = InferSelectModel<typeof scenarios>;
type ScenarioSystem = InferSelectModel<typeof scenarioSystems>;
type SessionParticipant = InferSelectModel<typeof sessionParticipants>;
type User = InferSelectModel<typeof users>;
type Tag = InferSelectModel<typeof tags>;

// 参加予定セッション（リレーション込み）
export type UpcomingSession = GameSession & {
  scenario: Scenario & {
    system: ScenarioSystem;
  };
  participants: Array<
    SessionParticipant & {
      user: User;
    }
  >;
};

// 新着シナリオ（リレーション込み）
export type NewScenario = Scenario & {
  system: ScenarioSystem;
  scenarioTags: Array<{
    tag: Tag;
  }>;
};

// Props型
export type UpcomingSessionsProps = {
  sessions: UpcomingSession[];
};

export type NewScenariosProps = {
  scenarios: NewScenario[];
};
