'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react/ssr';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { submitResponseAction } from '../../actions';
import {
  type ScheduleResponseValues,
  scheduleResponseSchema,
} from '../../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Textarea } from '@/components/elements/textarea';

import type { ScheduleCandidateWithResponses } from '../../../../interface';

type ScheduleResponseContentProps = {
  sessionId: string;
  sessionName: string;
  candidates: ScheduleCandidateWithResponses[];
  currentUserId: string;
};

type AvailabilityValue = 'OK' | 'MAYBE' | 'NG';

const formatCandidateDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return format(date, 'M月d日（E）', { locale: ja });
};

export const ScheduleResponseContent = ({
  sessionId,
  sessionName,
  candidates,
  currentUserId,
}: ScheduleResponseContentProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // 既存回答をプリセットしたデフォルト値を構築
  const defaultResponses = candidates.map((candidate) => {
    const myResponse = candidate.responses?.find(
      (r) => r.user?.userId === currentUserId,
    );
    return {
      candidateId: candidate.candidateId,
      availability:
        (myResponse?.availability as AvailabilityValue) ?? undefined,
    };
  });

  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ScheduleResponseValues>({
    resolver: zodResolver(scheduleResponseSchema),
    defaultValues: {
      responses: defaultResponses.filter(
        (r) => !isNil(r.availability),
      ) as ScheduleResponseValues['responses'],
      comment: '',
    },
  });

  const watchedResponses = watch('responses');
  const watchedComment = watch('comment') ?? '';

  const getAvailabilityForCandidate = (
    candidateId: string,
  ): AvailabilityValue | undefined => {
    const entry = watchedResponses?.find((r) => r.candidateId === candidateId);
    return entry?.availability as AvailabilityValue | undefined;
  };

  const handleAvailabilityChange = (
    candidateId: string,
    value: AvailabilityValue,
  ) => {
    const currentResponses = watchedResponses ?? [];
    const existingIndex = currentResponses.findIndex(
      (r) => r.candidateId === candidateId,
    );

    if (existingIndex >= 0) {
      setValue(`responses.${existingIndex}.availability`, value, {
        shouldValidate: true,
      });
    } else {
      setValue(
        'responses',
        [...currentResponses, { candidateId, availability: value }],
        {
          shouldValidate: true,
        },
      );
    }
  };

  const allAnswered =
    candidates.length > 0 &&
    candidates.every((c) => getAvailabilityForCandidate(c.candidateId));

  const onSubmit = (data: ScheduleResponseValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitResponseAction(sessionId, data);

      if (!result.success) {
        setServerError(result.error?.message ?? '回答の送信に失敗しました');
      } else {
        router.push(`/sessions/${sessionId}`);
      }
    });
  };

  const sortedCandidates = [...candidates].sort(
    (a, b) =>
      new Date(a.candidateDate).getTime() - new Date(b.candidateDate).getTime(),
  );

  return (
    <div className={styles.pageContainer}>
      <Link href={`/sessions/${sessionId}`} className={styles.backLink}>
        <ArrowLeft size={14} />
        セッション詳細に戻る
      </Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageHeader_title}>日程回答</h1>
        <p className={styles.pageHeader_subtitle}>{sessionName}</p>
      </div>

      {/* 回答テーブル */}
      <section className={styles.responseSection}>
        <h2 className={styles.responseSection_title}>候補日時</h2>
        <div className={styles.legend}>
          <span className={styles.legend_item}>○ 参加可能</span>
          <span className={styles.legend_item}>△ 条件付き</span>
          <span className={styles.legend_item}>× 参加不可</span>
        </div>
        <div className={styles.responseTable}>
          {sortedCandidates.map((candidate) => (
            <div key={candidate.candidateId} className={styles.responseRow}>
              <div className={styles.responseRow_date}>
                <span className={styles.responseRow_dateText}>
                  {formatCandidateDate(candidate.candidateDate)}
                </span>
                <span className={styles.responseRow_stats}>
                  <span className="sr-only">参加可能: </span>○
                  {candidate.okCount}{' '}
                  <span className="sr-only">条件付き: </span>△
                  {candidate.maybeCount}{' '}
                  <span className="sr-only">参加不可: </span>×
                  {candidate.ngCount}
                </span>
              </div>
              <div className={styles.responseRow_buttons}>
                {(['OK', 'MAYBE', 'NG'] as const).map((value) => {
                  const isSelected =
                    getAvailabilityForCandidate(candidate.candidateId) ===
                    value;
                  const label =
                    value === 'OK'
                      ? '参加可能'
                      : value === 'MAYBE'
                        ? '条件付き参加可能'
                        : '参加不可';
                  const symbol =
                    value === 'OK' ? '○' : value === 'MAYBE' ? '△' : '×';
                  return (
                    <button
                      key={value}
                      type="button"
                      className={styles.availabilityButton({
                        variant: value.toLowerCase() as 'ok' | 'maybe' | 'ng',
                        selected: isSelected,
                      })}
                      onClick={() =>
                        handleAvailabilityChange(candidate.candidateId, value)
                      }
                      aria-label={`${formatCandidateDate(candidate.candidateDate)} ${label}`}
                      aria-pressed={isSelected}
                    >
                      {symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {errors.responses && (
          <p role="alert" className={styles.serverError}>
            {errors.responses.message}
          </p>
        )}
      </section>

      {/* コメント */}
      <section className={styles.commentSection}>
        <h2 className={styles.commentSection_title}>コメント（任意）</h2>
        <Textarea
          id="schedule-comment"
          aria-label="補足コメント"
          {...register('comment')}
          placeholder="補足コメントがあれば入力してください"
          maxLength={200}
          rows={3}
        />
        <p className={styles.commentSection_count}>
          {watchedComment.length}/200
        </p>
        {errors.comment && (
          <p role="alert" className={styles.serverError}>
            {errors.comment.message}
          </p>
        )}
      </section>

      {/* エラー表示 */}
      {!isNil(serverError) && (
        <p role="alert" className={styles.serverError}>
          {serverError}
        </p>
      )}

      {/* アクションボタン */}
      <div className={styles.actions}>
        <Button
          variant="outline"
          status="primary"
          onClick={() => router.push(`/sessions/${sessionId}`)}
          disabled={isPending}
        >
          キャンセル
        </Button>
        <Button
          status="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isPending || !allAnswered}
          loading={isPending}
          loadingText="送信中..."
        >
          <CheckCircle size={16} weight="fill" />
          回答を送信する
        </Button>
      </div>
    </div>
  );
};
