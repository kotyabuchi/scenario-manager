'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { format } from 'date-fns';

import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { BaseAvailabilityCalendar } from './BaseAvailabilityCalendar';
import { ConfirmSidebarContent } from './ConfirmSidebarContent';
import { SelectedTimeBlocksPanel } from './SelectedTimeBlocksPanel';
import { SelectedTimeBlocksStickyBar } from './SelectedTimeBlocksStickyBar';
import * as styles from './styles';

import {
  isOverlappingTimeBlock,
  isSameTimeBlock,
  sortTimeBlocksByStart,
} from '@/lib/availability/timeBlockUtils';
import { err, type Result } from '@/types/result';

import type {
  AvailabilityTimeBlockInput,
  AvailabilityWorkspaceData,
  CalendarDayBadge,
  ConfirmedScheduleTimeBlockRow,
  RecommendationGroup,
  RecommendationItem,
} from '../interface';

type ConfirmAvailabilityWorkspaceProps = {
  workspaceData: AvailabilityWorkspaceData;
  recommendationGroups: RecommendationGroup[];
  onConfirmTimeBlocks?: (
    timeBlocks: AvailabilityTimeBlockInput[],
  ) =>
    | Promise<Result<ConfirmedScheduleTimeBlockRow[]>>
    | Result<ConfirmedScheduleTimeBlockRow[]>;
};

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');
const getLocalDateKeyFromIso = (iso: string): string =>
  format(new Date(iso), 'yyyy-MM-dd');

const buildConfirmDayBadges = (
  workspaceData: AvailabilityWorkspaceData,
  selectedTimeBlocks: AvailabilityTimeBlockInput[],
  recommendationGroups: RecommendationGroup[],
): CalendarDayBadge[] => {
  const bucket = new Map<
    string,
    { markers: Set<string>; submissions: number; overlapStrong: number }
  >();

  const touch = (dateKey: string) => {
    const existing = bucket.get(dateKey);
    if (existing) {
      return existing;
    }
    const created = {
      markers: new Set<string>(),
      submissions: 0,
      overlapStrong: 0,
    };
    bucket.set(dateKey, created);
    return created;
  };

  const allAvailability = [
    ...workspaceData.myAvailabilityTimeBlocks.map((block) => ({
      startAt: block.startAt,
      endAt: block.endAt,
      participantType: workspaceData.currentUserParticipantType,
    })),
    ...workspaceData.otherUserAvailabilityTimeBlocks.map((block) => ({
      startAt: block.startAt,
      endAt: block.endAt,
      participantType: block.participantType,
    })),
  ];

  for (const block of allAvailability) {
    const item = touch(getLocalDateKeyFromIso(block.startAt));
    item.submissions += 1;
    item.overlapStrong += 1;
    item.markers.add(
      block.participantType === 'SPECTATOR' ? '#f59e0b' : '#60a5fa',
    );
  }

  for (const group of recommendationGroups) {
    for (const recommendation of group.items) {
      for (const block of recommendation.timeBlocks) {
        const item = touch(getLocalDateKeyFromIso(block.startAt));
        item.markers.add(group.group === 'all_users' ? '#10b981' : '#a855f7');
      }
    }
  }

  for (const block of selectedTimeBlocks) {
    const item = touch(getLocalDateKeyFromIso(block.startAt));
    item.markers.add('#0ea5e9');
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => ({
      dateKey,
      markers: [...value.markers],
      counts: {
        submissions: value.submissions,
        overlapStrong: value.overlapStrong,
      },
    }));
};

const normalizeTimeBlocks = (
  timeBlocks: AvailabilityTimeBlockInput[],
): AvailabilityTimeBlockInput[] =>
  sortTimeBlocksByStart(
    timeBlocks.map((block) => ({
      startAt: block.startAt,
      endAt: block.endAt,
    })),
  );

const toggleRecommendationTimeBlocks = (
  currentTimeBlocks: AvailabilityTimeBlockInput[],
  item: RecommendationItem,
): Result<AvailabilityTimeBlockInput[]> => {
  const allSelected = item.timeBlocks.every((block) =>
    currentTimeBlocks.some((current) => isSameTimeBlock(current, block)),
  );

  if (allSelected) {
    return {
      success: true,
      data: currentTimeBlocks.filter(
        (current) =>
          !item.timeBlocks.some((block) => isSameTimeBlock(current, block)),
      ),
    };
  }

  const timeBlocksToAdd = item.timeBlocks.filter(
    (block) =>
      !currentTimeBlocks.some((current) => isSameTimeBlock(current, block)),
  );

  for (const nextBlock of timeBlocksToAdd) {
    const overlaps = currentTimeBlocks.some(
      (current) =>
        !isSameTimeBlock(current, nextBlock) &&
        isOverlappingTimeBlock(current, nextBlock),
    );
    if (overlaps) {
      return err(
        new Error('選択中の日程と時間が重複するため、この候補は追加できません'),
      );
    }
  }

  return {
    success: true,
    data: normalizeTimeBlocks([...currentTimeBlocks, ...timeBlocksToAdd]),
  };
};

