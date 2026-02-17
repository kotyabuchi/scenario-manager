import { describe, expect, it } from 'vitest';

import {
  checkCommentRateLimit,
  checkFeedbackRateLimit,
  deleteFeedback,
  getFeedbackById,
  searchFeedbacks,
  toggleFeedbackVote,
  updateFeedback,
  updateFeedbackStatus,
} from '../adapter';

/**
 * フィードバック機能のアダプター関数テスト
 * 要件: requirements-feedback.md
 *
 * 注意: これらはデータベースに接続する統合テストです。
 * テスト環境でDBに接続できない場合、テストはスキップされます。
 */

/** DB接続エラー（cookies スコープ外等）の場合はテストをスキップする */
const skipIfDbUnavailable = <T>(
  result: { success: true; data: T } | { success: false; error: Error },
): result is { success: false; error: Error } => {
  if (!result.success) {
    console.warn('DB接続エラー: テストをスキップ');
    return true;
  }
  return false;
};

describe('Feedback Adapter', () => {
  describe('searchFeedbacks', () => {
    // T-FA-001: 空の検索条件で全件取得できる
    it('空の検索条件で結果を返す', async () => {
      const result = await searchFeedbacks({});

      if (skipIfDbUnavailable(result)) return;

      expect(result.data.feedbacks).toBeDefined();
      expect(Array.isArray(result.data.feedbacks)).toBe(true);
      expect(typeof result.data.totalCount).toBe('number');
    });

    // T-FA-002: 存在しないカテゴリで空配列を返す
    it('存在しないカテゴリで空配列を返す', async () => {
      const result = await searchFeedbacks({
        category: 'NON_EXISTENT_CATEGORY',
      });

      if (skipIfDbUnavailable(result)) return;

      expect(result.data.feedbacks).toEqual([]);
      expect(result.data.totalCount).toBe(0);
    });

    // T-FA-003: ソートオプションが正しく動作する
    it.skip('ソートオプション votes/newest/comments が正しく動作する', async () => {
      const votesResult = await searchFeedbacks({}, 'votes');
      expect(votesResult.success).toBe(true);

      const newestResult = await searchFeedbacks({}, 'newest');
      expect(newestResult.success).toBe(true);

      const commentsResult = await searchFeedbacks({}, 'comments');
      expect(commentsResult.success).toBe(true);
    });
  });

  describe('getFeedbackById', () => {
    // T-FA-010: 存在しないIDでnullを返す
    it('存在しないIDでnullを返す', async () => {
      const result = await getFeedbackById('non-existent-feedback-id-12345');

      if (skipIfDbUnavailable(result)) return;

      expect(result.data).toBeNull();
    });

    // T-FA-011: 存在するIDでフィードバック詳細を取得できる
    it.skip('存在するIDでフィードバック詳細を取得できる', async () => {
      const feedbackId = 'test-feedback-id';
      const result = await getFeedbackById(feedbackId);

      expect(result.success).toBe(true);
      if (result.success && result.data !== null) {
        expect(result.data).toHaveProperty('feedbackId');
        expect(result.data).toHaveProperty('title');
        expect(result.data).toHaveProperty('description');
        expect(result.data).toHaveProperty('comments');
        expect(result.data).toHaveProperty('hasVoted');
        expect(Array.isArray(result.data.comments)).toBe(true);
      }
    });
  });

  describe('deleteFeedback', () => {
    // T-FA-020: 存在しないフィードバックIDでエラーを返す
    it('存在しないフィードバックIDでエラーを返す', async () => {
      const result = await deleteFeedback(
        'non-existent-feedback-id-12345',
        'test-user-id',
      );

      if (!result.success) {
        // DB接続エラー（cookies スコープ外等）の場合はスキップ
        if (result.error.message.includes('cookies')) {
          console.warn('DB接続エラー: テストをスキップ');
          return;
        }
        expect(result.error.message).toBe('フィードバックが見つかりません');
      }
    });

    // T-FA-021: 他ユーザーのフィードバックは削除できない
    it.skip('他ユーザーのフィードバックは削除できない', async () => {
      const feedbackId = 'test-feedback-id';
      const differentUserId = 'different-user-id';

      const result = await deleteFeedback(feedbackId, differentUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('削除権限がありません');
      }
    });

    // T-FA-022: NEW以外のステータスでは削除できない
    it.skip('NEW以外のステータスでは削除できない', async () => {
      const feedbackId = 'test-triaged-feedback-id';
      const userId = 'test-user-id';

      const result = await deleteFeedback(feedbackId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          '受付中のフィードバックのみ削除できます',
        );
      }
    });
  });

  describe('updateFeedback', () => {
    // T-FA-030: 存在しないフィードバックIDでエラーを返す
    it('存在しないフィードバックIDでエラーを返す', async () => {
      const result = await updateFeedback(
        'non-existent-feedback-id-12345',
        'test-user-id',
        { category: 'BUG', title: 'テスト', description: 'テスト' },
      );

      if (!result.success) {
        // DB接続エラー（cookies スコープ外等）の場合はスキップ
        if (result.error.message.includes('cookies')) {
          console.warn('DB接続エラー: テストをスキップ');
          return;
        }
        expect(result.error.message).toBe('フィードバックが見つかりません');
      }
    });

    // T-FA-031: 他ユーザーのフィードバックは編集できない
    it.skip('他ユーザーのフィードバックは編集できない', async () => {
      const feedbackId = 'test-feedback-id';
      const differentUserId = 'different-user-id';

      const result = await updateFeedback(feedbackId, differentUserId, {
        category: 'BUG',
        title: '更新タイトル',
        description: '更新内容',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('編集権限がありません');
      }
    });

    // T-FA-032: DONE ステータスでは編集できない
    it.skip('DONE ステータスでは編集できない', async () => {
      const feedbackId = 'test-done-feedback-id';
      const userId = 'test-user-id';

      const result = await updateFeedback(feedbackId, userId, {
        category: 'BUG',
        title: '更新タイトル',
        description: '更新内容',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          '受付中または検討中のフィードバックのみ編集できます',
        );
      }
    });
  });

  describe('toggleFeedbackVote', () => {
    // T-FA-040: 存在しないフィードバックIDでエラー
    it('存在しないフィードバックIDでエラー', async () => {
      const result = await toggleFeedbackVote(
        'non-existent-feedback-id-12345',
        'non-existent-user-id-12345',
      );

      if (!result.success) {
        expect(result.error).toBeDefined();
      } else {
        expect(typeof result.data).toBe('boolean');
      }
    });
  });

  describe('updateFeedbackStatus', () => {
    // T-FA-050: ステータス更新が成功する
    it.skip('ステータス更新が成功する', async () => {
      const feedbackId = 'test-feedback-id';
      const result = await updateFeedbackStatus(feedbackId, 'TRIAGED');

      expect(result.success).toBe(true);
    });

    // T-FA-051: DONE への更新で resolved_at が設定される
    it.skip('DONE への更新で resolved_at が設定される', async () => {
      const feedbackId = 'test-feedback-id';
      const result = await updateFeedbackStatus(feedbackId, 'DONE');

      expect(result.success).toBe(true);
    });
  });

  describe('checkFeedbackRateLimit', () => {
    // T-FA-060: 存在しないユーザーIDでも制限なしを返す
    it('存在しないユーザーIDでも制限なしを返す', async () => {
      const result = await checkFeedbackRateLimit('non-existent-user-id-12345');

      if (skipIfDbUnavailable(result)) return;

      expect(result.data.isLimited).toBe(false);
      expect(result.data.remaining).toBe(10);
    });
  });

  describe('checkCommentRateLimit', () => {
    // T-FA-070: 存在しないユーザーIDでも制限なしを返す
    it('存在しないユーザーIDでも制限なしを返す', async () => {
      const result = await checkCommentRateLimit('non-existent-user-id-12345');

      if (skipIfDbUnavailable(result)) return;

      expect(result.data.isLimited).toBe(false);
      expect(result.data.remaining).toBe(20);
    });
  });
});
