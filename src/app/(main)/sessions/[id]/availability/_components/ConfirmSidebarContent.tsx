'use client';

import * as styles from './styles';
import {
  formatMinutesLabel,
  formatTimeBlockDateTimeRange,
} from './timeBlockPresentation';

import { isSameTimeBlock } from '@/lib/availability/timeBlockUtils';

import type {
  AvailabilityTimeBlockInput,
  RecommendationGroup,
  RecommendationItem,
} from '../interface';

type ConfirmSidebarContentProps = {
  groups: RecommendationGroup[];
  selectedTimeBlocks: AvailabilityTimeBlockInput[];
  onClickRecommendation: (item: RecommendationItem) => void;
  emptyMessage?: string;
  errorMessage?: string | null;
};

const getItemState = (
  item: RecommendationItem,
  selectedTimeBlocks: AvailabilityTimeBlockInput[],
): 'default' | 'selected' | 'partial' => {
  const selectedCount = item.timeBlocks.filter((block) =>
    selectedTimeBlocks.some((selected) => isSameTimeBlock(selected, block)),
  ).length;

  if (selectedCount === 0) {
    return 'default';
  }
  if (selectedCount === item.timeBlocks.length) {
    return 'selected';
  }
  return 'partial';
};

const coverageLabel = (item: RecommendationItem): string => {
  const { coverage } = item;
  if (item.group === 'all_users') {
    return `全員参加可 (${coverage.coveredRequiredUsers + coverage.coveredSpectators}/${coverage.totalRequiredUsers + coverage.totalSpectators})`;
  }
  return `必須参加者 ${coverage.coveredRequiredUsers}/${coverage.totalRequiredUsers}`;
};

export const ConfirmSidebarContent = ({
  groups,
  selectedTimeBlocks,
  onClickRecommendation,
  emptyMessage = 'スケジュールが不足しています。参加者の提出後におすすめ候補を表示します。',
  errorMessage,
}: ConfirmSidebarContentProps) => {
  if (groups.length === 0) {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionTitle}>おすすめ候補</p>
            <p className={styles.helperText}>
              集計ロジックから算出した候補を表示します
            </p>
          </div>
        </div>
        {errorMessage ? (
          <p className={styles.messageBox({ tone: 'error' })}>{errorMessage}</p>
        ) : null}
        <div className={styles.emptyState}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionTitle}>おすすめ候補</p>
          <p className={styles.helperText}>クリックで確定候補に追加 / 解除</p>
        </div>
        <span className={styles.tagBadge({ tone: 'neutral' })}>
          {groups.reduce((total, group) => total + group.items.length, 0)}件
        </span>
      </div>

      {errorMessage ? (
        <p className={styles.messageBox({ tone: 'error' })}>{errorMessage}</p>
      ) : null}

      {groups.map((group) => (
        <section key={group.group} className={styles.recommendationGroup}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>{group.title}</h3>
              {group.note ? (
                <p className={styles.recommendationGroupNote}>{group.note}</p>
              ) : null}
            </div>
            <span className={styles.tagBadge({ tone: 'neutral' })}>
              {group.items.length}
            </span>
          </div>

          <ul className={styles.sidebarList}>
            {group.items.map((item) => {
              const state = getItemState(item, selectedTimeBlocks);
              const primaryTimeBlock = item.timeBlocks[0];
              const timeBlockLabel = primaryTimeBlock
                ? formatTimeBlockDateTimeRange(primaryTimeBlock)
                : { primary: '-', secondary: '-' };

              return (
                <li key={item.recommendationId}>
                  <button
                    type="button"
                    className={styles.sidebarItemButton({ state })}
                    onClick={() => onClickRecommendation(item)}
                  >
                    <span className={styles.sidebarItemTitle}>
                      {item.kind === 'combo'
                        ? `${item.timeBlocks.length}件セット / 合計 ${formatMinutesLabel(item.totalMinutes)}`
                        : timeBlockLabel.primary}
                    </span>

                    <span className={styles.sidebarItemMeta}>
                      {item.kind === 'combo' ? (
                        <>
                          <span>{formatMinutesLabel(item.totalMinutes)}</span>
                          {item.timeBlocks.length > 0 ? (
                            <span>先頭: {timeBlockLabel.primary}</span>
                          ) : null}
                        </>
                      ) : (
                        <span>{timeBlockLabel.secondary}</span>
                      )}
                      <span className={styles.tagBadge({ tone: 'accent' })}>
                        {coverageLabel(item)}
                      </span>
                      {item.meetsMinPlaytime ? (
                        <span className={styles.tagBadge({ tone: 'success' })}>
                          最低時間達成
                        </span>
                      ) : null}
                      {state === 'partial' ? (
                        <span className={styles.tagBadge({ tone: 'caution' })}>
                          一部選択
                        </span>
                      ) : state === 'selected' ? (
                        <span className={styles.tagBadge({ tone: 'success' })}>
                          選択中
                        </span>
                      ) : null}
                    </span>

                    {item.reasonLabels.length > 0 ? (
                      <span className={styles.sidebarItemMeta}>
                        {item.reasonLabels.slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className={styles.tagBadge({ tone: 'neutral' })}
                          >
                            {label}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
