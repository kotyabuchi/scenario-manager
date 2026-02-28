'use client';

import { format } from 'date-fns';

import * as styles from './styles';
import { formatTimeBlockDateTimeRange } from './timeBlockPresentation';

import { isSameTimeBlock } from '@/lib/availability/timeBlockUtils';

import type {
  AvailabilityTimeBlockInput,
  AvailabilityTimeBlockWithUser,
} from '../interface';

type SubmitSidebarContentProps = {
  selectedDate: Date | null;
  myTimeBlocks: AvailabilityTimeBlockInput[];
  otherUserTimeBlocks: AvailabilityTimeBlockWithUser[];
  onClickTimeBlock: (timeBlock: AvailabilityTimeBlockInput) => void;
  errorMessage?: string | null;
};

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const getRoleLabel = (block: AvailabilityTimeBlockWithUser): string => {
  if (block.isHost) {
    return '主催者';
  }
  if (block.participantType === 'KEEPER') {
    return 'GM/KP';
  }
  if (block.participantType === 'SPECTATOR') {
    return '見学';
  }
  return 'PL';
};

export const SubmitSidebarContent = ({
  selectedDate,
  myTimeBlocks,
  otherUserTimeBlocks,
  onClickTimeBlock,
  errorMessage,
}: SubmitSidebarContentProps) => {
  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null;
  const visibleTimeBlocks = otherUserTimeBlocks.filter((block) =>
    selectedDateKey ? block.startAt.slice(0, 10) === selectedDateKey : true,
  );

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionTitle}>他の人のスケジュール</p>
          <p className={styles.helperText}>
            クリックで同じ時間帯を自分のスケジュールに追加 / 解除
          </p>
        </div>
        <span className={styles.tagBadge({ tone: 'neutral' })}>
          {visibleTimeBlocks.length}件
        </span>
      </div>

      {errorMessage ? (
        <p className={styles.messageBox({ tone: 'error' })}>{errorMessage}</p>
      ) : null}

      {visibleTimeBlocks.length === 0 ? (
        <div className={styles.emptyState}>
          {selectedDate
            ? '選択中の日付には他ユーザーのスケジュールがありません。'
            : 'スケジュールがありません。'}
        </div>
      ) : (
        <ul className={styles.sidebarList}>
          {visibleTimeBlocks.map((block) => {
            const state = myTimeBlocks.some((myBlock) =>
              isSameTimeBlock(myBlock, {
                startAt: block.startAt,
                endAt: block.endAt,
              }),
            )
              ? 'selected'
              : 'default';
            const label = formatTimeBlockDateTimeRange({
              startAt: block.startAt,
              endAt: block.endAt,
            });

            return (
              <li key={block.availabilityTimeBlockId}>
                <button
                  type="button"
                  className={styles.sidebarItemButton({ state })}
                  onClick={() =>
                    onClickTimeBlock({
                      startAt: block.startAt,
                      endAt: block.endAt,
                    })
                  }
                >
                  <span className={styles.sidebarItemTitle}>
                    {label.primary}
                  </span>
                  <span className={styles.sidebarItemMeta}>
                    <span>{label.secondary}</span>
                    <span className={styles.tagBadge({ tone: 'accent' })}>
                      {getRoleLabel(block)}
                    </span>
                    <span>{block.userName}</span>
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
