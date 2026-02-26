'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { format } from 'date-fns';

import { AvailabilitySlotEditor } from './AvailabilitySlotEditor';
import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { BaseAvailabilityCalendar } from './BaseAvailabilityCalendar';
import { SelectedSlotsPanel } from './SelectedSlotsPanel';
import { SelectedSlotsStickyBar } from './SelectedSlotsStickyBar';
import { SubmitSidebarContent } from './SubmitSidebarContent';
import * as styles from './styles';

import {
  isOverlappingSlot,
  isSameSlot,
  sortSlotsByStart,
  toggleExactSlot,
} from '@/lib/availability/slotUtils';
import { err, type Result } from '@/types/result';

import type {
  AvailabilitySlotInput,
  AvailabilitySlotRow,
  AvailabilityWorkspaceData,
  CalendarDayBadge,
} from '../interface';

type SubmitAvailabilityWorkspaceProps = {
  workspaceData: AvailabilityWorkspaceData;
  onSaveSlots?: (
    slots: AvailabilitySlotInput[],
  ) => Promise<Result<AvailabilitySlotRow[]>> | Result<AvailabilitySlotRow[]>;
};

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const getLocalDateKeyFromIso = (iso: string): string =>
  format(new Date(iso), 'yyyy-MM-dd');

const buildDayBadges = (
  mySlots: AvailabilitySlotInput[],
  otherSlots: AvailabilityWorkspaceData['otherUserAvailabilitySlots'],
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

  for (const slot of mySlots) {
    const target = touch(getLocalDateKeyFromIso(slot.startAt));
    target.submissions += 1;
    target.markers.add('#10b981');
  }

  for (const slot of otherSlots) {
    const target = touch(getLocalDateKeyFromIso(slot.startAt));
    target.submissions += 1;
    target.userIds.add(slot.userId);
    target.markers.add(
      slot.participantType === 'SPECTATOR' ? '#f59e0b' : '#60a5fa',
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
  currentSlots: AvailabilitySlotInput[],
  nextSlot: AvailabilitySlotInput,
): Result<AvailabilitySlotInput[]> => {
  const exactExists = currentSlots.some((slot) => isSameSlot(slot, nextSlot));
  if (exactExists) {
    return {
      success: true,
      data: sortSlotsByStart(toggleExactSlot(currentSlots, nextSlot)),
    };
  }

  const hasOverlap = currentSlots.some((slot) =>
    isOverlappingSlot(slot, nextSlot),
  );
  if (hasOverlap) {
    return err(new Error('既存の提出枠と時間が重複しています'));
  }

  return {
    success: true,
    data: sortSlotsByStart([...currentSlots, nextSlot]),
  };
};

export const SubmitAvailabilityWorkspace = ({
  workspaceData,
  onSaveSlots,
}: SubmitAvailabilityWorkspaceProps) => {
  const serverSlots = sortSlotsByStart(
    workspaceData.myAvailabilitySlots.map((slot) => ({
      startAt: slot.startAt,
      endAt: slot.endAt,
    })),
  );
  const [, setOptimisticSlots] = useOptimistic(serverSlots);
  const [draftSlots, setDraftSlots] =
    useState<AvailabilitySlotInput[]>(serverSlots);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    serverSlots[0] ? new Date(serverSlots[0].startAt) : new Date(),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const dayBadges = buildDayBadges(
    draftSlots,
    workspaceData.otherUserAvailabilitySlots,
  );

  const applySlotToggleOrInsert = (slot: AvailabilitySlotInput) => {
    const result = validateNonOverlappingInsert(draftSlots, slot);
    if (!result.success) {
      setMessage({ tone: 'error', text: result.error.message });
      return { ok: false as const, message: result.error.message };
    }

    setDraftSlots(result.data);
    setSelectedDate(new Date(slot.startAt));
    setMessage(null);
    return { ok: true as const };
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    setDraftSlots((prev) => {
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
    if (!onSaveSlots) {
      setMessage({
        tone: 'success',
        text: 'Storybookモードのため保存は実行していません。',
      });
      return;
    }

    setOptimisticSlots(draftSlots);
    startTransition(async () => {
      const result = await onSaveSlots(draftSlots);
      if (!result.success) {
        setMessage({ tone: 'error', text: result.error.message });
        return;
      }
      setMessage({ tone: 'success', text: '参加可能時間を保存しました。' });
    });
  };

  const selectedDateSlotCount = selectedDate
    ? draftSlots.filter(
        (slot) =>
          getLocalDateKeyFromIso(slot.startAt) === formatDateKey(selectedDate),
      ).length
    : draftSlots.length;

  const sidebarContent = (
    <SubmitSidebarContent
      selectedDate={selectedDate}
      mySlots={draftSlots}
      otherUserSlots={workspaceData.otherUserAvailabilitySlots}
      onClickSlot={applySlotToggleOrInsert}
      errorMessage={message?.tone === 'error' ? message.text : null}
    />
  );

  return (
    <AvailabilityWorkspaceLayout
      mobileSidebarTitle="他の人の提出枠"
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
      calendarSection={
        <BaseAvailabilityCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dayBadges={dayBadges}
          title="参加可能日カレンダー"
          helperText="選択日の他ユーザー提出枠を右側で確認し、同じ枠をクリックで追加できます。"
        />
      }
      selectedSlotsSection={
        <div className={styles.sectionStack}>
          <div
            className={styles.pendingSection({ pending: isPending })}
            aria-busy={isPending}
          >
            <SelectedSlotsPanel
              title="自分の提出枠"
              slots={draftSlots}
              minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
              emptyMessage="まだ提出枠がありません。右側からコピーするか、下のフォームで追加してください。"
              onRemoveSlot={(index) =>
                setDraftSlots((prev) =>
                  prev.filter((_, currentIndex) => currentIndex !== index),
                )
              }
              onMoveUp={(index) => moveSlot(index, -1)}
              onMoveDown={(index) => moveSlot(index, 1)}
            />
          </div>
          <AvailabilitySlotEditor
            selectedDate={selectedDate}
            onAddSlot={applySlotToggleOrInsert}
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
        <SelectedSlotsStickyBar
          slots={draftSlots}
          minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
          primaryActionLabel={isPending ? '保存中...' : '提出を保存'}
          onPrimaryAction={handleSave}
          primaryDisabled={isPending}
          sidebarToggleLabel={`他の人の枠 (${selectedDateSlotCount})`}
          onToggleSidebar={() => setMobileSidebarOpen((open) => !open)}
          sidebarOpen={mobileSidebarOpen}
        />
      }
    />
  );
};
