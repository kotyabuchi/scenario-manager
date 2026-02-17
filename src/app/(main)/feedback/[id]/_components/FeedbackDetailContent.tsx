'use client';

import {
  ArrowFatUp,
  GitMerge,
  Info,
  LinkSimple,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { isNil } from 'ramda';

import { getCategoryLabel, getStatusLabel } from '../../helpers';
import { useVoteToggle } from '../../hooks/useVoteToggle';
import * as styles from './styles';

import { Avatar } from '@/components/elements/avatar';
import { formatRelativeTime } from '@/lib/formatters';

import type { Route } from 'next';
import type { FeedbackCategories, FeedbackStatuses } from '@/db/enum';
import type { FeedbackDetail } from '../../interface';

type CategoryKey = keyof typeof FeedbackCategories;
type StatusKey = keyof typeof FeedbackStatuses;

type FeedbackDetailContentProps = {
  feedback: FeedbackDetail;
};

export const FeedbackDetailContent = ({
  feedback,
}: FeedbackDetailContentProps) => {
  const {
    hasVoted,
    voteCount,
    toggle: handleVote,
  } = useVoteToggle(feedback.feedbackId, feedback.hasVoted, feedback.voteCount);

  return (
    <>
      <article className={styles.detailArticle}>
        <div className={styles.detailArticle_gradientBar} />

        <div className={styles.detailHeader}>
          {/* カテゴリ + ステータス + ID */}
          <div className={styles.detailHeader_meta}>
            <span
              className={styles.detailHeader_categoryBadge({
                category: feedback.category as CategoryKey,
              })}
            >
              {getCategoryLabel(feedback.category)}
            </span>
            <span
              className={styles.detailHeader_statusBadge({
                status: feedback.status as StatusKey,
              })}
            >
              {getStatusLabel(feedback.status)}
            </span>
            <span className={styles.detailHeader_id}>
              ID: #{feedback.feedbackId.slice(0, 4)}
            </span>
          </div>

          {/* タイトル */}
          <h1 className={styles.detailHeader_title}>{feedback.title}</h1>

          {/* 投稿者情報 */}
          <div className={styles.detailHeader_userInfo}>
            <Avatar
              {...(feedback.user.image ? { src: feedback.user.image } : {})}
              alt={feedback.user.nickname}
              size="sm"
            />
            <span>
              投稿者:{' '}
              <span className={styles.detailHeader_nickname}>
                {feedback.user.nickname}
              </span>
            </span>
            <span aria-hidden="true">•</span>
            <span className={styles.detailHeader_date}>
              {formatRelativeTime(feedback.createdAt)}
            </span>
          </div>

          <hr className={styles.divider} />

          {/* 説明 */}
          <p className={styles.detailHeader_description}>
            {feedback.description}
          </p>

          {/* 投票セクション */}
          <div className={styles.voteSection}>
            <span className={styles.voteSection_text}>
              この機能が欲しいと思ったら
              <br />
              投票してください！
            </span>
            <button
              type="button"
              className={styles.voteSection_button}
              onClick={handleVote}
              aria-pressed={hasVoted}
              aria-label={hasVoted ? '投票を取り消す' : '投票する'}
            >
              <ArrowFatUp size={20} weight={hasVoted ? 'fill' : 'regular'} />
              <span className={styles.voteSection_count} aria-live="polite">
                {voteCount}
              </span>
              <span className={styles.voteSection_label}>
                この要望に投票する
              </span>
            </button>
          </div>
        </div>
      </article>

      {/* マージ表示 */}
      {feedback.status === 'DUPLICATE' && !isNil(feedback.mergedIntoId) && (
        <div className={styles.mergedInfo}>
          <GitMerge size={16} />
          <span>このフィードバックは統合されました: </span>
          <Link
            href={`/feedback/${feedback.mergedIntoId}` as Route}
            className={styles.mergedInfo_link}
          >
            <LinkSimple size={14} />
            統合先を見る
          </Link>
        </div>
      )}

      {feedback.mergedCount > 0 && (
        <div className={styles.mergedInfo_count}>
          <Info size={16} />
          <span>
            このフィードバックには{feedback.mergedCount}
            件の類似投稿が統合されています。
          </span>
        </div>
      )}
    </>
  );
};
