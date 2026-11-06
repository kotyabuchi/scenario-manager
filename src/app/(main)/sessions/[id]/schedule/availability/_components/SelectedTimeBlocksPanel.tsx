'use client';

import { Trash } from '@phosphor-icons/react/ssr';

import * as styles from './styles';
import {
  calcSelectedTimeBlocksTotalMinutes,
  formatMinutesLabel,
  formatTimeBlockDateTimeRange,
  getProgressStatus,
} from './timeBlockPresentation';

import type { AvailabilityTimeBlockInput } from '../interface';

type SelectedTimeBlocksPanelProps = {
  timeBlocks: AvailabilityTimeBlockInput[];
  minPlaytimeMinutes: number | null;
  title?: string;
  emptyMessage?: string;
  onRemoveTimeBlock?: (index: number) => void;
  readOnly?: boolean;
};

export const SelectedTimeBlocksPanel = ({
  timeBlocks,
  minPlaytimeMinutes,
  title = '選択中の日程',
  emptyMessage = '日程がまだ選択されていません。',
  onRemoveTimeBlock,
  readOnly = false,
}: SelectedTimeBlocksPanelProps) => {
  const totalMinutes = calcSelectedTimeBlocksTotalMinutes(timeBlocks);
  const progressStatus = getProgressStatus(totalMinutes, minPlaytimeMinutes);

  return (
    <div className={styles.selectedTimeBlocksPanel}>
      <div className={styles.selectedTimeBlocksSummary}>
        <div className={styles.selectedTimeBlocksSummaryRow}>
          <span className={styles.cardTitle}>{title}</span>
          <span className={styles.progressBadge({ status: progressStatus })}>
            {minPlaytimeMinutes === null
              ? '最低時間未設定'
              : totalMinutes >= minPlaytimeMinutes
                ? '最低時間達成'
                : '時間不足'}
          </span>
        </div>

        <div className={styles.selectedTimeBlocksSummaryRow} aria-live="polite">
          <span>
            合計 {formatMinutesLabel(totalMinutes)}
            {minPlaytimeMinutes === null
              ? ''
              : ` / 最低 ${formatMinutesLabel(minPlaytimeMinutes)}`}
          </span>
          <span className={styles.summaryValueStrong}>
            {timeBlocks.length}件
          </span>
        </div>
      </div>

      {timeBlocks.length === 0 ? (
        <div className={styles.emptyState}>{emptyMessage}</div>
      ) : (
        <ul className={styles.timeBlockList}>
          {timeBlocks.map((block, index) => {
            const label = formatTimeBlockDateTimeRange(block);
            return (
              <li
                key={`${block.startAt}-${block.endAt}`}
                className={styles.timeBlockListItem}
              >
                <div className={styles.timeBlockListItemMain}>
                  <p className={styles.timeBlockListItemLabel}>
                    {label.primary}
                  </p>
                  <p className={styles.timeBlockListItemSub}>
                    {label.secondary}
                  </p>
                </div>

                {!readOnly ? (
                  <div className={styles.timeBlockListItemActions}>
                    <button
                      type="button"
                      className={styles.miniButton}
                      aria-label="削除"
                      onClick={() => onRemoveTimeBlock?.(index)}
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
