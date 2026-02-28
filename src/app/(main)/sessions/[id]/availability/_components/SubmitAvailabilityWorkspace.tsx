'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { format } from 'date-fns';

import { AvailabilityTimeBlockEditor } from './AvailabilityTimeBlockEditor';
import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { BaseAvailabilityCalendar } from './BaseAvailabilityCalendar';
import { SelectedTimeBlocksPanel } from './SelectedTimeBlocksPanel';
import { SelectedTimeBlocksStickyBar } from './SelectedTimeBlocksStickyBar';
import { SubmitSidebarContent } from './SubmitSidebarContent';
import * as styles from './styles';

import {
  isOverlappingTimeBlock,
  isSameTimeBlock,
  sortTimeBlocksByStart,
  toggleExactTimeBlock,
} from '@/lib/availability/timeBlockUtils';
import { err, type Result } from '@/types/result';

import type {
  AvailabilityTimeBlockInput,
  AvailabilityTimeBlockRow,
  AvailabilityWorkspaceData,
  CalendarDayBadge,
} from '../interface';

type SubmitAvailabilityWorkspaceProps = {
  workspaceData: AvailabilityWorkspaceData;
  onSaveTimeBlocks?: (
    timeBlocks: AvailabilityTimeBlockInput[],
  ) =>
    | Promise<Result<AvailabilityTimeBlockRow[]>>
    | Result<AvailabilityTimeBlockRow[]>;
};

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const getLocalDateKeyFromIso = (iso: string): string =>
  format(new Date(iso), 'yyyy-MM-dd');

const buildDayBadges = (
  myTimeBlocks: AvailabilityTimeBlockInput[],
  otherTimeBlocks: AvailabilityWorkspaceData['otherUserAvailabilityTimeBlocks'],
): CalendarDayBadge[] => {
  const bucket = new Map<
    string,
    { submissions: number; markers: Set<string>; userIds: Set<string> }
  >();

  const touch = (dateKey: string) => {
    const existing = bucket.get(dateKey);
    if (existing) {
      return existing;
    }
    const created = {
      submissions: 0,
      markers: new Set<string>(),
      userIds: new Set<string>(),
    };
    bucket.set(dateKey, created);
    return created;
  };

  for (const block of myTimeBlocks) {
    const target = touch(getLocalDateKeyFromIso(block.startAt));
    target.submissions += 1;
    target.markers.add('#10b981');
  }

  for (const block of otherTimeBlocks) {
    const target = touch(getLocalDateKeyFromIso(block.startAt));
    target.submissions += 1;
    target.userIds.add(block.userId);
    target.markers.add(
      block.participantType === 'SPECTATOR' ? '#f59e0b' : '#60a5fa',
    );
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => ({
      dateKey,
      markers: [...value.markers],
      counts: {
        submissions: value.submissions,
        overlapStrong: value.userIds.size,
      },
    }));
};

const validateNonOverlappingInsert = (
  currentTimeBlocks: AvailabilityTimeBlockInput[],
  nextTimeBlock: AvailabilityTimeBlockInput,
): Result<AvailabilityTimeBlockInput[]> => {
  const exactExists = currentTimeBlocks.some((block) =>
    isSameTimeBlock(block, nextTimeBlock),
  );
  if (exactExists) {
    return {
      success: true,
      data: sortTimeBlocksByStart(
        toggleExactTimeBlock(currentTimeBlocks, nextTimeBlock),
      ),
    };
  }

  const hasOverlap = currentTimeBlocks.some((block) =>
    isOverlappingTimeBlock(block, nextTimeBlock),
  );
  if (hasOverlap) {
    return err(new Error('既存のスケジュールと時間が重複しています'));
  }

  return {
    success: true,
    data: sortTimeBlocksByStart([...currentTimeBlocks, nextTimeBlock]),
  };
};