export const ConfirmAvailabilityWorkspace = ({
  workspaceData,
  recommendationGroups,
  onConfirmTimeBlocks,
}: ConfirmAvailabilityWorkspaceProps) => {
  const serverTimeBlocks = normalizeTimeBlocks(
    workspaceData.confirmedScheduleTimeBlocks.map((block) => ({
      startAt: block.startAt,
      endAt: block.endAt,
    })),
  );
  const [, setOptimisticTimeBlocks] = useOptimistic(serverTimeBlocks);
  const [selectedTimeBlocks, setSelectedTimeBlocks] =
    useState<AvailabilityTimeBlockInput[]>(serverTimeBlocks);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    serverTimeBlocks[0]
      ? new Date(serverTimeBlocks[0].startAt)
      : recommendationGroups[0]?.items[0]?.timeBlocks[0]
        ? new Date(recommendationGroups[0].items[0].timeBlocks[0].startAt)
        : new Date(),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const dayBadges = buildConfirmDayBadges(
    workspaceData,
    selectedTimeBlocks,
    recommendationGroups,
  );

  const handleToggleRecommendation = (item: RecommendationItem) => {
    const result = toggleRecommendationTimeBlocks(selectedTimeBlocks, item);
    if (!result.success) {
      setMessage({ tone: 'error', text: result.error.message });
      return;
    }

    setSelectedTimeBlocks(result.data);
    const firstTimeBlock = item.timeBlocks[0];
    if (firstTimeBlock) {
      setSelectedDate(new Date(firstTimeBlock.startAt));
    }
    setMessage(null);
  };

  const handleConfirm = () => {
    if (!onConfirmTimeBlocks) {
      setMessage({
        tone: 'success',
        text: 'Storybookモードのため確定保存は実行していません。',
      });
      return;
    }

    setOptimisticTimeBlocks(selectedTimeBlocks);
    startTransition(async () => {
      const result = await onConfirmTimeBlocks(selectedTimeBlocks);
      if (!result.success) {
        setMessage({ tone: 'error', text: result.error.message });
        return;
      }
      setMessage({ tone: 'success', text: '確定日程を保存しました。' });
    });
  };

  const selectedDateRecommendationCount = selectedDate
    ? recommendationGroups.reduce(
        (count, group) =>
          count +
          group.items.filter((item) =>
            item.timeBlocks.some(
              (block) =>
                getLocalDateKeyFromIso(block.startAt) ===
                formatDateKey(selectedDate),
            ),
          ).length,
        0,
      )
    : recommendationGroups.reduce(
        (count, group) => count + group.items.length,
        0,
      );

  const sidebarContent = (
    <ConfirmSidebarContent
      groups={recommendationGroups}
      selectedTimeBlocks={selectedTimeBlocks}
      onClickRecommendation={handleToggleRecommendation}
      errorMessage={message?.tone === 'error' ? message.text : null}
    />
  );

  return (
    <AvailabilityWorkspaceLayout
      mobileSidebarTitle="おすすめ候補"
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
      calendarSection={
        <BaseAvailabilityCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dayBadges={dayBadges}
          title="日程確定カレンダー"
          helperText="日単位で提出密度を見つつ、右側のおすすめ候補をクリックして確定日程を選びます。"
        />
      }
      selectedTimeBlocksSection={
        <div className={styles.sectionStack}>
          <div
            className={styles.pendingSection({ pending: isPending })}
            aria-busy={isPending}
          >
            <SelectedTimeBlocksPanel
              title="確定候補"
              timeBlocks={selectedTimeBlocks}
              minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
              emptyMessage="おすすめ一覧から候補を選択してください。"
              onRemoveTimeBlock={(index) =>
                setSelectedTimeBlocks((prev) =>
                  prev.filter((_, currentIndex) => currentIndex !== index),
                )
              }
            />
          </div>
          {message ? (
            <p className={styles.messageBox({ tone: message.tone })}>
              {message.text}
            </p>
          ) : null}
        </div>
      }
      desktopSidebarSection={sidebarContent}
      mobileSidebarSection={sidebarContent}
      stickyBar={
        <SelectedTimeBlocksStickyBar
          timeBlocks={selectedTimeBlocks}
          minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
          primaryActionLabel={isPending ? '保存中...' : '日程を確定'}
          onPrimaryAction={handleConfirm}
          primaryDisabled={isPending || selectedTimeBlocks.length === 0}
          sidebarToggleLabel={`おすすめ (${selectedDateRecommendationCount})`}
          onToggleSidebar={() => setMobileSidebarOpen((open) => !open)}
          sidebarOpen={mobileSidebarOpen}
        />
      }
    />
  );
};
