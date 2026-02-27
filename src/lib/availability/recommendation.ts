import {
  calcGapMinutes,
  calcTimeBlockMinutes,
  calcTotalTimeBlockMinutes,
  getUtcDateKey,
  sortTimeBlocksByStart,
} from './timeBlockUtils';

import type {
  CoverageSummary,
  RecommendationGroup,
  RecommendationGroupType,
  RecommendationItem,
  RecommendationParticipant,
  RecommendationSourceTimeBlock,
  RecommendationTimeBlock,
} from '@/app/(main)/sessions/[id]/availability/interface';

const MINUTES_IN_DAY = 24 * 60;
const MAX_COMBO_SLOT_COUNT = 4;
const MAX_COMBO_ITEMS_PER_GROUP = 10;

export const MAX_SINGLE_CANDIDATES_FOR_COMBO = 10;

type SourceTimeBlockWithMs = RecommendationSourceTimeBlock & {
  startMs: number;
  endMs: number;
};

type BaseSegment = {
  startMs: number;
  endMs: number;
  activeUserIds: Set<string>;
  coveredRequiredUsers: number;
  coveredSpectators: number;
};

type GroupCoverageContext = {
  totalRequiredUsers: number;
  totalSpectators: number;
  requiredUserIds: Set<string>;
  spectatorUserIds: Set<string>;
};

type BuildScheduleRecommendationsInput = {
  participants: RecommendationParticipant[];
  timeBlocks: RecommendationSourceTimeBlock[];
  minPlaytimeMinutes: number | null;
  maxSingleCandidatesForCombo?: number;
};

type GroupSegment = {
  timeBlock: RecommendationTimeBlock;
  coverage: CoverageSummary;
};

type ComboMetrics = {
  timeBlockCount: number;
  sameDay: boolean;
  timeGapTotalMinutes: number;
  daySpanDays: number;
  totalMinutes: number;
  firstStartAt: string;
};

const buildCoverageSummary = (
  context: GroupCoverageContext,
  coveredRequiredUsers: number,
  coveredSpectators: number,
): CoverageSummary => ({
  totalRequiredUsers: context.totalRequiredUsers,
  totalSpectators: context.totalSpectators,
  coveredRequiredUsers,
  coveredSpectators,
});

const minutesToLabel = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const restMinutes = safeMinutes % 60;

  if (hours > 0 && restMinutes > 0) {
    return `${hours}時間${restMinutes}分`;
  }
  if (hours > 0) {
    return `${hours}時間`;
  }
  return `${restMinutes}分`;
};

const groupLabel = (group: RecommendationGroupType): string =>
  group === 'all_users' ? '全ユーザー参加可' : '見学者を除けば全員参加可';

const normalizeParticipants = (
  participants: RecommendationParticipant[],
): RecommendationParticipant[] => {
  const map = new Map<string, RecommendationParticipant>();

  for (const participant of participants) {
    const existing = map.get(participant.userId);
    if (!existing) {
      map.set(participant.userId, participant);
      continue;
    }

    map.set(participant.userId, {
      userId: participant.userId,
      participantType:
        existing.participantType === 'SPECTATOR' &&
        participant.participantType !== 'SPECTATOR'
          ? participant.participantType
          : existing.participantType,
      isHost: existing.isHost || participant.isHost,
    });
  }

  return [...map.values()];
};

const buildCoverageContext = (
  participants: RecommendationParticipant[],
): GroupCoverageContext => {
  const normalizedParticipants = normalizeParticipants(participants);
  const requiredUserIds = new Set(
    normalizedParticipants
      .filter((participant) => participant.participantType !== 'SPECTATOR')
      .map((participant) => participant.userId),
  );
  const spectatorUserIds = new Set(
    normalizedParticipants
      .filter((participant) => participant.participantType === 'SPECTATOR')
      .map((participant) => participant.userId),
  );

  return {
    totalRequiredUsers: requiredUserIds.size,
    totalSpectators: spectatorUserIds.size,
    requiredUserIds,
    spectatorUserIds,
  };
};

const normalizeSourceTimeBlocks = (
  timeBlocks: RecommendationSourceTimeBlock[],
): SourceTimeBlockWithMs[] =>
  timeBlocks
    .map((timeBlock) => ({
      ...timeBlock,
      startMs: new Date(timeBlock.startAt).getTime(),
      endMs: new Date(timeBlock.endAt).getTime(),
    }))
    .filter(
      (timeBlock) =>
        Number.isFinite(timeBlock.startMs) &&
        Number.isFinite(timeBlock.endMs) &&
        timeBlock.startMs < timeBlock.endMs,
    )
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

const areSameActiveUsers = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
};

