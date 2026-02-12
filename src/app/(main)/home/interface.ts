import type {
  GameScheduleRow,
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
  schedule: GameScheduleRow | null;
};

// 新着シナリオ（リレーション込み）
export type NewScenario = ScenarioRow & {
  system: ScenarioSystemRow;
  scenarioTags: Array<{
    tag: TagRow;
  }>;
};

// アクティビティアイテム
export type ActivityItem = {
  id: string;
  type:
    | 'participant_joined'
    | 'scenario_updated'
    | 'session_completed'
    | 'review_created';
  description: string;
  actorName: string;
  targetName: string;
  timestamp: string;
};

// カレンダー用セッション日程
export type CalendarSessionDate = {
  scheduleDate: string;
  sessionId: string;
  sessionName: string;
};

// Props型
export type UpcomingSessionsProps = {
  sessions: UpcomingSession[];
};

export type NewScenariosProps = {
  scenarios: NewScenario[];
};

export type HeroSectionProps = {
  userName: string;
  nextSession: UpcomingSession | null;
};

export type ActivityTimelineProps = {
  activities: ActivityItem[];
};

export type MiniCalendarProps = {
  sessionDates: CalendarSessionDate[];
};
