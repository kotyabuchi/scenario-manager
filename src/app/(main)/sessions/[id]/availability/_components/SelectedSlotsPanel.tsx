'use client';

import { CaretDown, CaretUp, Trash } from '@phosphor-icons/react/ssr';

import * as styles from './styles';
import {
  calcSelectedTimeBlocksTotalMinutes,
  formatMinutesLabel,
  formatTimeBlockDateTimeRange,
  getProgressStatus,
} from './timeBlockPresentation';

import type { AvailabilityTimeBlockInput } from '../interface';

type SelectedSlotsPanelProps = {
  slots: AvailabilityTimeBlockInput[];
  minPlaytimeMinutes: number | null;
  title?: string;
  emptyMessage?: string;
  onRemoveSlot?: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  readOnly?: boolean;
};

export const SelectedSlotsPanel = ({
  slots,
  minPlaytimeMinutes,
  title = '選択中の日程',
  emptyMessage = '日程枠がまだ選択されていません。',
  onRemoveSlot,
  onMoveUp,
  onMoveDown,
  readOnly = false,
}: SelectedSlotsPanelProps) => {
  const totalMinutes = calcSelectedTimeBlocksTotalMinutes(slots);
  const progressStatus = getProgressStatus(totalMinutes, minPlaytimeMinutes);

  return (
    <div className={styles.selectedSlotsPanel}>
      <div className={styles.selectedSlotsSummary}>
        <div className={styles.selectedSlotsSummaryRow}>
          <span className={styles.cardTitle}>{title}</span>
          <span className={styles.progressBadge({ status: progressStatus })}>
            {minPlaytimeMinutes === null
              ? '最低時間未設定'
              : totalMinutes >= minPlaytimeMinutes
                ? '最低時間達成'
                : '時間不足'}
          </span>
        </div>

        <div className={styles.selectedSlotsSummaryRow} aria-live="polite">
          <span>
            合計 {formatMinutesLabel(totalMinutes)}
            {minPlaytimeMinutes === null
              ? ''
              : ` / 最低 ${formatMinutesLabel(minPlaytimeMinutes)}`}
          </span>
          <span className={styles.summaryValueStrong}>{slots.length}枠</span>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className={styles.emptyState}>{emptyMessage}</div>
      ) : (
        <ul className={styles.slotList}>
          {slots.map((slot, index) => {
            const label = formatTimeBlockDateTimeRange(slot);
            return (
              <li
                key={`${slot.startAt}-${slot.endAt}`}
                className={styles.slotListItem}
              >
                <div className={styles.slotListItemMain}>
                  <p className={styles.slotListItemLabel}>{label.primary}</p>
                  <p className={styles.slotListItemSub}>{label.secondary}</p>
                </div>

                {!readOnly ? (
                  <div className={styles.slotListItemActions}>
                    <button
                      type="button"
                      className={styles.miniButton}
                      aria-label="上に移動"
                      onClick={() => onMoveUp?.(index)}
                      disabled={index === 0}
                    >
                      <CaretUp size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.miniButton}
                      aria-label="下に移動"
                      onClick={() => onMoveDown?.(index)}
                      disabled={index === slots.length - 1}
                    >
                      <CaretDown size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.miniButton}
                      aria-label="削除"
                      onClick={() => onRemoveSlot?.(index)}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
