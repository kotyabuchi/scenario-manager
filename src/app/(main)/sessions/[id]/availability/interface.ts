import type {
  GameScheduleSlotRow,
  SessionAvailabilitySlotRow,
} from '@/db/helpers';
import type { Database } from '@/db/types';

export type ParticipantType = Database['public']['Enums']['participant_type'];

export type AvailabilitySlotRow = SessionAvailabilitySlotRow;
export type ConfirmedScheduleSlotRow = GameScheduleSlotRow;

export type AvailabilitySlotWithUser = AvailabilitySlotRow & {
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
  myAvailabilitySlots: AvailabilitySlotRow[];
  otherUserAvailabilitySlots: AvailabilitySlotWithUser[];
  confirmedScheduleSlots: ConfirmedScheduleSlotRow[];
};

export type AvailabilitySlotInput = {
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

export type RecommendationSlot = {
  startAt: string;
  endAt: string;
};

export type RecommendationItem = {
  recommendationId: string;
  kind: RecommendationKind;
  group: RecommendationGroupType;
  slots: RecommendationSlot[];
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

export type RecommendationSourceSlot = Pick<
  AvailabilitySlotRow,
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
