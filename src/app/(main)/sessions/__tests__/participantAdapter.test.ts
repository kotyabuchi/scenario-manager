import { describe, expect, it } from 'vitest';

import {
  applyToSession,
  approveApplication,
  cancelApplication,
  cancelSession,
  PARTICIPANT_ERROR_MESSAGES,
  rejectApplication,
  withdrawFromSession,
} from '../participantAdapter';

/**
 * セッション参加申請・管理機能のアダプターテスト
 * 要件: requirements-session-flow.md Section 3.4, 3.6
 *
 * 対応ユーザーストーリー:
 * - US-S105: PLとして、GMのプロフィールを見て安心して参加申請できる
 * - US-S106: GMとして、参加希望者のプロフィールを見て承認/拒否できる
 * - US-S108: PLとして、プレイヤーまたは観戦者として申請できる
 * - US-S109: GMとして、セッションをキャンセルできる
 * - US-S110: PLとして、承認済みセッションから辞退できる
 * - US-S111: PLとして、承認待ちの申請を取り消しできる
 *
 * 注意: これらはデータベースに接続する統合テストです。
 * CI環境ではスキップされます。
 */

// CI環境または DB 未接続時はスキップ
const isIntegrationTestEnabled =
  process.env.DATABASE_URL &&
  !process.env.CI &&
  process.env.RUN_INTEGRATION_TESTS === 'true';