const buildBaseSegments = (
  slots: SourceTimeBlockWithMs[],
  coverageContext: GroupCoverageContext,
): BaseSegment[] => {
  if (slots.length === 0) {
    return [];
  }

  const boundaries = [
    ...new Set(slots.flatMap((slot) => [slot.startMs, slot.endMs])),
  ].sort((a, b) => a - b);

  const segments: BaseSegment[] = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startMs = boundaries[index];
    const endMs = boundaries[index + 1];
    if (startMs === undefined || endMs === undefined || startMs >= endMs) {
      continue;
    }

    const activeUserIds = new Set(
      slots
        .filter((slot) => slot.startMs <= startMs && endMs <= slot.endMs)
        .map((slot) => slot.userId),
    );

    if (activeUserIds.size === 0) {
      continue;
    }

    let coveredRequiredUsers = 0;
    let coveredSpectators = 0;

    for (const userId of activeUserIds) {
      if (coverageContext.requiredUserIds.has(userId)) {
        coveredRequiredUsers += 1;
        continue;
      }
      if (coverageContext.spectatorUserIds.has(userId)) {
        coveredSpectators += 1;
      }
    }

    const prev = segments.at(-1);
    if (
      prev &&
      prev.endMs === startMs &&
      areSameActiveUsers(prev.activeUserIds, activeUserIds)
    ) {
      prev.endMs = endMs;
      continue;
    }

    segments.push({
      startMs,
      endMs,
      activeUserIds,
      coveredRequiredUsers,
      coveredSpectators,
    });
  }

  return segments;
};

const extractGroupSegments = (
  group: RecommendationGroupType,
  baseSegments: BaseSegment[],
  coverageContext: GroupCoverageContext,
): GroupSegment[] => {
  const results: GroupSegment[] = [];

  const isEligible = (segment: BaseSegment): boolean => {
    if (segment.coveredRequiredUsers !== coverageContext.totalRequiredUsers) {
      return false;
    }
    if (group === 'all_users') {
      return segment.coveredSpectators === coverageContext.totalSpectators;
    }
    return true;
  };

  for (const segment of baseSegments) {
    if (!isEligible(segment)) {
      continue;
    }

    const prev = results.at(-1);
    if (!prev) {
      results.push({
        timeBlock: {
          startAt: new Date(segment.startMs).toISOString(),
          endAt: new Date(segment.endMs).toISOString(),
        },
        coverage: buildCoverageSummary(
          coverageContext,
          segment.coveredRequiredUsers,
          segment.coveredSpectators,
        ),
      });
      continue;
    }

    const prevEndMs = new Date(prev.timeBlock.endAt).getTime();
    if (prevEndMs === segment.startMs) {
      prev.timeBlock.endAt = new Date(segment.endMs).toISOString();
      prev.coverage = buildCoverageSummary(
        coverageContext,
        Math.min(
          prev.coverage.coveredRequiredUsers,
          segment.coveredRequiredUsers,
        ),
        Math.min(prev.coverage.coveredSpectators, segment.coveredSpectators),
      );
      continue;
    }

    results.push({
      timeBlock: {
        startAt: new Date(segment.startMs).toISOString(),
        endAt: new Date(segment.endMs).toISOString(),
      },
      coverage: buildCoverageSummary(
        coverageContext,
        segment.coveredRequiredUsers,
        segment.coveredSpectators,
      ),
    });
  }

  return results;
};

const isMinPlaytimeMet = (
  totalMinutes: number,
  minPlaytimeMinutes: number | null,
): boolean =>
  minPlaytimeMinutes === null ? true : totalMinutes >= minPlaytimeMinutes;

const createSingleRecommendationItem = (
  group: RecommendationGroupType,
  segment: GroupSegment,
  minPlaytimeMinutes: number | null,
): RecommendationItem => {
  const durationMinutes = calcTimeBlockMinutes(segment.timeBlock);
  const meetsMinPlaytime = isMinPlaytimeMet(
    durationMinutes,
    minPlaytimeMinutes,
  );

  const reasonLabels = [
    ...(minPlaytimeMinutes !== null && meetsMinPlaytime
      ? ['1回で最低プレイ時間を満たす']
      : []),
    groupLabel(group),
    `重なり ${minutesToLabel(durationMinutes)}`,
  ];

  return {
    recommendationId: `single:${group}:${segment.timeBlock.startAt}:${segment.timeBlock.endAt}`,
    kind: 'single',
    group,
    timeBlocks: [segment.timeBlock],
    totalMinutes: durationMinutes,
    meetsMinPlaytime,
    coverage: segment.coverage,
    reasonLabels,
    rankingScore: {
      priorityBucket: meetsMinPlaytime ? 0 : 1,
      durationMinutes,
      compactnessScore: 0,
    },
  };
};

