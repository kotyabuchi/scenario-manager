'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { hasThirtyMinuteBoundary } from '@/lib/availability/timeBlockUtils';

import type { AvailabilityTimeBlockInput } from '../interface';

type AvailabilityTimeBlockEditorProps = {
  selectedDate: Date | null;
  onAddTimeBlock: (
    timeBlock: AvailabilityTimeBlockInput,
  ) => { ok: true } | { ok: false; message: string };
  disabled?: boolean;
};

const toLocalDateTimeValue = (date: Date): string =>
  format(date, "yyyy-MM-dd'T'HH:mm");

const startFromSelectedDate = (selectedDate: Date | null): Date => {
  const base = selectedDate ? new Date(selectedDate) : new Date();
  base.setMinutes(base.getMinutes() < 30 ? 0 : 30, 0, 0);
  if (base.getHours() < 9) {
    base.setHours(9, 0, 0, 0);
  }
  return base;
};

/** 分を最寄りの30分境界に四捨五入する */
const roundToNearest30 = (value: string): string => {
  if (!value) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const minutes = date.getMinutes();
  const rounded = minutes < 15 ? 0 : minutes < 45 ? 30 : 60;
  date.setMinutes(rounded, 0, 0);
  return toLocalDateTimeValue(date);
};

export const AvailabilityTimeBlockEditor = ({
  selectedDate,
  onAddTimeBlock,
  disabled = false,
}: AvailabilityTimeBlockEditorProps) => {
  const [startValue, setStartValue] = useState<string>('');
  const [endValue, setEndValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextStart = startFromSelectedDate(selectedDate);
    const nextEnd = new Date(nextStart);
    nextEnd.setHours(nextStart.getHours() + 3);

    setStartValue(toLocalDateTimeValue(nextStart));
    setEndValue(toLocalDateTimeValue(nextEnd));
    setErrorMessage(null);
  }, [selectedDate]);

  const handleAdd = () => {
    if (!startValue || !endValue) {
      setErrorMessage('開始・終了日時を入力してください');
      return;
    }

    const startAt = new Date(startValue).toISOString();
    const endAt = new Date(endValue).toISOString();
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setErrorMessage('日時形式が不正です');
      return;
    }
    if (startMs >= endMs) {
      setErrorMessage('終了日時は開始日時より後にしてください');
      return;
    }
    if (!hasThirtyMinuteBoundary(startAt) || !hasThirtyMinuteBoundary(endAt)) {
      setErrorMessage('30分単位で指定してください');
      return;
    }

    const result = onAddTimeBlock({ startAt, endAt });
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    setErrorMessage(null);
  };

  return (
    <section
      className={styles.sectionStack}
      aria-labelledby="availability-time-block-editor-title"
    >
      <div className={styles.sectionHeader}>
        <h3
          id="availability-time-block-editor-title"
          className={styles.sectionTitle}
        >
          スケジュールを追加
        </h3>
        <p className={styles.helperText}>30分単位 / 日跨ぎ可</p>
      </div>

      <div className={styles.fieldset}>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            開始
            <input
              type="datetime-local"
              className={styles.input}
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              onBlur={() => setStartValue(roundToNearest30(startValue))}
              step={1800}
              disabled={disabled}
            />
          </label>
          <label className={styles.fieldLabel}>
            終了
            <input
              type="datetime-local"
              className={styles.input}
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              onBlur={() => setEndValue(roundToNearest30(endValue))}
              step={1800}
              disabled={disabled}
            />
          </label>
          <Button
            type="button"
            status="primary"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
          >
            追加
          </Button>
        </div>

        {errorMessage ? (
          <p role="alert" className={styles.inlineError}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
};
