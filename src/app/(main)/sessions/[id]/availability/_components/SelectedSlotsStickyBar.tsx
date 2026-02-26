'use client';

import {
  calcSelectedSlotsTotalMinutes,
  formatMinutesLabel,
  getProgressStatus,
} from './slotPresentation';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

import type { AvailabilitySlotInput } from '../interface';

type SelectedSlotsStickyBarProps = {
  slots: AvailabilitySlotInput[];
  minPlaytimeMinutes: number | null;
  primaryActionLabel: string;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  sidebarToggleLabel?: string;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
};

export const SelectedSlotsStickyBar = ({
  slots,
  minPlaytimeMinutes,
  primaryActionLabel,
  onPrimaryAction,
  primaryDisabled = false,
  sidebarToggleLabel,
  onToggleSidebar,
  sidebarOpen = false,
}: SelectedSlotsStickyBarProps) => {
  const totalMinutes = calcSelectedSlotsTotalMinutes(slots);
  const progressStatus = getProgressStatus(totalMinutes, minPlaytimeMinutes);

  return (
    <div className={styles.stickyBar}>
      <div className={styles.stickyBarInner}>
        <div className={styles.stickySummaryRow}>
          <div className={styles.stickySummaryText} aria-live="polite">
            <span className={styles.stickySummaryStrong}>
              {slots.length}枠 / 合計 {formatMinutesLabel(totalMinutes)}
            </span>
            <span>
              {minPlaytimeMinutes === null
                ? '最低プレイ時間は未設定です'
                : `最低 ${formatMinutesLabel(minPlaytimeMinutes)} ${
                    totalMinutes >= minPlaytimeMinutes ? '達成' : '未達成'
                  }`}
            </span>
          </div>
          <span className={styles.progressBadge({ status: progressStatus })}>
            {minPlaytimeMinutes === null
              ? '未設定'
              : totalMinutes >= minPlaytimeMinutes
                ? 'OK'
                : '不足'}
          </span>
        </div>

        <div className={styles.stickyActions}>
          {sidebarToggleLabel ? (
            <Button
              type="button"
              variant="outline"
              status="primary"
              onClick={onToggleSidebar}
              aria-expanded={sidebarOpen}
              size="sm"
            >
              {sidebarOpen
                ? `${sidebarToggleLabel}を閉じる`
                : sidebarToggleLabel}
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            status="primary"
            onClick={onPrimaryAction}
            disabled={primaryDisabled}
            size="sm"
          >
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
