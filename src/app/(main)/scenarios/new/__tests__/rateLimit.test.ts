import { beforeEach, describe, expect, it } from 'vitest';

/**
 * シナリオ登録レートリミットのテスト（TDDモード - Green Phase）
 *
 * 要件: requirements-scenario-new.md
 *
 * テストID対応:
 * - SN-60: レートリミット超過時にエラーメッセージが表示される
 * - SN-61: MODERATORはレートリミットの対象外
 *
 * スパム対策の詳細:
 * - 一定時間内の登録数に制限あり
 * - 具体的な数値はユーザーに表示しない
 * - MODERATORロールはレートリミット対象外
 */

import { checkRateLimit } from '@/lib/rateLimit';

// テスト間でレートリミットストアをクリア
beforeEach(async () => {
  // 実装がメモリストアを使用している場合、各テストで独立性を保つため
  // 異なるuserIdを使用する
});

describe('シナリオ登録レートリミット', () => {
  describe('checkRateLimit', () => {
    // SN-60: レートリミット超過時にエラーメッセージが表示される
    it('レートリミット超過時はエラーを返す', async () => {
      const userId = 'user-limit-test-1';

      // レートリミットを超えるまで連続実行
      for (let i = 0; i < 5; i++) {
        await checkRateLimit({
          userId,
          action: 'create_scenario',
        });
      }

      // 6回目はレートリミット超過
      const result = await checkRateLimit({
        userId,
        action: 'create_scenario',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(false);
        expect(result.data.reason).toBe('RATE_LIMIT_EXCEEDED');
      }
    });

    it('レートリミット内の場合は許可される', async () => {
      const result = await checkRateLimit({
        userId: 'user-normal-456',
        action: 'create_scenario',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    // SN-61: MODERATORはレートリミットの対象外
    it('MODERATORはレートリミットの対象外', async () => {
      const result = await checkRateLimit({
        userId: 'moderator-123',
        action: 'create_scenario',
        userRole: 'MODERATOR',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
        expect(result.data.exempt).toBe(true);
      }
    });

    it('連続登録後にレートリミットに到達する', async () => {
      const userId = 'user-sequential-789';

      // 制限数（5回）まで許可される
      for (let i = 1; i <= 5; i++) {
        const result = await checkRateLimit({
          userId,
          action: 'create_scenario',
        });
        expect(result.success && result.data.allowed).toBe(true);
      }

      // 6回目: 制限
      const result6 = await checkRateLimit({
        userId,
        action: 'create_scenario',
      });
      expect(result6.success && !result6.data.allowed).toBe(true);
    });

    it('異なるアクションタイプは別々にカウントされる', async () => {
      const userId = 'user-multi-action-abc';

      // create_scenarioを制限まで実行
      for (let i = 0; i < 5; i++) {
        await checkRateLimit({
          userId,
          action: 'create_scenario',
        });
      }

      const result1 = await checkRateLimit({
        userId,
        action: 'create_scenario',
      });
      expect(result1.success && result1.data.allowed).toBe(false);

      const result2 = await checkRateLimit({
        userId,
        action: 'create_session',
      });
      expect(result2.success && result2.data.allowed).toBe(true);
    });
  });

  describe('レートリミットのエラーメッセージ', () => {
    it('具体的な数値を含まないエラーメッセージを返す', async () => {
      const userId = 'user-message-check';

      // レートリミットを超えるまで連続実行
      for (let i = 0; i < 5; i++) {
        await checkRateLimit({
          userId,
          action: 'create_scenario',
        });
      }

      const result = await checkRateLimit({
        userId,
        action: 'create_scenario',
      });

      expect(result.success).toBe(true);
      if (result.success && !result.data.allowed) {
        expect(result.data.message).toBe(
          'しばらく時間をおいてから再度お試しください',
        );
        // 具体的な残り時間や回数が含まれていないことを確認
        expect(result.data.message).not.toMatch(/\d+分/);
        expect(result.data.message).not.toMatch(/\d+回/);
        expect(result.data.message).not.toMatch(/\d+件/);
      }
    });
  });
});
