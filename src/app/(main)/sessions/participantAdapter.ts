import { and, eq } from 'drizzle-orm';
import { isNil } from 'ramda';

import { getDb } from '@/db';
import { ParticipantStatuses, SessionPhases } from '@/db/enum';
import { gameSessions, sessionParticipants } from '@/db/schema';
import { err, ok, type Result } from '@/types/result';

/**
 * 参加申請入力型
 */
export type ApplyToSessionInput = {
  participantType: 'PLAYER' | 'SPECTATOR';
  applicationMessage?: string | null;
};

/**
 * 参加者情報型
 */
export type ParticipantResult = {
  sessionId: string;
  userId: string;
  participantType: string;
  participantStatus: string;
  applicationMessage: string | null;
};

/**
 * セッションキャンセル結果型
 */
export type CancelSessionResult = {
  gameSessionId: string;
  sessionPhase: string;
};

/**
 * エラーメッセージ定数
 */
export const PARTICIPANT_ERROR_MESSAGES = {
  ALREADY_APPLIED: 'すでに申請済みです',
  RECRUITMENT_CLOSED: 'このセッションは募集を終了しています',
  SESSION_NOT_FOUND: 'セッションが見つかりません',
  NO_PERMISSION: 'この操作を行う権限がありません',
  ALREADY_PROCESSED: 'この申請は既に処理済みです',
  CANNOT_WITHDRAW: 'このセッションからは辞退できません',
  NOT_PARTICIPANT: 'このセッションに参加していません',
  USE_WITHDRAW: '承認済みの申請は取り消せません。辞退してください',
  COMPLETED_CANNOT_CANCEL: '完了済みのセッションはキャンセルできません',
  ALREADY_CANCELLED: 'このセッションは既にキャンセル済みです',
  PARTICIPANT_NOT_FOUND: '参加申請が見つかりません',
} as const;

/**
 * セッションのGMかどうかを確認
 */
const isSessionGM = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const db = getDb();
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.gameSessionId, sessionId),
  });
  return session?.keeperId === userId;
};

/**
 * セッションに参加申請する
 *
 * @param sessionId - セッションID
 * @param userId - 申請者のユーザーID
 * @param input - 申請情報（参加タイプ、メッセージ）
 * @returns 作成された参加者情報
 *
 * 要件: requirements-session-flow.md Section 3.4
 * - US-S108: PLとして、プレイヤーまたは観戦者として申請できる
 */
export const applyToSession = async (
  sessionId: string,
  userId: string,
  input: ApplyToSessionInput,
): Promise<Result<ParticipantResult>> => {
  const db = getDb();

  try {
    // セッションの存在確認
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.gameSessionId, sessionId),
    });

    if (isNil(session)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND));
    }

    // 募集中かどうか確認
    if (session.sessionPhase !== SessionPhases.RECRUITING.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.RECRUITMENT_CLOSED));
    }

    // 既に申請済みかどうか確認
    const existingParticipant = await db.query.sessionParticipants.findFirst({
      where: and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId),
      ),
    });

    if (!isNil(existingParticipant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED));
    }

    // 参加申請を作成
    await db.insert(sessionParticipants).values({
      sessionId: sessionId,
      userId: userId,
      participantType: input.participantType,
      participantStatus: ParticipantStatuses.PENDING.value,
      applicationMessage: input.applicationMessage ?? null,
      appliedAt: new Date(),
    });

    return ok({
      sessionId: sessionId,
      userId: userId,
      participantType: input.participantType,
      participantStatus: ParticipantStatuses.PENDING.value,
      applicationMessage: input.applicationMessage ?? null,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を承認する
 *
 * @param sessionId - セッションID
 * @param applicantUserId - 申請者のユーザーID
 * @param gmUserId - GMのユーザーID
 * @returns 更新された参加者情報
 *
 * 要件: requirements-session-flow.md Section 3.6
 * - US-S106: GMとして、参加希望者のプロフィールを見て承認/拒否できる
 */
export const approveApplication = async (
  sessionId: string,
  applicantUserId: string,
  gmUserId: string,
): Promise<Result<ParticipantResult>> => {
  const db = getDb();

  try {
    // 参加申請の存在確認
    const participant = await db.query.sessionParticipants.findFirst({
      where: and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, applicantUserId),
      ),
    });

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.PARTICIPANT_NOT_FOUND));
    }

    // GMかどうか確認
    const isGM = await isSessionGM(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 既に処理済みかどうか確認
    if (participant.participantStatus === ParticipantStatuses.CONFIRMED.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_PROCESSED));
    }

    // 承認処理
    await db
      .update(sessionParticipants)
      .set({
        participantStatus: ParticipantStatuses.CONFIRMED.value,
        approvedAt: new Date(),
      })
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, applicantUserId),
        ),
      );

    return ok({
      sessionId: sessionId,
      userId: applicantUserId,
      participantType: participant.participantType,
      participantStatus: ParticipantStatuses.CONFIRMED.value,
      applicationMessage: participant.applicationMessage,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を拒否する
 *
 * @param sessionId - セッションID
 * @param applicantUserId - 申請者のユーザーID
 * @param gmUserId - GMのユーザーID
 * @returns 成功/失敗
 *
 * 要件: requirements-session-flow.md Section 3.6
 */
export const rejectApplication = async (
  sessionId: string,
  applicantUserId: string,
  gmUserId: string,
): Promise<Result<void>> => {
  const db = getDb();

  try {
    // 参加申請の存在確認
    const participant = await db.query.sessionParticipants.findFirst({
      where: and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, applicantUserId),
      ),
    });

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.PARTICIPANT_NOT_FOUND));
    }

    // GMかどうか確認
    const isGM = await isSessionGM(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 参加者レコードを削除
    await db
      .delete(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, applicantUserId),
        ),
      );

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションから辞退する
 *
 * @param sessionId - セッションID
 * @param userId - 辞退するユーザーID
 * @param _reason - 辞退理由（オプション）
 * @returns 成功/失敗
 *
 * 要件: requirements-session-flow.md Section 3.4
 * - US-S110: PLとして、承認済みセッションから辞退できる
 */
