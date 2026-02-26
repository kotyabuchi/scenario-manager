'use client';

import { X } from '@phosphor-icons/react/ssr';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import * as styles from '../styles';

type SelectedDatesDisplayProps = {
  dates: Date[];
  onRemove: (date: Date) => void;
};

/**
 * 選択済みの候補日をタグ形式で表示するコンポーネント
 */
export const SelectedDatesDisplay = ({
  dates,
  onRemove,
}: SelectedDatesDisplayProps) => {
  if (dates.length === 0) {
    return (
      <p className={styles.selectedDates_empty}>
        カレンダーから候補日を選択してください
      </p>
    );
  }

  return (
    <div className={styles.selectedDates}>
      {dates
        .toSorted((a, b) => a.getTime() - b.getTime())
        .map((date) => (
          <span key={date.toISOString()} className={styles.selectedDates_tag}>
            {format(date, 'M/d (E)', { locale: ja })}
            <button
              type="button"
              className={styles.selectedDates_removeButton}
              onClick={() => onRemove(date)}
              aria-label={`${format(date, 'M月d日', { locale: ja })}を削除`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
    </div>
  );
};
