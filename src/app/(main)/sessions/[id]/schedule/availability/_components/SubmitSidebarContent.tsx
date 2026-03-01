'use client';

import * as styles from './styles';
import { formatTimeBlockDateTimeRange } from './timeBlockPresentation';

import { isSameTimeBlock } from '@/lib/availability/timeBlockUtils';

import type {
  AvailabilityTimeBlockInput,
  AvailabilityTimeBlockWithUser,
  ParticipantType,
} from '../interface';

type SubmitSidebarContentProps = {
  myTimeBlocks: AvailabilityTimeBlockInput[];
  otherUserTimeBlocks: AvailabilityTimeBlockWithUser[];
  onClickTimeBlock: (timeBlock: AvailabilityTimeBlockInput) => void;
  errorMessage?: string | null;
};

type GroupedTimeBlock = {
  startAt: string;
  endAt: string;
  users: {
    userName: string;
    participantType: ParticipantType;
    isHost: boolean;
  }[];
};

const getRoleLabel = (
  participantType: ParticipantType,
  isHost: boolean,
): string => {
  if (isHost) {
    return '主催者';
  }
  if (participantType === 'KEEPER') {
    return 'GM/KP';
  }
  if (participantType === 'SPECTATOR') {
    return '見学';
  }
  return 'PL';
};

const groupTimeBlocks = (
  blocks: AvailabilityTimeBlockWithUser[],
): GroupedTimeBlock[] => {
  const map = new Map<string, GroupedTimeBlock>();

  for (const block of blocks) {
    const key = `${block.startAt}|${block.endAt}`;
    const existing = map.get(key);
    const user = {
      userName: block.userName,
      participantType: block.participantType,
      isHost: block.isHost,
    };

    if (existing) {
      existing.users.push(user);
    } else {
      map.set(key, {
        startAt: block.startAt,
        endAt: block.endAt,
        users: [user],
      });
    }
  }

  return [...map.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
};

export const SubmitSidebarContent = ({
  myTimeBlocks,
  otherUserTimeBlocks,
  onClickTimeBlock,
  errorMessage,
}: SubmitSidebarContentProps) => {
  const grouped = groupTimeBlocks(otherUserTimeBlocks);

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
          {grouped.length}件
        </span>
      </div>

      {errorMessage ? (
        <p className={styles.messageBox({ tone: 'error' })}>{errorMessage}</p>
      ) : null}

      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          他ユーザーのスケジュールがありません。
        </div>
      ) : (
        <ul className={styles.sidebarList}>
          {grouped.map((group) => {
            const state = myTimeBlocks.some((myBlock) =>
              isSameTimeBlock(myBlock, {
                startAt: group.startAt,
                endAt: group.endAt,
              }),
            )
              ? 'selected'
              : 'default';
            const label = formatTimeBlockDateTimeRange({
              startAt: group.startAt,
              endAt: group.endAt,
            });

            return (
              <li key={`${group.startAt}-${group.endAt}`}>
                <button
                  type="button"
                  className={styles.sidebarItemButton({ state })}
                  onClick={() =>
                    onClickTimeBlock({
                      startAt: group.startAt,
                      endAt: group.endAt,
                    })
                  }
                >
                  <span className={styles.sidebarItemTitle}>
                    {label.primary}
                  </span>
                  <span className={styles.sidebarItemMeta}>
                    <span>{label.secondary}</span>
                    <span className={styles.tagBadge({ tone: 'neutral' })}>
                      {group.users.length}名
                    </span>
                    {group.users.map((user) => (
                      <span key={user.userName}>
                        <span className={styles.tagBadge({ tone: 'accent' })}>
                          {getRoleLabel(user.participantType, user.isHost)}
                        </span>{' '}
                        {user.userName}
                      </span>
                    ))}
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
