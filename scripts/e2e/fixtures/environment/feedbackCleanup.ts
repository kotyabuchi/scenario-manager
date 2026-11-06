import { createCleanupFixture, user } from './fixtureCleanup';

export const feedback = {
  kind: 'feedbacks',
  id: '01J00000000000000000000006',
  userId: user.id,
} as const;
export const comment = {
  kind: 'feedback_comments',
  id: '01J00000000000000000000007',
  feedbackId: feedback.id,
  userId: user.id,
} as const;
export const vote = {
  kind: 'feedback_votes',
  feedbackId: feedback.id,
  userId: user.id,
} as const;

export const createFeedbackCleanupFixture = (withChildren = false) => {
  const value = createCleanupFixture();
  value.manifest.resources.push({ resource: feedback, status: 'created' });
  value.rows.set('feedbacks', [{ feedback_id: feedback.id, user_id: user.id }]);
  if (withChildren) {
    value.rows.set('feedback_comments', [
      { comment_id: comment.id, feedback_id: feedback.id, user_id: user.id },
    ]);
    value.rows.set('feedback_votes', [
      { feedback_id: feedback.id, user_id: user.id },
    ]);
  }
  return value;
};
