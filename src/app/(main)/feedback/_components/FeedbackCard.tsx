import { Chat } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import { getCategoryLabel, getStatusLabel } from '../helpers';
import * as styles from './styles';
import { VoteButton } from './VoteButton';

import { Avatar } from '@/components/elements/avatar';
import { formatRelativeTime } from '@/lib/formatters';

import type { Route } from 'next';
import type { FeedbackCategories, FeedbackStatuses } from '@/db/enum';
import type { FeedbackWithUser } from '../interface';

type CategoryKey = keyof typeof FeedbackCategories;
type StatusKey = keyof typeof FeedbackStatuses;

type FeedbackCardProps = {
  feedback: FeedbackWithUser;
};

export const FeedbackCard = ({ feedback }: FeedbackCardProps) => {
  return (
    <Link
      href={`/feedback/${feedback.feedbackId}` as Route}
      className={styles.card}
    >
      <VoteButton
        feedbackId={feedback.feedbackId}
        initialHasVoted={feedback.hasVoted}
        initialVoteCount={feedback.voteCount}
        size="sm"
      />

      <div className={styles.card_body}>
        <div className={styles.card_titleRow}>
          <div className={styles.card_titleLeft}>
            <span
              className={styles.card_categoryBadge({
                category: feedback.category as CategoryKey,
              })}
            >
              {getCategoryLabel(feedback.category)}
            </span>
            <span className={styles.card_title}>{feedback.title}</span>
          </div>
          <span
            className={styles.card_statusBadge({
              status: feedback.status as StatusKey,
            })}
          >
            {getStatusLabel(feedback.status)}
          </span>
        </div>

        {feedback.description && (
          <p className={styles.card_description}>{feedback.description}</p>
        )}

        <hr className={styles.card_divider} />
        <div className={styles.card_meta}>
          <div className={styles.card_metaLeft}>
            <span className={styles.card_metaItem}>
              <Avatar
                {...(feedback.user.image ? { src: feedback.user.image } : {})}
                alt={feedback.user.nickname}
                size="xs"
              />
              {feedback.user.nickname}
            </span>
            <span aria-hidden="true">•</span>
            <span>{formatRelativeTime(feedback.createdAt)}</span>
          </div>
          <span className={styles.card_metaItem}>
            <Chat size={14} />
            {feedback.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
};
