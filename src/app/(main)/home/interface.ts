import type {
  GameSessionRow,
  ScenarioRow,
  ScenarioSystemRow,
  SessionParticipantRow,
  TagRow,
  UserRow,
} from '@/db/helpers';

// 参加予定セッション（リレーション込み）
export type UpcomingSession = GameSessionRow & {
  scenario:
    | (ScenarioRow & {
        system: ScenarioSystemRow;
      })
    | null;
  participants: Array<
    SessionParticipantRow & {
      user: UserRow;
    }
  >;
};

// 新着シナリオ（リレーション込み）
export type NewScenario = ScenarioRow & {
  system: ScenarioSystemRow;
  scenarioTags: Array<{
    tag: TagRow;
  }>;
};

// Props型
export type UpcomingSessionsProps = {
  sessions: UpcomingSession[];
};

export type NewScenariosProps = {
  scenarios: NewScenario[];
};
