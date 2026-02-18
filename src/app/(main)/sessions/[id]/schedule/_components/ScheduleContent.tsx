'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Calendar, CheckCircle } from '@phosphor-icons/react/ssr';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
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
import { Button } from '@/components/elements/button/button';

import type { ScheduleCandidateWithResponses } from '../../../interface';

type ScheduleContentProps = {
  sessionId: string;
  sessionName: string;
  existingCandidates: ScheduleCandidateWithResponses[];
};

/**
 * 日付を日本語フォーマットで表示する
 */
const formatCandidateDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return format(date, 'M月d日（E）', { locale: ja });
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

  const {
    setValue,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ScheduleCandidatesFormValues>({
    resolver: zodResolver(scheduleCandidatesFormSchema),
    defaultValues: { candidates: [] },
  });

  const syncDatesToForm = (dates: Date[]) => {
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    setValue(
      'candidates',
      sorted.map((date) => ({ candidateDate: date.toISOString() })),
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

  return (
    <div className={styles.pageContainer}>
      {/* 戻るリンク */}
      <Link href={`/sessions/${sessionId}`} className={styles.backLink}>
        <ArrowLeft size={14} />
        セッション詳細に戻る
      </Link>

      {/* ページヘッダー */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageHeader_title}>日程候補の選択</h1>
        <p className={styles.pageHeader_subtitle}>{sessionName}</p>
      </div>

      {/* 既存候補がある場合 */}
      {existingCandidates.length > 0 && (
        <section className={styles.existingCandidates}>
          <h2 className={styles.existingCandidates_title}>
            <Calendar size={20} />
            登録済みの候補日（{existingCandidates.length}件）
          </h2>
          <div className={styles.existingCandidates_list}>
            {existingCandidates.map((candidate) => (
              <div
                key={candidate.candidateId}
                className={styles.existingCandidates_item}
              >
                <span className={styles.existingCandidates_date}>
                  {formatCandidateDate(candidate.candidateDate)}
                </span>
                <div className={styles.existingCandidates_stats}>
                  <span>
                    <span className="sr-only">参加可能: </span>○{' '}
                    {candidate.okCount}
                  </span>
                  <span>
                    <span className="sr-only">条件付き: </span>△{' '}
                    {candidate.maybeCount}
                  </span>
                  <span>
                    <span className="sr-only">参加不可: </span>×{' '}
                    {candidate.ngCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* カレンダーセクション */}
      <section className={styles.calendarSection}>
        <h2 className={styles.calendarSection_title}>
          {existingCandidates.length > 0
            ? '候補日を追加する'
            : '候補日を選択してください'}
        </h2>

        <ScheduleCalendar
          selectedDates={selectedDates}
          onSelect={handleDateSelect}
          multiple
        />
      </section>

      {/* 選択日程タグ表示 */}
      <section>
        <SelectedDatesDisplay
          dates={selectedDates}
          onRemove={handleRemoveDate}
        />
      </section>

      {/* エラー表示 */}
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

      {/* アクションボタン */}
      <div className={styles.actions}>
        <Link href={`/sessions/${sessionId}`}>
          <Button variant="outline" status="primary" disabled={isPending}>
            キャンセル
          </Button>
        </Link>
        <Button
          status="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isPending || selectedDates.length === 0}
          loading={isPending}
          loadingText="登録中..."
        >
          <CheckCircle size={16} weight="fill" />
          候補日を登録する（{selectedDates.length}件）
        </Button>
      </div>
    </div>
  );
};

export type { ScheduleContentProps };
