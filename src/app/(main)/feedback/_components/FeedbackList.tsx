import {
  ArrowCounterClockwise,
  MagnifyingGlassMinus,
  Megaphone,
} from '@phosphor-icons/react/ssr';

import { FeedbackCard } from './FeedbackCard';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

import type { FeedbackWithUser } from '../interface';

type FeedbackListProps = {
  feedbacks: FeedbackWithUser[];
  hasFilters: boolean;
  onReset?: () => void;
};

export const FeedbackList = ({
  feedbacks,
  hasFilters,
  onReset,
}: FeedbackListProps) => {
  if (feedbacks.length === 0) {
    if (hasFilters) {
      return (
        <div className={styles.listEmpty}>
          <div className={styles.listEmptyIconFrame}>
            <MagnifyingGlassMinus className={styles.listEmptyIcon} />
          </div>
          <span className={styles.listEmptyText}>
            条件に一致するフィードバックが見つかりませんでした
          </span>
          <div className={styles.listEmptyActions}>
            <Button variant="outline" status="primary" onClick={onReset}>
              <ArrowCounterClockwise size={16} />
              条件をリセット
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.listEmpty}>
        <div className={styles.listEmptyIconFrame}>
          <Megaphone className={styles.listEmptyIcon} />
        </div>
        <span className={styles.listEmptyText}>
          まだフィードバックがありません
        </span>
        <span className={styles.listEmptySubtext}>
          最初のフィードバックを投稿しませんか？
        </span>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {feedbacks.map((feedback) => (
        <FeedbackCard key={feedback.feedbackId} feedback={feedback} />
      ))}
    </div>
  );
};
