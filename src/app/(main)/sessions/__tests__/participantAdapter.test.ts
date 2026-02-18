import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  applyToSession,
  approveApplication,
  cancelApplication,
  cancelSession,
  PARTICIPANT_ERROR_MESSAGES,
  rejectApplication,
  withdrawFromSession,
} from '../participantAdapter';

import {
  addParticipant,
  cleanupSessions,
  cleanupUsers,
  createTestSession,
  createTestUser,
} from '@/__tests__/helpers/fixtures';

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
 */

describe('Session Participant Adapter', () => {
  let gmUserId: string;
  let recruitingSessionId: string;
  let preparationSessionId: string;
  let completedSessionId: string;
  let cancelledSessionId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // GM ユーザー作成
    const gmUser = await createTestUser();
    gmUserId = gmUser.user_id;
    createdUserIds.push(gmUserId);

    // RECRUITING セッション
    const recruitingSession = await createTestSession({
      keeperUserId: gmUserId,
    });
    recruitingSessionId = recruitingSession.game_session_id;

    // PREPARATION セッション
    const preparationSession = await createTestSession({
      keeperUserId: gmUserId,
      phase: 'PREPARATION',
    });
    preparationSessionId = preparationSession.game_session_id;

    // COMPLETED セッション
    const completedSession = await createTestSession({
      keeperUserId: gmUserId,
      phase: 'COMPLETED',
    });
    completedSessionId = completedSession.game_session_id;

    // CANCELLED セッション
    const cancelledSession = await createTestSession({
      keeperUserId: gmUserId,
      phase: 'CANCELLED',
    });
    cancelledSessionId = cancelledSession.game_session_id;
  });

  afterAll(async () => {
    await cleanupSessions([
      recruitingSessionId,
      preparationSessionId,
      completedSessionId,
      cancelledSessionId,
    ]);
    await cleanupUsers(createdUserIds);
  });

  describe('applyToSession - 参加申請', () => {
    let applicantUserId: string;

    beforeEach(async () => {
      const applicant = await createTestUser();
      applicantUserId = applicant.user_id;
      createdUserIds.push(applicantUserId);
    });

    // T-AP-001: プレイヤーとして参加申請できる
    it('プレイヤーとして参加申請できる', async () => {
      const input = {
        participantType: 'PLAYER' as const,
        applicationMessage: 'よろしくお願いします！',
      };

      const result = await applyToSession(
        recruitingSessionId,
        applicantUserId,
        input,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.participantType).toBe('PLAYER');
        expect(result.data.participantStatus).toBe('PENDING');
        expect(result.data.applicationMessage).toBe('よろしくお願いします！');
      }
    });

    // T-AP-002: 観戦者として参加申請できる
    it('観戦者として参加申請できる', async () => {
      const input = {
        participantType: 'SPECTATOR' as const,
        applicationMessage: '見学させてください',
      };

      const result = await applyToSession(
        recruitingSessionId,
        applicantUserId,
        input,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.participantType).toBe('SPECTATOR');
      }
    });

    // T-AP-003: メッセージなしで参加申請できる
    it('メッセージなしで参加申請できる', async () => {
      const input = {
        participantType: 'PLAYER' as const,
      };

      const result = await applyToSession(
        recruitingSessionId,
        applicantUserId,
        input,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.applicationMessage).toBeNull();
      }
    });

    // T-AP-004: 既に申請済みの場合エラー
    it('既に申請済みの場合エラー', async () => {
      // 事前にPENDING参加者を追加
      await addParticipant({
        sessionId: recruitingSessionId,
        userId: applicantUserId,
        type: 'PLAYER',
        status: 'PENDING',
      });

      const input = {
        participantType: 'PLAYER' as const,
      };

      const result = await applyToSession(
        recruitingSessionId,
        applicantUserId,
        input,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED,
        );
      }
    });

    // T-AP-005: 募集中以外のセッションに申請するとエラー
    it('募集中以外のセッションに申請するとエラー', async () => {
      const input = {
        participantType: 'PLAYER' as const,
      };

      const result = await applyToSession(
        preparationSessionId,
        applicantUserId,
        input,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.RECRUITMENT_CLOSED,
        );
      }
    });

    // T-AP-006: 存在しないセッションに申請するとエラー
    it('存在しないセッションに申請するとエラー', async () => {
      const input = {
        participantType: 'PLAYER' as const,
      };

      const result = await applyToSession(
        'non-existent-session-id',
        applicantUserId,
        input,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND,
        );
      }
    });
  });

  describe('approveApplication - 申請承認', () => {
    let pendingApplicantUserId: string;

    beforeEach(async () => {
      const applicant = await createTestUser();
      pendingApplicantUserId = applicant.user_id;
      createdUserIds.push(pendingApplicantUserId);

      // PENDING参加者を作成
      await addParticipant({
        sessionId: recruitingSessionId,
        userId: pendingApplicantUserId,
        type: 'PLAYER',
        status: 'PENDING',
      });
    });

    // T-AA-001: GMが申請を承認できる
    it('GMが申請を承認できる', async () => {
      const result = await approveApplication(
        recruitingSessionId,
        pendingApplicantUserId,
        gmUserId,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.participantStatus).toBe('CONFIRMED');
      }
    });

    // T-AA-002: GM以外が承認しようとするとエラー
    it('GM以外が承認しようとするとエラー', async () => {
      const otherUser = await createTestUser();
      createdUserIds.push(otherUser.user_id);

      const result = await approveApplication(
        recruitingSessionId,
        pendingApplicantUserId,
        otherUser.user_id,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
        );
      }
    });

    // T-AA-003: 既に承認済みの申請を承認しようとするとエラー
    it('既に承認済みの申請を承認しようとするとエラー', async () => {
      // まず承認する
      await approveApplication(
        recruitingSessionId,
        pendingApplicantUserId,
        gmUserId,
      );

      // 再度承認しようとする
      const result = await approveApplication(
        recruitingSessionId,
        pendingApplicantUserId,
        gmUserId,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.ALREADY_PROCESSED,
        );
      }
    });
  });

  describe('rejectApplication - 申請拒否', () => {
    let pendingApplicantUserId: string;

    beforeEach(async () => {
      const applicant = await createTestUser();
      pendingApplicantUserId = applicant.user_id;
      createdUserIds.push(pendingApplicantUserId);

      // PENDING参加者を作成
      await addParticipant({
        sessionId: recruitingSessionId,
        userId: pendingApplicantUserId,
        type: 'PLAYER',
        status: 'PENDING',
      });
    });

    // T-RA-001: GMが申請を拒否できる
    it('GMが申請を拒否できる', async () => {
      const result = await rejectApplication(
        recruitingSessionId,
        pendingApplicantUserId,
        gmUserId,
      );

      expect(result.success).toBe(true);
    });

    // T-RA-002: GM以外が拒否しようとするとエラー
    it('GM以外が拒否しようとするとエラー', async () => {
      const otherUser = await createTestUser();
      createdUserIds.push(otherUser.user_id);

      const result = await rejectApplication(
        recruitingSessionId,
        pendingApplicantUserId,
        otherUser.user_id,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
        );
      }
    });
  });

  describe('withdrawFromSession - 辞退', () => {
    let confirmedUserId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      confirmedUserId = user.user_id;
      createdUserIds.push(confirmedUserId);

      // CONFIRMED参加者を作成
      await addParticipant({
        sessionId: recruitingSessionId,
        userId: confirmedUserId,
        type: 'PLAYER',
        status: 'CONFIRMED',
      });
    });

    // T-WS-001: 承認済みの参加者が辞退できる
    it('承認済みの参加者が辞退できる', async () => {
      const reason = '予定が入ってしまいました';

      const result = await withdrawFromSession(
        recruitingSessionId,
        confirmedUserId,
        reason,
      );

      expect(result.success).toBe(true);
    });

    // T-WS-002: 完了済みセッションから辞退しようとするとエラー
    it('完了済みセッションから辞退しようとするとエラー', async () => {
      // completedSession に参加者を追加
      await addParticipant({
        sessionId: completedSessionId,
        userId: confirmedUserId,
        type: 'PLAYER',
        status: 'CONFIRMED',
      });

      const result = await withdrawFromSession(
        completedSessionId,
        confirmedUserId,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.CANNOT_WITHDRAW,
        );
      }
    });

    // T-WS-003: 参加していないセッションから辞退しようとするとエラー
    it('参加していないセッションから辞退しようとするとエラー', async () => {
      const nonParticipant = await createTestUser();
      createdUserIds.push(nonParticipant.user_id);

      const result = await withdrawFromSession(
        recruitingSessionId,
        nonParticipant.user_id,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT,
        );
      }
    });
  });

  describe('cancelApplication - 申請取り消し', () => {
    let pendingUserId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      pendingUserId = user.user_id;
      createdUserIds.push(pendingUserId);

      // PENDING参加者を作成
      await addParticipant({
        sessionId: recruitingSessionId,
        userId: pendingUserId,
        type: 'PLAYER',
        status: 'PENDING',
      });
    });

    // T-CA-001: PENDING状態の申請を取り消せる
    it('PENDING状態の申請を取り消せる', async () => {
      const result = await cancelApplication(
        recruitingSessionId,
        pendingUserId,
      );

      expect(result.success).toBe(true);
    });

    // T-CA-002: CONFIRMED状態の申請は取り消せない
    it('CONFIRMED状態の申請は取り消せない', async () => {
      const confirmedUser = await createTestUser();
      createdUserIds.push(confirmedUser.user_id);

      await addParticipant({
        sessionId: recruitingSessionId,
        userId: confirmedUser.user_id,
        type: 'PLAYER',
        status: 'CONFIRMED',
      });

      const result = await cancelApplication(
        recruitingSessionId,
        confirmedUser.user_id,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW,
        );
      }
    });
  });

  describe('cancelSession - セッションキャンセル', () => {
    // T-CSS-001: GMがセッションをキャンセルできる
    it('GMがセッションをキャンセルできる', async () => {
      // キャンセル用に別のRECRUITINGセッションを作成
      const cancelTargetSession = await createTestSession({
        keeperUserId: gmUserId,
      });
      const reason = '急用が入ってしまいました';

      const result = await cancelSession(
        cancelTargetSession.game_session_id,
        gmUserId,
        reason,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionPhase).toBe('CANCELLED');
      }

      // クリーンアップ
      await cleanupSessions([cancelTargetSession.game_session_id]);
    });

    // T-CSS-002: GM以外がキャンセルしようとするとエラー
    it('GM以外がキャンセルしようとするとエラー', async () => {
      const otherUser = await createTestUser();
      createdUserIds.push(otherUser.user_id);

      // キャンセル用セッション
      const cancelTargetSession = await createTestSession({
        keeperUserId: gmUserId,
      });

      const result = await cancelSession(
        cancelTargetSession.game_session_id,
        otherUser.user_id,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION,
        );
      }

      await cleanupSessions([cancelTargetSession.game_session_id]);
    });

    // T-CSS-003: 完了済みセッションはキャンセルできない
    it('完了済みセッションはキャンセルできない', async () => {
      const result = await cancelSession(completedSessionId, gmUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.COMPLETED_CANNOT_CANCEL,
        );
      }
    });

    // T-CSS-004: 既にキャンセル済みのセッションをキャンセルしようとするとエラー
    it('既にキャンセル済みのセッションをキャンセルしようとするとエラー', async () => {
      const result = await cancelSession(cancelledSessionId, gmUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          PARTICIPANT_ERROR_MESSAGES.ALREADY_CANCELLED,
        );
      }
    });
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
