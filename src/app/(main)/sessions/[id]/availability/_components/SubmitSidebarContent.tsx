'use client';

import { format } from 'date-fns';

import { formatSlotDateTimeRange } from './slotPresentation';
import * as styles from './styles';

import { isSameSlot } from '@/lib/availability/slotUtils';

import type {
  AvailabilitySlotInput,
  AvailabilitySlotWithUser,
} from '../interface';

type SubmitSidebarContentProps = {
  selectedDate: Date | null;
  mySlots: AvailabilitySlotInput[];
  otherUserSlots: AvailabilitySlotWithUser[];
  onClickSlot: (slot: AvailabilitySlotInput) => void;
  errorMessage?: string | null;
};

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const getRoleLabel = (slot: AvailabilitySlotWithUser): string => {
  if (slot.isHost) {
    return '主催者';
  }
  if (slot.participantType === 'KEEPER') {
    return 'GM/KP';
  }
  if (slot.participantType === 'SPECTATOR') {
    return '見学';
  }
  return 'PL';
};

export const SubmitSidebarContent = ({
  selectedDate,
  mySlots,
  otherUserSlots,
  onClickSlot,
  errorMessage,
}: SubmitSidebarContentProps) => {
  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null;
  const visibleSlots = otherUserSlots.filter((slot) =>
    selectedDateKey ? slot.startAt.slice(0, 10) === selectedDateKey : true,
  );

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionTitle}>他の人の提出枠</p>
          <p className={styles.helperText}>
            クリックで同じ枠を自分の提出枠に追加 / 解除
          </p>
        </div>
        <span className={styles.tagBadge({ tone: 'neutral' })}>
          {visibleSlots.length}件
        </span>
      </div>

      {errorMessage ? (
        <p className={styles.messageBox({ tone: 'error' })}>{errorMessage}</p>
      ) : null}

      {visibleSlots.length === 0 ? (
        <div className={styles.emptyState}>
          {selectedDate
            ? '選択中の日付には他ユーザーの提出枠がありません。'
            : '提出枠がありません。'}
        </div>
      ) : (
        <ul className={styles.sidebarList}>
          {visibleSlots.map((slot) => {
            const state = mySlots.some((mySlot) =>
              isSameSlot(mySlot, { startAt: slot.startAt, endAt: slot.endAt }),
            )
              ? 'selected'
              : 'default';
            const label = formatSlotDateTimeRange({
              startAt: slot.startAt,
              endAt: slot.endAt,
            });

            return (
              <li key={slot.availabilitySlotId}>
                <button
                  type="button"
                  className={styles.sidebarItemButton({ state })}
                  onClick={() =>
                    onClickSlot({ startAt: slot.startAt, endAt: slot.endAt })
                  }
                >
                  <span className={styles.sidebarItemTitle}>
                    {label.primary}
                  </span>
                  <span className={styles.sidebarItemMeta}>
                    <span>{label.secondary}</span>
                    <span className={styles.tagBadge({ tone: 'accent' })}>
                      {getRoleLabel(slot)}
                    </span>
                    <span>{slot.userName}</span>
                    {state === 'selected' ? (
                      <span className={styles.tagBadge({ tone: 'success' })}>
                        選択中
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
