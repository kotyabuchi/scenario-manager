'use client';

import { useOptimistic, useTransition } from 'react';

import { toggleVoteAction } from '../actions';

/**
 * 投票の楽観的更新ロジックを共通化するhook
 */
export const useVoteToggle = (
  feedbackId: string,
  initialHasVoted: boolean,
  initialVoteCount: number,
) => {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { hasVoted: initialHasVoted, voteCount: initialVoteCount },
    (current, _action: 'toggle') => ({
      hasVoted: !current.hasVoted,
      voteCount: current.hasVoted
        ? Math.max(current.voteCount - 1, 0)
        : current.voteCount + 1,
    }),
  );

  const toggle = () => {
    startTransition(async () => {
      setOptimistic('toggle');
      const result = await toggleVoteAction(feedbackId);
      if (!result.success) {
        // 楽観的更新は transition 完了時に base state へ自動ロールバック
        throw result.error;
      }
    });
  };

  return { ...optimistic, toggle };
};