const compareSingleItems = (
  a: RecommendationItem,
  b: RecommendationItem,
): number => {
  if (a.meetsMinPlaytime !== b.meetsMinPlaytime) {
    return a.meetsMinPlaytime ? -1 : 1;
  }

  if (a.totalMinutes !== b.totalMinutes) {
    return b.totalMinutes - a.totalMinutes;
  }

  const aStart = a.timeBlocks[0]?.startAt ?? '';
  const bStart = b.timeBlocks[0]?.startAt ?? '';
  return aStart.localeCompare(bStart);
};

const calcComboMetrics = (
  timeBlocks: RecommendationTimeBlock[],
): ComboMetrics => {
  const sortedTimeBlocks = sortTimeBlocksByStart(timeBlocks);
  const totalMinutes = calcTotalTimeBlockMinutes(sortedTimeBlocks);
  const firstTimeBlock = sortedTimeBlocks[0];
  const lastTimeBlock = sortedTimeBlocks.at(-1);

  if (!firstTimeBlock || !lastTimeBlock) {
    return {
      timeBlockCount: 0,
      sameDay: true,
      timeGapTotalMinutes: 0,
      daySpanDays: 0,
      totalMinutes: 0,
      firstStartAt: '',
    };
  }

  let timeGapTotalMinutes = 0;
  for (let index = 1; index < sortedTimeBlocks.length; index += 1) {
    const prev = sortedTimeBlocks[index - 1];
    const current = sortedTimeBlocks[index];
    if (!prev || !current) {
      continue;
    }
    timeGapTotalMinutes += calcGapMinutes(prev, current);
  }

  const startDay = getUtcDateKey(firstTimeBlock.startAt);
  const endDay = getUtcDateKey(lastTimeBlock.endAt);
  const daySpanDays = Math.floor(
    (new Date(`${endDay}T00:00:00.000Z`).getTime() -
      new Date(`${startDay}T00:00:00.000Z`).getTime()) /
      (MINUTES_IN_DAY * 60 * 1000),
  );

  const dayKeys = new Set(
    sortedTimeBlocks.map((timeBlock) => getUtcDateKey(timeBlock.startAt)),
  );

  return {
    timeBlockCount: sortedTimeBlocks.length,
    sameDay: dayKeys.size === 1 && daySpanDays === 0,
    timeGapTotalMinutes,
    daySpanDays,
    totalMinutes,
    firstStartAt: firstTimeBlock.startAt,
  };
};

const createComboRecommendationItem = (
  group: RecommendationGroupType,
  timeBlocks: RecommendationTimeBlock[],
  coverages: CoverageSummary[],
  coverageContext: GroupCoverageContext,
  minPlaytimeMinutes: number | null,
): RecommendationItem => {
  const sortedTimeBlocks = sortTimeBlocksByStart(timeBlocks);
  const metrics = calcComboMetrics(sortedTimeBlocks);
  const meetsMinPlaytime = isMinPlaytimeMet(
    metrics.totalMinutes,
    minPlaytimeMinutes,
  );

  const coveredRequiredUsers = Math.min(
    ...coverages.map((coverage) => coverage.coveredRequiredUsers),
  );
  const coveredSpectators = Math.min(
    ...coverages.map((coverage) => coverage.coveredSpectators),
  );

  const reasonLabels = [
    ...(minPlaytimeMinutes !== null && meetsMinPlaytime
      ? [`${sortedTimeBlocks.length}件で最低プレイ時間を満たす`]
      : []),
    ...(metrics.sameDay ? ['同日で完結'] : []),
    groupLabel(group),
    `合計 ${minutesToLabel(metrics.totalMinutes)}`,
  ];

  return {
    recommendationId: `combo:${group}:${sortedTimeBlocks
      .map((timeBlock) => `${timeBlock.startAt}-${timeBlock.endAt}`)
      .join('|')}`,
    kind: 'combo',
    group,
    timeBlocks: sortedTimeBlocks,
    totalMinutes: metrics.totalMinutes,
    meetsMinPlaytime,
    coverage: buildCoverageSummary(
      coverageContext,
      coveredRequiredUsers,
      coveredSpectators,
    ),
    reasonLabels,
    rankingScore: {
      priorityBucket:
        minPlaytimeMinutes === null ? 1 : meetsMinPlaytime ? 2 : 3,
      durationMinutes: metrics.totalMinutes,
      compactnessScore: -(
        metrics.timeGapTotalMinutes +
        metrics.daySpanDays * MINUTES_IN_DAY
      ),
    },
  };
};

