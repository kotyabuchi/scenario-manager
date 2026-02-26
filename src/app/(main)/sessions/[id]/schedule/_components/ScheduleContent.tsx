'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Clock } from '@phosphor-icons/react/ssr';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { createCandidatesAction } from '../actions';
import {
  type ScheduleCandidatesFormValues,
  scheduleCandidatesFormSchema,
} from '../schema';
import * as styles from '../styles';
import { SelectedDatesDisplay } from './SelectedDatesDisplay';

import { ScheduleCalendar } from '@/components/blocks/ScheduleCalendar';

import type { ScheduleCandidateWithResponses } from '../../../interface';

type ScheduleContentProps = {
  sessionId: string;
  sessionName: string;
  existingCandidates: ScheduleCandidateWithResponses[];
};

type TimeSettingMode = 'bulk' | 'individual';

const DEFAULT_START_TIME = '21:00';
const DEFAULT_END_TIME = '24:00';

const PARTICIPANT_DOT_COLORS = [
  '#60a5fa',
  '#fb923c',
  '#c084fc',
  '#f472b6',
  '#34d399',
  '#facc15',
] as const;

const TIME_OPTIONS = Array.from({ length: 17 }, (_, index) => {
  const totalMinutes = 18 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const combineDateAndTime = (date: Date, time: string): string => {
  const [hourText, minuteText] = time.split(':');
  const hours = Number.parseInt(hourText ?? '0', 10);
  const minutes = Number.parseInt(minuteText ?? '0', 10);

  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);

  return combined.toISOString();
};

const timeToMinutes = (time: string): number => {
  const [hourText, minuteText] = time.split(':');
  const hours = Number.parseInt(hourText ?? '0', 10);
  const minutes = Number.parseInt(minuteText ?? '0', 10);
  return hours * 60 + minutes;
};

export const ScheduleContent = ({
  sessionId,
  sessionName,
  existingCandidates,
}: ScheduleContentProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // カレンダーUIは標準フォーム入力ではないため日付選択は useState で管理し、
  // 送信フローのみ useForm + Zod バリデーションを経由する
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSettingMode, setTimeSettingMode] =
    useState<TimeSettingMode>('bulk');
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);

  const {
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ScheduleCandidatesFormValues>({
    resolver: zodResolver(scheduleCandidatesFormSchema),
    defaultValues: { candidates: [] },
  });

  const syncDatesToForm = (dates: Date[]) => {
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    setValue(
      'candidates',
      sorted.map((date) => ({
        candidateDate: combineDateAndTime(date, startTime),
        endTime: combineDateAndTime(date, endTime),
      })),
      { shouldValidate: dates.length > 0 },
    );
  };

  const handleDateSelect = (dates: Date[]) => {
    setSelectedDates(dates);
    syncDatesToForm(dates);
  };

  const handleRemoveDate = (dateToRemove: Date) => {
    const next = selectedDates.filter(
      (d) => d.getTime() !== dateToRemove.getTime(),
    );
    setSelectedDates(next);
    syncDatesToForm(next);
  };

  const onSubmit = (data: ScheduleCandidatesFormValues) => {
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('root', {
        message: '終了時刻は開始時刻より後を選択してください',
      });
      return;
    }

    clearErrors('root');

    startTransition(async () => {
      const result = await createCandidatesAction(sessionId, data);

      if (!result.success) {
        setError('root', {
          message: result.error?.message ?? '候補日の登録に失敗しました',
        });
      } else {
        router.push(`/sessions/${sessionId}`);
      }
    });
  };

  const participantColorMap = new Map<string, string>();
  const participantLegend: Array<{
    userId: string;
    userName: string;
    color: string;
  }> = [];

  for (const candidate of existingCandidates) {
    for (const response of candidate.responses) {
      const userId = response.user.userId;
      if (participantColorMap.has(userId)) {
        continue;
      }

      const color =
        PARTICIPANT_DOT_COLORS[
          participantLegend.length % PARTICIPANT_DOT_COLORS.length
        ] ?? PARTICIPANT_DOT_COLORS[0];
      participantColorMap.set(userId, color);
      participantLegend.push({
        userId,
        userName: response.user.userName,
        color,
      });
    }
  }

  const calendarMarkers: Record<string, { dots: string[] }> = {};
  for (const candidate of existingCandidates) {
    const key = toDateKey(new Date(candidate.candidateDate));
    const colors = Array.from(
      new Set(
        candidate.responses
          .map((response) => participantColorMap.get(response.user.userId))
          .filter((color): color is string => !isNil(color)),
      ),
    );

    if (colors.length === 0) {
      continue;
    }

    calendarMarkers[key] = { dots: colors };
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageHeader_title}>
            日程候補を選択してください
          </h1>
          <p className={styles.pageHeader_subtitle}>
            プレイヤーに提案する候補日を選びましょう
          </p>
          {!isNil(sessionName) && sessionName.length > 0 ? (
            <p className={styles.pageHeader_sessionName}>{sessionName}</p>
          ) : null}
        </div>

        <section className={styles.calendarSection} aria-label="カレンダー">
          <div className={styles.calendarWrap}>
            <ScheduleCalendar
              selectedDates={selectedDates}
              onSelect={handleDateSelect}
              multiple
              markers={calendarMarkers}
            />
          </div>

          {participantLegend.length > 0 ? (
            <fieldset className={styles.calendarLegend}>
              <legend className="sr-only">回答者凡例</legend>
              {participantLegend.slice(0, 4).map((participant) => (
                <span
                  key={participant.userId}
                  className={styles.calendarLegend_item}
                >
                  <span
                    className={styles.calendarLegend_dot}
                    style={{ backgroundColor: participant.color }}
                    aria-hidden="true"
                  />
                  {participant.userName}
                </span>
              ))}
            </fieldset>
          ) : null}
        </section>

        <div className={styles.sectionDivider} />

        <section className={styles.subSection} aria-label="選択中の日程">
          <h2 className={styles.subSection_title}>選択中の日程</h2>
          <SelectedDatesDisplay
            dates={selectedDates}
            onRemove={handleRemoveDate}
          />
        </section>

        <section className={styles.timeSection} aria-label="時間設定">
          <div className={styles.timeSection_headerRow}>
            <h2 className={styles.timeSection_title}>
              <Clock size={16} weight="duotone" />
              時間設定
            </h2>

            <fieldset className={styles.timeSection_modeToggle}>
              <legend className="sr-only">時間設定モード</legend>
              <button
                type="button"
                aria-pressed={timeSettingMode === 'bulk'}
                className={`${styles.timeSection_modeButton} ${
                  timeSettingMode === 'bulk'
                    ? styles.timeSection_modeButton_active
                    : ''
                }`}
                onClick={() => {
                  setTimeSettingMode('bulk');
                }}
              >
                一括設定
              </button>
              <button
                type="button"
                aria-pressed={timeSettingMode === 'individual'}
                className={`${styles.timeSection_modeButton} ${
                  timeSettingMode === 'individual'
                    ? styles.timeSection_modeButton_active
                    : ''
                }`}
                onClick={() => {
                  setTimeSettingMode('individual');
                }}
              >
                個別設定
              </button>
            </fieldset>
          </div>

          <div className={styles.timeSection_timeInputRow}>
            <div className={styles.timeSection_timeField}>
              <label
                htmlFor="schedule-start-time"
                className={styles.timeSection_dateLabel}
              >
                開始
              </label>
              <select
                id="schedule-start-time"
                className={styles.timeSection_timeInput}
                value={startTime}
                onChange={(event) => {
                  const nextTime = event.target.value;
                  setStartTime(nextTime);
                  if (selectedDates.length > 0) {
                    const sorted = [...selectedDates].sort(
                      (a, b) => a.getTime() - b.getTime(),
                    );
                    setValue(
                      'candidates',
                      sorted.map((date) => ({
                        candidateDate: combineDateAndTime(date, nextTime),
                        endTime: combineDateAndTime(date, endTime),
                      })),
                      { shouldValidate: true },
                    );
                  }
                }}
                disabled={isPending}
              >
                {TIME_OPTIONS.slice(0, 13).map((time) => (
                  <option key={`start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <span
              className={styles.timeSection_rangeSeparator}
              aria-hidden="true"
            >
              ~
            </span>

            <div className={styles.timeSection_timeField}>
              <label
                htmlFor="schedule-end-time"
                className={styles.timeSection_dateLabel}
              >
                終了
              </label>
              <select
                id="schedule-end-time"
                className={styles.timeSection_timeInput}
                value={endTime}
                onChange={(event) => {
                  const nextTime = event.target.value;
                  setEndTime(nextTime);
                  if (selectedDates.length > 0) {
                    const sorted = [...selectedDates].sort(
                      (a, b) => a.getTime() - b.getTime(),
                    );
                    setValue(
                      'candidates',
                      sorted.map((date) => ({
                        candidateDate: combineDateAndTime(date, startTime),
                        endTime: combineDateAndTime(date, nextTime),
                      })),
                      { shouldValidate: true },
                    );
                  }
                }}
                disabled={isPending}
              >
                {TIME_OPTIONS.filter((time) => time >= '21:00').map((time) => (
                  <option key={`end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {!isNil(errors.root?.message) && (
          <p role="alert" className={styles.serverError}>
            {errors.root.message}
          </p>
        )}
        {!isNil(errors.candidates?.message) && (
          <p role="alert" className={styles.serverError}>
            {errors.candidates.message}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={handleSubmit(onSubmit)}
            disabled={isPending || selectedDates.length === 0}
          >
            <CheckCircle size={18} weight="fill" />
            {isPending ? '登録中...' : '候補を確定する'}
          </button>
        </div>
      </div>
    </div>
  );
};

export type { ScheduleContentProps };