export const SubmitAvailabilityWorkspace = ({
  workspaceData,
  onSaveTimeBlocks,
}: SubmitAvailabilityWorkspaceProps) => {
  const serverTimeBlocks = sortTimeBlocksByStart(
    workspaceData.myAvailabilityTimeBlocks.map((block) => ({
      startAt: block.startAt,
      endAt: block.endAt,
    })),
  );
  const [, setOptimisticTimeBlocks] = useOptimistic(serverTimeBlocks);
  const [draftTimeBlocks, setDraftTimeBlocks] =
    useState<AvailabilityTimeBlockInput[]>(serverTimeBlocks);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    serverTimeBlocks[0] ? new Date(serverTimeBlocks[0].startAt) : new Date(),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const dayBadges = buildDayBadges(
    draftTimeBlocks,
    workspaceData.otherUserAvailabilityTimeBlocks,
  );

  const applyTimeBlockToggleOrInsert = (block: AvailabilityTimeBlockInput) => {
    const result = validateNonOverlappingInsert(draftTimeBlocks, block);
    if (!result.success) {
      setMessage({ tone: 'error', text: result.error.message });
      return { ok: false as const, message: result.error.message };
    }

    setDraftTimeBlocks(result.data);
    setSelectedDate(new Date(block.startAt));
    setMessage(null);
    return { ok: true as const };
  };

  const moveTimeBlock = (index: number, direction: -1 | 1) => {
    setDraftTimeBlocks((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const current = next[index];
      const target = next[nextIndex];
      if (!current || !target) {
        return prev;
      }
      next[index] = target;
      next[nextIndex] = current;
      return next;
    });
  };

  const handleSave = () => {
    if (!onSaveTimeBlocks) {
      setMessage({
        tone: 'success',
        text: 'Storybookモードのため保存は実行していません。',
      });
      return;
    }

    setOptimisticTimeBlocks(draftTimeBlocks);
    startTransition(async () => {
      const result = await onSaveTimeBlocks(draftTimeBlocks);
      if (!result.success) {
        setMessage({ tone: 'error', text: result.error.message });
        return;
      }
      setMessage({ tone: 'success', text: 'スケジュールを保存しました。' });
    });
  };

  const selectedDateTimeBlockCount = selectedDate
    ? draftTimeBlocks.filter(
        (block) =>
          getLocalDateKeyFromIso(block.startAt) === formatDateKey(selectedDate),
      ).length
    : draftTimeBlocks.length;

  const sidebarContent = (
    <SubmitSidebarContent
      selectedDate={selectedDate}
      myTimeBlocks={draftTimeBlocks}
      otherUserTimeBlocks={workspaceData.otherUserAvailabilityTimeBlocks}
      onClickTimeBlock={applyTimeBlockToggleOrInsert}
      errorMessage={message?.tone === 'error' ? message.text : null}
    />
  );

  return (
    <AvailabilityWorkspaceLayout
      mobileSidebarTitle="他の人のスケジュール"
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
      calendarSection={
        <BaseAvailabilityCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dayBadges={dayBadges}
          title="スケジュールカレンダー"
          helperText="選択日の他ユーザーのスケジュールを右側で確認し、同じ時間帯をクリックで追加できます。"
        />
      }
      selectedTimeBlocksSection={
        <div className={styles.sectionStack}>
          <div
            className={styles.pendingSection({ pending: isPending })}
            aria-busy={isPending}
          >
            <SelectedTimeBlocksPanel
              title="自分のスケジュール"
              timeBlocks={draftTimeBlocks}
              minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
              emptyMessage="まだスケジュールがありません。右側からコピーするか、下のフォームで追加してください。"
              onRemoveTimeBlock={(index) =>
                setDraftTimeBlocks((prev) =>
                  prev.filter((_, currentIndex) => currentIndex !== index),
                )
              }
              onMoveUp={(index) => moveTimeBlock(index, -1)}
              onMoveDown={(index) => moveTimeBlock(index, 1)}
            />
          </div>
          <AvailabilityTimeBlockEditor
            selectedDate={selectedDate}
            onAddTimeBlock={applyTimeBlockToggleOrInsert}
            disabled={isPending}
          />
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
          timeBlocks={draftTimeBlocks}
          minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
          primaryActionLabel={isPending ? '保存中...' : '提出を保存'}
          onPrimaryAction={handleSave}
          primaryDisabled={isPending}
          sidebarToggleLabel={`他の人のスケジュール (${selectedDateTimeBlockCount})`}
          onToggleSidebar={() => setMobileSidebarOpen((open) => !open)}
          sidebarOpen={mobileSidebarOpen}
        />
      }
    />
  );
};