export const withdrawFromSession = async (
  sessionId: string,
  userId: string,
  _reason?: string,
): Promise<Result<void>> => {
  const db = getDb();

  try {
    // セッションの存在確認
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.gameSessionId, sessionId),
    });

    if (isNil(session)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND));
    }

    // 完了済みセッションからは辞退できない
    if (
      session.sessionPhase === SessionPhases.COMPLETED.value ||
      session.sessionPhase === SessionPhases.CANCELLED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.CANNOT_WITHDRAW));
    }

    // 参加者かどうか確認
    const participant = await db.query.sessionParticipants.findFirst({
      where: and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId),
      ),
    });

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT));
    }

    // 参加者レコードを削除
    await db
      .delete(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId),
        ),
      );

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を取り消す
 *
 * @param sessionId - セッションID
 * @param userId - 取り消すユーザーID
 * @returns 成功/失敗
 *
 * 要件: requirements-session-flow.md Section 3.4
 * - US-S111: PLとして、承認待ちの申請を取り消しできる
 */
export const cancelApplication = async (
  sessionId: string,
  userId: string,
): Promise<Result<void>> => {
  const db = getDb();

  try {
    // 参加申請の存在確認
    const participant = await db.query.sessionParticipants.findFirst({
      where: and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId),
      ),
    });

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT));
    }

    // 承認済みの場合は取り消せない（辞退を使う）
    if (participant.participantStatus === ParticipantStatuses.CONFIRMED.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW));
    }

    // 申請を削除
    await db
      .delete(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId),
        ),
      );

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションをキャンセルする
 *
 * @param sessionId - セッションID
 * @param gmUserId - GMのユーザーID
 * @param _reason - キャンセル理由（オプション）
 * @returns キャンセルされたセッション情報
 *
 * 要件: requirements-session-flow.md Section 3
 * - US-S109: GMとして、セッションをキャンセルできる
 */
export const cancelSession = async (
  sessionId: string,
  gmUserId: string,
  _reason?: string,
): Promise<Result<CancelSessionResult>> => {
  const db = getDb();

  try {
    // セッションの存在確認
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.gameSessionId, sessionId),
    });

    if (isNil(session)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND));
    }

    // GMかどうか確認
    const isGM = await isSessionGM(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 完了済みはキャンセルできない
    if (session.sessionPhase === SessionPhases.COMPLETED.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.COMPLETED_CANNOT_CANCEL));
    }

    // 既にキャンセル済み
    if (session.sessionPhase === SessionPhases.CANCELLED.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_CANCELLED));
    }

    // キャンセル処理
    await db
      .update(gameSessions)
      .set({
        sessionPhase: SessionPhases.CANCELLED.value,
      })
      .where(eq(gameSessions.gameSessionId, sessionId));

    return ok({
      gameSessionId: sessionId,
      sessionPhase: SessionPhases.CANCELLED.value,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
