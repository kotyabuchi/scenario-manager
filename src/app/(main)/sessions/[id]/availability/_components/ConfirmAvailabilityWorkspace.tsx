'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';

import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { BaseAvailabilityCalendar } from './BaseAvailabilityCalendar';
import { ConfirmSidebarContent } from './ConfirmSidebarContent';
import { SelectedSlotsPanel } from './SelectedSlotsPanel';
import { SelectedSlotsStickyBar } from './SelectedSlotsStickyBar';
import * as styles from './styles';

import {
  isOverlappingSlot,
  isSameSlot,
  sortSlotsByStart,
} from '@/lib/availability/slotUtils';
import { err, type Result } from '@/types/result';

import type {
  AvailabilitySlotInput,
  AvailabilityWorkspaceData,
  CalendarDayBadge,
  ConfirmedScheduleSlotRow,
  RecommendationGroup,
  RecommendationItem,
} from '../interface';

type ConfirmAvailabilityWorkspaceProps = {
  workspaceData: AvailabilityWorkspaceData;
  recommendationGroups: RecommendationGroup[];
  onConfirmSlots?: (
    slots: AvailabilitySlotInput[],
  ) =>
    | Promise<Result<ConfirmedScheduleSlotRow[]>>
    | Result<ConfirmedScheduleSlotRow[]>;
};

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');
const getLocalDateKeyFromIso = (iso: string): string =>
  format(new Date(iso), 'yyyy-MM-dd');

const buildConfirmDayBadges = (
  workspaceData: AvailabilityWorkspaceData,
  selectedSlots: AvailabilitySlotInput[],
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
    ...workspaceData.myAvailabilitySlots.map((slot) => ({
      startAt: slot.startAt,
      endAt: slot.endAt,
      participantType: workspaceData.currentUserParticipantType,
    })),
    ...workspaceData.otherUserAvailabilitySlots.map((slot) => ({
      startAt: slot.startAt,
      endAt: slot.endAt,
      participantType: slot.participantType,
    })),
  ];

  for (const slot of allAvailability) {
    const item = touch(getLocalDateKeyFromIso(slot.startAt));
    item.submissions += 1;
    item.overlapStrong += 1;
    item.markers.add(
      slot.participantType === 'SPECTATOR' ? '#f59e0b' : '#60a5fa',
    );
  }

  for (const group of recommendationGroups) {
    for (const recommendation of group.items) {
      for (const slot of recommendation.slots) {
        const item = touch(getLocalDateKeyFromIso(slot.startAt));
        item.markers.add(group.group === 'all_users' ? '#10b981' : '#a855f7');
      }
    }
  }

  for (const slot of selectedSlots) {
    const item = touch(getLocalDateKeyFromIso(slot.startAt));
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

const normalizeSlots = (
  slots: AvailabilitySlotInput[],
): AvailabilitySlotInput[] =>
  sortSlotsByStart(
    slots.map((slot) => ({ startAt: slot.startAt, endAt: slot.endAt })),
  );

const toggleRecommendationSlots = (
  currentSlots: AvailabilitySlotInput[],
  item: RecommendationItem,
): Result<AvailabilitySlotInput[]> => {
  const allSelected = item.slots.every((slot) =>
    currentSlots.some((current) => isSameSlot(current, slot)),
  );

  if (allSelected) {
    return {
      success: true,
      data: currentSlots.filter(
        (current) => !item.slots.some((slot) => isSameSlot(current, slot)),
      ),
    };
  }

  const slotsToAdd = item.slots.filter(
    (slot) => !currentSlots.some((current) => isSameSlot(current, slot)),
  );

  for (const nextSlot of slotsToAdd) {
    const overlaps = currentSlots.some(
      (current) =>
        !isSameSlot(current, nextSlot) && isOverlappingSlot(current, nextSlot),
    );
    if (overlaps) {
      return err(
        new Error('選択中の日程と時間が重複するため、この候補は追加できません'),
      );
    }
  }

  return {
    success: true,
    data: normalizeSlots([...currentSlots, ...slotsToAdd]),
  };
};

export const ConfirmAvailabilityWorkspace = ({
  workspaceData,
  recommendationGroups,
  onConfirmSlots,
}: ConfirmAvailabilityWorkspaceProps) => {
  const initialSlots = workspaceData.confirmedScheduleSlots.map((slot) => ({
    startAt: slot.startAt,
    endAt: slot.endAt,
  }));

  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlotInput[]>(
    normalizeSlots(initialSlots),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialSlots[0]
      ? new Date(initialSlots[0].startAt)
      : recommendationGroups[0]?.items[0]?.slots[0]
        ? new Date(recommendationGroups[0].items[0].slots[0].startAt)
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
    selectedSlots,
    recommendationGroups,
  );

  const handleToggleRecommendation = (item: RecommendationItem) => {
    const result = toggleRecommendationSlots(selectedSlots, item);
    if (!result.success) {
      setMessage({ tone: 'error', text: result.error.message });
      return;
    }

    setSelectedSlots(result.data);
    const firstSlot = item.slots[0];
    if (firstSlot) {
      setSelectedDate(new Date(firstSlot.startAt));
    }
    setMessage(null);
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    setSelectedSlots((prev) => {
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

  const handleConfirm = () => {
    if (!onConfirmSlots) {
      setMessage({
        tone: 'success',
        text: 'Storybookモードのため確定保存は実行していません。',
      });
      return;
    }

    startTransition(async () => {
      const result = await onConfirmSlots(selectedSlots);
      if (!result.success) {
        setMessage({ tone: 'error', text: result.error.message });
        return;
      }

      setSelectedSlots(
        normalizeSlots(
          result.data.map((slot) => ({
            startAt: slot.startAt,
            endAt: slot.endAt,
          })),
        ),
      );
      setMessage({ tone: 'success', text: '確定日程を保存しました。' });
    });
  };

  const selectedDateRecommendationCount = selectedDate
    ? recommendationGroups.reduce(
        (count, group) =>
          count +
          group.items.filter((item) =>
            item.slots.some(
              (slot) =>
                getLocalDateKeyFromIso(slot.startAt) ===
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
      selectedSlots={selectedSlots}
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
          helperText="日単位で提出密度を見つつ、右側のおすすめ候補をクリックして確定枠を選びます。"
        />
      }
      selectedSlotsSection={
        <div className={styles.sectionStack}>
          <SelectedSlotsPanel
            title="確定候補"
            slots={selectedSlots}
            minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
            emptyMessage="おすすめ一覧から候補を選択してください。"
            onRemoveSlot={(index) =>
              setSelectedSlots((prev) =>
                prev.filter((_, currentIndex) => currentIndex !== index),
              )
            }
            onMoveUp={(index) => moveSlot(index, -1)}
            onMoveDown={(index) => moveSlot(index, 1)}
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
          slots={selectedSlots}
          minPlaytimeMinutes={workspaceData.minPlaytimeMinutes}
          primaryActionLabel={isPending ? '保存中...' : '日程を確定'}
          onPrimaryAction={handleConfirm}
          primaryDisabled={isPending || selectedSlots.length === 0}
          sidebarToggleLabel={`おすすめ (${selectedDateRecommendationCount})`}
          onToggleSidebar={() => setMobileSidebarOpen((open) => !open)}
          sidebarOpen={mobileSidebarOpen}
        />
      }
    />
  );
};
