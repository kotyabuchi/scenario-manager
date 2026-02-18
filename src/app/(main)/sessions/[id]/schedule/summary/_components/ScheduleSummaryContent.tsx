'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  ArrowLeft,
  CaretDown,
  CheckCircle,
  Crown,
} from '@phosphor-icons/react/ssr';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { confirmScheduleAction } from '../../actions';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

import type { ScheduleCandidateWithResponses } from '../../../../interface';

type ScheduleSummaryContentProps = {
  sessionId: string;
  sessionName: string;
  candidates: ScheduleCandidateWithResponses[];
};

/**
 * 候補日時の日付文字列を日本語フォーマットに変換する
 */
const formatCandidateDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return format(date, 'M月d日（E）', { locale: ja });
};

export const ScheduleSummaryContent = ({
  sessionId,
  sessionName,
  candidates,
}: ScheduleSummaryContentProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  // おすすめ候補の算出（OK数が最多の候補）
  const { sortedCandidates, recommendedIds } = useMemo(() => {
    const sorted = [...candidates].sort(
      (a, b) =>
        new Date(a.candidateDate).getTime() -
        new Date(b.candidateDate).getTime(),
    );
    const maxOk = Math.max(...candidates.map((c) => c.okCount), 0);
    const recommended = candidates
      .filter((c) => c.okCount === maxOk && maxOk > 0)
      .map((c) => c.candidateId);
    return { sortedCandidates: sorted, recommendedIds: recommended };
  }, [candidates]);

  const handleConfirm = () => {
    if (isNil(selectedCandidateId)) return;

    setServerError(null);
    startTransition(async () => {
      const result = await confirmScheduleAction(
        sessionId,
        selectedCandidateId,
      );

      if (!result.success) {
        setServerError(result.error?.message ?? '日程の確定に失敗しました');
      } else {
        router.push(`/sessions/${sessionId}`);
      }
    });
  };

  return (
    <div className={styles.pageContainer}>
      <Link href={`/sessions/${sessionId}`} className={styles.backLink}>
        <ArrowLeft size={14} />
        セッション詳細に戻る
      </Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageHeader_title}>日程集計・確定</h1>
        <p className={styles.pageHeader_subtitle}>{sessionName}</p>
      </div>

      {candidates.length === 0 ? (
        <p className={styles.emptyMessage}>候補日時が登録されていません</p>
      ) : (
        <>
          {/* 集計テーブルセクション */}
          <section className={styles.summarySection}>
            <h2 className={styles.summarySection_title}>候補日時の集計</h2>
            <div className={styles.summaryTable}>
              <div className={styles.summaryTable_header}>
                <span className={styles.summaryTable_headerCell}>選択</span>
                <span className={styles.summaryTable_headerCell}>日程</span>
                <span className={styles.summaryTable_headerCell}>
                  ○<span className="sr-only">（参加可能）</span>
                </span>
                <span className={styles.summaryTable_headerCell}>
                  △<span className="sr-only">（条件付き）</span>
                </span>
                <span className={styles.summaryTable_headerCell}>
                  ×<span className="sr-only">（参加不可）</span>
                </span>
              </div>
              {sortedCandidates.map((candidate) => {
                const isRecommended = recommendedIds.includes(
                  candidate.candidateId,
                );
                return (
                  <label
                    key={candidate.candidateId}
                    className={styles.summaryRow({
                      selected: selectedCandidateId === candidate.candidateId,
                    })}
                  >
                    <span className={styles.summaryRow_radio}>
                      <input
                        type="radio"
                        name="selectedCandidate"
                        value={candidate.candidateId}
                        checked={selectedCandidateId === candidate.candidateId}
                        onChange={() =>
                          setSelectedCandidateId(candidate.candidateId)
                        }
                        className={styles.summaryRow_radioInput}
                      />
                    </span>
                    <span className={styles.summaryRow_date}>
                      {formatCandidateDate(candidate.candidateDate)}
                      {isRecommended && (
                        <span className={styles.recommendBadge}>
                          <Crown size={12} weight="fill" />
                          おすすめ
                        </span>
                      )}
                    </span>
                    <span
                      className={styles.summaryRow_count({ variant: 'ok' })}
                    >
                      {candidate.okCount}
                    </span>
                    <span
                      className={styles.summaryRow_count({ variant: 'maybe' })}
                    >
                      {candidate.maybeCount}
                    </span>
                    <span
                      className={styles.summaryRow_count({ variant: 'ng' })}
                    >
                      {candidate.ngCount}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* 回答詳細セクション（コラプシブル） */}
          <details className={styles.detailSection}>
            <summary className={styles.detailSection_trigger}>
              <CaretDown size={16} aria-hidden="true" />
              回答詳細を表示
            </summary>
            <div className={styles.detailSection_content}>
              {sortedCandidates.map((candidate) => (
                <div key={candidate.candidateId} className={styles.detailCard}>
                  <h3 className={styles.detailCard_title}>
                    {formatCandidateDate(candidate.candidateDate)}
                  </h3>
                  {candidate.responses && candidate.responses.length > 0 ? (
                    <ul className={styles.detailCard_list}>
                      {candidate.responses.map((response) => {
                        const symbol =
                          response.availability === 'OK'
                            ? '○'
                            : response.availability === 'MAYBE'
                              ? '△'
                              : '×';
                        const availabilityVariant = (
                          response.availability as string
                        ).toLowerCase() as 'ok' | 'maybe' | 'ng';
                        return (
                          <li
                            key={
                              response.responseId ??
                              `${candidate.candidateId}-${response.user?.userId}`
                            }
                            className={styles.detailCard_item}
                          >
                            <span>{response.user?.userName ?? '不明'}</span>
                            <span
                              className={styles.detailCard_availability({
                                variant: availabilityVariant,
                              })}
                            >
                              {symbol}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={styles.detailCard_empty}>回答なし</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        </>
      )}

      {/* エラー表示 */}
      {!isNil(serverError) && (
        <p role="alert" className={styles.serverError}>
          {serverError}
        </p>
      )}

      {/* アクションボタン */}
      <div className={styles.actions}>
        <Link href={`/sessions/${sessionId}`}>
          <Button variant="outline" status="primary" disabled={isPending}>
            戻る
          </Button>
        </Link>
        <Button
          status="primary"
          onClick={handleConfirm}
          disabled={isPending || isNil(selectedCandidateId)}
          loading={isPending}
          loadingText="確定中..."
        >
          <CheckCircle size={16} weight="fill" />
          この日程で確定する
        </Button>
      </div>
    </div>
  );
};