describe('Session Participant Adapter', () => {
  describe('applyToSession - 参加申請', () => {
    // T-AP-001: プレイヤーとして参加申請できる
    it.skipIf(!isIntegrationTestEnabled)(
      'プレイヤーとして参加申請できる',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'test-user-id';
        const input = {
          participantType: 'PLAYER' as const,
          applicationMessage: 'よろしくお願いします！',
        };

        const result = await applyToSession(sessionId, userId, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.participantType).toBe('PLAYER');
          expect(result.data.participantStatus).toBe('PENDING');
          expect(result.data.applicationMessage).toBe('よろしくお願いします！');
        }
      },
    );

    // T-AP-002: 観戦者として参加申請できる
    it.skipIf(!isIntegrationTestEnabled)(
      '観戦者として参加申請できる',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'test-user-id';
        const input = {
          participantType: 'SPECTATOR' as const,
          applicationMessage: '見学させてください',
        };

        const result = await applyToSession(sessionId, userId, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.participantType).toBe('SPECTATOR');
        }
      },
    );

    // T-AP-003: メッセージなしで参加申請できる
    it.skipIf(!isIntegrationTestEnabled)(
      'メッセージなしで参加申請できる',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'test-user-id';
        const input = {
          participantType: 'PLAYER' as const,
        };

        const result = await applyToSession(sessionId, userId, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.applicationMessage).toBeNull();
        }
      },
    );

    // T-AP-004: 既に申請済みの場合エラー
    it.skipIf(!isIntegrationTestEnabled)(
      '既に申請済みの場合エラー',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'already-applied-user-id';
        const input = {
          participantType: 'PLAYER' as const,
        };

        const result = await applyToSession(sessionId, userId, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED,
          );
        }
      },
    );

    // T-AP-005: 募集中以外のセッションに申請するとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      '募集中以外のセッションに申請するとエラー',
      async () => {
        const sessionId = 'preparation-session-id'; // PREPARATION状態
        const userId = 'test-user-id';
        const input = {
          participantType: 'PLAYER' as const,
        };

        const result = await applyToSession(sessionId, userId, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.RECRUITMENT_CLOSED,
          );
        }
      },
    );

    // T-AP-006: 存在しないセッションに申請するとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      '存在しないセッションに申請するとエラー',
      async () => {
        const sessionId = 'non-existent-session-id';
        const userId = 'test-user-id';
        const input = {
          participantType: 'PLAYER' as const,
        };

        const result = await applyToSession(sessionId, userId, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND,
          );
        }
      },
    );
  });

  describe('approveApplication - 申請承認', () => {
    // T-AA-001: GMが申請を承認できる
    it.skipIf(!isIntegrationTestEnabled)('GMが申請を承認できる', async () => {
      const sessionId = 'test-session-id';
      const applicantUserId = 'pending-applicant-user-id';
      const gmUserId = 'gm-user-id';

      const result = await approveApplication(
        sessionId,
        applicantUserId,
        gmUserId,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.participantStatus).toBe('CONFIRMED');
      }
    });

    // T-AA-002: GM以外が承認しようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      'GM以外が承認しようとするとエラー',
      async () => {
        const sessionId = 'test-session-id';
        const applicantUserId = 'pending-applicant-user-id';
        const otherUserId = 'other-user-id';

        const result = await approveApplication(
          sessionId,
          applicantUserId,
          otherUserId,
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
          );
        }
      },
    );

    // T-AA-003: 既に承認済みの申請を承認しようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      '既に承認済みの申請を承認しようとするとエラー',
      async () => {
        const sessionId = 'test-session-id';
        const applicantUserId = 'confirmed-participant-user-id';
        const gmUserId = 'gm-user-id';

        const result = await approveApplication(
          sessionId,
          applicantUserId,
          gmUserId,
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.ALREADY_PROCESSED,
          );
        }
      },
    );
  });

  describe('rejectApplication - 申請拒否', () => {
    // T-RA-001: GMが申請を拒否できる
    it.skipIf(!isIntegrationTestEnabled)('GMが申請を拒否できる', async () => {
      const sessionId = 'test-session-id';
      const applicantUserId = 'pending-applicant-user-id';
      const gmUserId = 'gm-user-id';

      const result = await rejectApplication(
        sessionId,
        applicantUserId,
        gmUserId,
      );

      expect(result.success).toBe(true);
    });

    // T-RA-002: GM以外が拒否しようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      'GM以外が拒否しようとするとエラー',
      async () => {
        const sessionId = 'test-session-id';
        const applicantUserId = 'pending-applicant-user-id';
        const otherUserId = 'other-user-id';

        const result = await rejectApplication(
          sessionId,
          applicantUserId,
          otherUserId,
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
          );
        }
      },
    );
  });

  describe('withdrawFromSession - 辞退', () => {
    // T-WS-001: 承認済みの参加者が辞退できる
    it.skipIf(!isIntegrationTestEnabled)(
      '承認済みの参加者が辞退できる',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'confirmed-participant-user-id';
        const reason = '予定が入ってしまいました';

        const result = await withdrawFromSession(sessionId, userId, reason);

        expect(result.success).toBe(true);
      },
    );

    // T-WS-002: 完了済みセッションから辞退しようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      '完了済みセッションから辞退しようとするとエラー',
      async () => {
        const sessionId = 'completed-session-id';
        const userId = 'participant-user-id';

        const result = await withdrawFromSession(sessionId, userId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.CANNOT_WITHDRAW,
          );
        }
      },
    );

    // T-WS-003: 参加していないセッションから辞退しようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      '参加していないセッションから辞退しようとするとエラー',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'non-participant-user-id';

        const result = await withdrawFromSession(sessionId, userId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT,
          );
        }
      },
    );
  });

  describe('cancelApplication - 申請取り消し', () => {
    // T-CA-001: PENDING状態の申請を取り消せる
    it.skipIf(!isIntegrationTestEnabled)(
      'PENDING状態の申請を取り消せる',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'pending-applicant-user-id';

        const result = await cancelApplication(sessionId, userId);

        expect(result.success).toBe(true);
      },
    );

    // T-CA-002: CONFIRMED状態の申請は取り消せない
    it.skipIf(!isIntegrationTestEnabled)(
      'CONFIRMED状態の申請は取り消せない',
      async () => {
        const sessionId = 'test-session-id';
        const userId = 'confirmed-participant-user-id';

        const result = await cancelApplication(sessionId, userId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW,
          );
        }
      },
    );
  });

  describe('cancelSession - セッションキャンセル', () => {
    // T-CSS-001: GMがセッションをキャンセルできる
    it.skipIf(!isIntegrationTestEnabled)(
      'GMがセッションをキャンセルできる',
      async () => {
        const sessionId = 'test-session-id';
        const gmUserId = 'gm-user-id';
        const reason = '急用が入ってしまいました';

        const result = await cancelSession(sessionId, gmUserId, reason);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sessionPhase).toBe('CANCELLED');
        }
      },
    );

    // T-CSS-002: GM以外がキャンセルしようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      'GM以外がキャンセルしようとするとエラー',
      async () => {
        const sessionId = 'test-session-id';
        const otherUserId = 'other-user-id';

        const result = await cancelSession(sessionId, otherUserId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
          );
        }
      },
    );

    // T-CSS-003: 完了済みセッションはキャンセルできない
    it.skipIf(!isIntegrationTestEnabled)(
      '完了済みセッションはキャンセルできない',
      async () => {
        const sessionId = 'completed-session-id';
        const gmUserId = 'gm-user-id';

        const result = await cancelSession(sessionId, gmUserId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.COMPLETED_CANNOT_CANCEL,
          );
        }
      },
    );

    // T-CSS-004: 既にキャンセル済みのセッションをキャンセルしようとするとエラー
    it.skipIf(!isIntegrationTestEnabled)(
      '既にキャンセル済みのセッションをキャンセルしようとするとエラー',
      async () => {
        const sessionId = 'cancelled-session-id';
        const gmUserId = 'gm-user-id';

        const result = await cancelSession(sessionId, gmUserId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe(
            PARTICIPANT_ERROR_MESSAGES.ALREADY_CANCELLED,
          );
        }
      },
    );
  });

  describe('エラーメッセージの検証', () => {
    // エラーメッセージの定数確認
    it('すべてのエラーメッセージが定義されている', () => {
      const errorMessages = {
        alreadyApplied: PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED,
        recruitmentClosed: PARTICIPANT_ERROR_MESSAGES.RECRUITMENT_CLOSED,
        sessionNotFound: PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND,
        noPermission: PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
        alreadyProcessed: PARTICIPANT_ERROR_MESSAGES.ALREADY_PROCESSED,
        cannotWithdraw: PARTICIPANT_ERROR_MESSAGES.CANNOT_WITHDRAW,
        notParticipant: PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT,
        useWithdraw: PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW,
        completedCannotCancel:
          PARTICIPANT_ERROR_MESSAGES.COMPLETED_CANNOT_CANCEL,
        alreadyCancelled: PARTICIPANT_ERROR_MESSAGES.ALREADY_CANCELLED,
      };

      // すべてのキーが文字列であることを確認
      for (const message of Object.values(errorMessages)) {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }

      // 期待通りのメッセージかどうか確認
      expect(errorMessages.alreadyApplied).toBe('すでに申請済みです');
      expect(errorMessages.recruitmentClosed).toBe(
        'このセッションは募集を終了しています',
      );
      expect(errorMessages.sessionNotFound).toBe('セッションが見つかりません');
      expect(errorMessages.noPermission).toBe('この操作を行う権限がありません');
      expect(errorMessages.alreadyProcessed).toBe('この申請は既に処理済みです');
      expect(errorMessages.cannotWithdraw).toBe(
        'このセッションからは辞退できません',
      );
      expect(errorMessages.notParticipant).toBe(
        'このセッションに参加していません',
      );
      expect(errorMessages.useWithdraw).toBe(
        '承認済みの申請は取り消せません。辞退してください',
      );
      expect(errorMessages.completedCannotCancel).toBe(
        '完了済みのセッションはキャンセルできません',
      );
      expect(errorMessages.alreadyCancelled).toBe(
        'このセッションは既にキャンセル済みです',
      );
    });
  });
});
