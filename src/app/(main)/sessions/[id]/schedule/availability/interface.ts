import type {
  GameScheduleTimeBlockRow,
  SessionAvailabilityTimeBlockRow,
} from '@/db/helpers';
import type { Database } from '@/db/types';

export type ParticipantType = Database['public']['Enums']['participant_type'];

export type AvailabilityTimeBlockRow = SessionAvailabilityTimeBlockRow;
export type ConfirmedScheduleTimeBlockRow = GameScheduleTimeBlockRow;

export type AvailabilityTimeBlockWithUser = AvailabilityTimeBlockRow & {
  userName: string;
  participantType: ParticipantType;
  isHost: boolean;
};

export type AvailabilityWorkspaceData = {
  sessionId: string;
  sessionName: string;
  minPlaytimeMinutes: number | null;
  currentUserId: string;
  currentUserParticipantType: ParticipantType | null;
  currentUserIsHost: boolean;
  myAvailabilityTimeBlocks: AvailabilityTimeBlockRow[];
  otherUserAvailabilityTimeBlocks: AvailabilityTimeBlockWithUser[];
  confirmedScheduleTimeBlocks: ConfirmedScheduleTimeBlockRow[];
};

export type AvailabilityTimeBlockInput = {
  startAt: string;
  endAt: string;
};

export type RecommendationGroupType = 'all_users' | 'required_users_only';
export type RecommendationKind = 'single' | 'combo';

export type CoverageSummary = {
  totalRequiredUsers: number;
  totalSpectators: number;
  coveredRequiredUsers: number;
  coveredSpectators: number;
};

export type RecommendationTimeBlock = {
  startAt: string;
  endAt: string;
};

export type RecommendationItem = {
  recommendationId: string;
  kind: RecommendationKind;
  group: RecommendationGroupType;
  timeBlocks: RecommendationTimeBlock[];
  totalMinutes: number;
  meetsMinPlaytime: boolean;
  coverage: CoverageSummary;
  reasonLabels: string[];
  rankingScore: {
    priorityBucket: number;
    durationMinutes: number;
    compactnessScore: number;
  };
};

export type RecommendationGroup = {
  group: RecommendationGroupType;
  title: string;
  note?: string;
  items: RecommendationItem[];
};

export type RecommendationParticipant = {
  userId: string;
  participantType: ParticipantType;
  isHost: boolean;
};

export type RecommendationSourceTimeBlock = Pick<
  AvailabilityTimeBlockRow,
  'userId' | 'startAt' | 'endAt'
>;

export type CalendarDayBadge = {
  dateKey: string;
  markers: string[];
  counts?: {
    submissions: number;
    overlapStrong: number;
  };
};