const compareComboItems = (
  a: RecommendationItem,
  b: RecommendationItem,
): number => {
  const aMetrics = calcComboMetrics(a.timeBlocks);
  const bMetrics = calcComboMetrics(b.timeBlocks);

  if (aMetrics.timeBlockCount !== bMetrics.timeBlockCount) {
    return aMetrics.timeBlockCount - bMetrics.timeBlockCount;
  }

  if (aMetrics.sameDay !== bMetrics.sameDay) {
    return aMetrics.sameDay ? -1 : 1;
  }

  if (aMetrics.timeGapTotalMinutes !== bMetrics.timeGapTotalMinutes) {
    return aMetrics.timeGapTotalMinutes - bMetrics.timeGapTotalMinutes;
  }

  if (aMetrics.daySpanDays !== bMetrics.daySpanDays) {
    return aMetrics.daySpanDays - bMetrics.daySpanDays;
  }

  if (a.totalMinutes !== b.totalMinutes) {
    return b.totalMinutes - a.totalMinutes;
  }

  return aMetrics.firstStartAt.localeCompare(bMetrics.firstStartAt);
};

const generateComboRecommendations = (
  group: RecommendationGroupType,
  singleItems: RecommendationItem[],
  coverageContext: GroupCoverageContext,
  minPlaytimeMinutes: number | null,
  maxSingleCandidatesForCombo: number,
): RecommendationItem[] => {
  const pool = singleItems.slice(0, maxSingleCandidatesForCombo);
  if (pool.length < 2) {
    return [];
  }

  const combos: RecommendationItem[] = [];
  const seenIds = new Set<string>();

  const visit = (startIndex: number, selected: RecommendationItem[]): void => {
    if (selected.length >= 2) {
      const item = createComboRecommendationItem(
        group,
        selected.flatMap((recommendation) => recommendation.timeBlocks),
        selected.map((recommendation) => recommendation.coverage),
        coverageContext,
        minPlaytimeMinutes,
      );

      if (
        (minPlaytimeMinutes === null ||
          item.totalMinutes >= minPlaytimeMinutes) &&
        !seenIds.has(item.recommendationId)
      ) {
        seenIds.add(item.recommendationId);
        combos.push(item);
      }
    }

    if (selected.length >= MAX_COMBO_SLOT_COUNT) {
      return;
    }

    for (let index = startIndex; index < pool.length; index += 1) {
      const next = pool[index];
      if (!next) {
        continue;
      }
      visit(index + 1, [...selected, next]);
    }
  };

  visit(0, []);

  return combos.sort(compareComboItems).slice(0, MAX_COMBO_ITEMS_PER_GROUP);
};

const buildGroupRecommendations = (
  group: RecommendationGroupType,
  baseSegments: BaseSegment[],
  coverageContext: GroupCoverageContext,
  minPlaytimeMinutes: number | null,
  maxSingleCandidatesForCombo: number,
): RecommendationItem[] => {
  const groupSegments = extractGroupSegments(
    group,
    baseSegments,
    coverageContext,
  );
  const singleItems = groupSegments
    .map((segment) =>
      createSingleRecommendationItem(group, segment, minPlaytimeMinutes),
    )
    .sort(compareSingleItems);

  const comboItems = generateComboRecommendations(
    group,
    singleItems,
    coverageContext,
    minPlaytimeMinutes,
    maxSingleCandidatesForCombo,
  );

  return [...singleItems, ...comboItems];
};

export const buildScheduleRecommendations = ({
  participants,
  timeBlocks,
  minPlaytimeMinutes,
  maxSingleCandidatesForCombo = MAX_SINGLE_CANDIDATES_FOR_COMBO,
}: BuildScheduleRecommendationsInput): RecommendationGroup[] => {
  const coverageContext = buildCoverageContext(participants);
  const normalizedTimeBlocks = normalizeSourceTimeBlocks(timeBlocks).filter(
    (timeBlock) =>
      participants.some(
        (participant) => participant.userId === timeBlock.userId,
      ),
  );

  if (normalizedTimeBlocks.length === 0) {
    return [];
  }

  const baseSegments = buildBaseSegments(normalizedTimeBlocks, coverageContext);
  if (baseSegments.length === 0) {
    return [];
  }

  const allUsersItems = buildGroupRecommendations(
    'all_users',
    baseSegments,
    coverageContext,
    minPlaytimeMinutes,
    maxSingleCandidatesForCombo,
  );
  const requiredUsersOnlyItems = buildGroupRecommendations(
    'required_users_only',
    baseSegments,
    coverageContext,
    minPlaytimeMinutes,
    maxSingleCandidatesForCombo,
  );

  const groups: RecommendationGroup[] = [];

  if (allUsersItems.length > 0) {
    groups.push({
      group: 'all_users',
      title: '全ユーザー参加できる候補',
      items: allUsersItems,
    });
  }

  if (requiredUsersOnlyItems.length > 0) {
    groups.push({
      group: 'required_users_only',
      title: '見学者を除けば参加できる候補',
      note: 'ここから下は見学者が参加できない候補です',
      items: requiredUsersOnlyItems,
    });
  }

  return groups;
};
