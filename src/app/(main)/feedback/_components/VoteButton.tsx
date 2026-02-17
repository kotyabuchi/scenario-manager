'use client';

import { ArrowFatUp, CaretUp } from '@phosphor-icons/react/ssr';

import { useVoteToggle } from '../hooks/useVoteToggle';
import * as styles from './styles';

type VoteButtonProps = {
  feedbackId: string;
  initialHasVoted: boolean;
  initialVoteCount: number;
  size?: 'sm' | 'md';
};

export const VoteButton = ({
  feedbackId,
  initialHasVoted,
  initialVoteCount,
  size = 'sm',
}: VoteButtonProps) => {
  const { hasVoted, voteCount, toggle } = useVoteToggle(
    feedbackId,
    initialHasVoted,
    initialVoteCount,
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  if (size === 'sm') {
    return (
      <div className={styles.voteArea}>
        <button
          type="button"
          className={styles.voteButton({ size: 'sm', hasVoted })}
          onClick={handleClick}
          aria-pressed={hasVoted}
          aria-label={hasVoted ? '投票を取り消す' : '投票する'}
        >
          <CaretUp size={20} weight={hasVoted ? 'bold' : 'regular'} />
        </button>
        <span
          className={styles.voteButton_count}
          aria-live="polite"
          aria-atomic="true"
        >
          {voteCount}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.voteButton({ size: 'md', hasVoted })}
      onClick={handleClick}
      aria-pressed={hasVoted}
      aria-label={hasVoted ? '投票を取り消す' : '投票する'}
    >
      <ArrowFatUp size={22} weight={hasVoted ? 'fill' : 'regular'} />
      <span
        className={styles.voteButton_count}
        aria-live="polite"
        aria-atomic="true"
      >
        {voteCount}
      </span>
    </button>
  );
};
