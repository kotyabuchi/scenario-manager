import { isNil } from 'ramda';

import { ParticipantStatuses, SessionPhases } from '@/db/enum';
import { createDbClient } from '@/lib/supabase/server';
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
  const supabase = await createDbClient();
  const { data: session } = await supabase
    .from('game_sessions')
    .select('keeper_id')
    .eq('game_session_id', sessionId)
    .maybeSingle();
  return session?.keeper_id === userId;
};

/**
 * セッションに参加申請する
 */
export const applyToSession = async (
  sessionId: string,
  userId: string,
  input: ApplyToSessionInput,
): Promise<Result<ParticipantResult>> => {
  try {
    const supabase = await createDbClient();

    // セッションの存在確認
    const { data: session } = await supabase
      .from('game_sessions')
      .select('game_session_id, session_phase')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (isNil(session)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND));
    }

    // 募集中かどうか確認
    if (session.session_phase !== SessionPhases.RECRUITING.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.RECRUITMENT_CLOSED));
    }

    // 既に申請済みかどうか確認
    const { data: existingParticipant } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!isNil(existingParticipant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED));
    }

    // 参加申請を作成
    await supabase.from('session_participants').insert({
      session_id: sessionId,
      user_id: userId,
      participant_type: input.participantType,
      participant_status: ParticipantStatuses.PENDING.value,
      application_message: input.applicationMessage ?? null,
      applied_at: new Date().toISOString(),
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
 */
export const approveApplication = async (
  sessionId: string,
  applicantUserId: string,
  gmUserId: string,
): Promise<Result<ParticipantResult>> => {
  try {
    const supabase = await createDbClient();

    // 参加申請の存在確認
    const { data: participant } = await supabase
      .from('session_participants')
      .select('participant_type, participant_status, application_message')
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.PARTICIPANT_NOT_FOUND));
    }

    // GMかどうか確認
    const isGM = await isSessionGM(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 既に処理済みかどうか確認
    if (
      participant.participant_status === ParticipantStatuses.CONFIRMED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_PROCESSED));
    }

    // 承認処理
    await supabase
      .from('session_participants')
      .update({
        participant_status: ParticipantStatuses.CONFIRMED.value,
        approved_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId);

    return ok({
      sessionId: sessionId,
      userId: applicantUserId,
      participantType: participant.participant_type,
      participantStatus: ParticipantStatuses.CONFIRMED.value,
      applicationMessage: participant.application_message,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を拒否する
 */
export const rejectApplication = async (
  sessionId: string,
  applicantUserId: string,
  gmUserId: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    // 参加申請の存在確認
    const { data: participant } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.PARTICIPANT_NOT_FOUND));
    }

    // GMかどうか確認
    const isGM = await isSessionGM(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 参加者レコードを削除
    await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId);

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションから辞退する
 */
export const withdrawFromSession = async (
  sessionId: string,
  userId: string,
  _reason?: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    // セッションの存在確認
    const { data: session } = await supabase
      .from('game_sessions')
      .select('game_session_id, session_phase')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (isNil(session)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND));
    }

    // 完了済みセッションからは辞退できない
    if (
      session.session_phase === SessionPhases.COMPLETED.value ||
      session.session_phase === SessionPhases.CANCELLED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.CANNOT_WITHDRAW));
    }

    // 参加者かどうか確認
    const { data: participant } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT));
    }

    // 参加者レコードを削除
    await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を取り消す
 */
export const cancelApplication = async (
  sessionId: string,
  userId: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    // 参加申請の存在確認
    const { data: participant } = await supabase
      .from('session_participants')
      .select('participant_status')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT));
    }

    // 承認済みの場合は取り消せない（辞退を使う）
    if (
      participant.participant_status === ParticipantStatuses.CONFIRMED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW));
    }

    // 申請を削除
    await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションをキャンセルする
 */
export const cancelSession = async (
  sessionId: string,
  gmUserId: string,
  _reason?: string,
): Promise<Result<CancelSessionResult>> => {
  try {
    const supabase = await createDbClient();

    // セッションの存在確認
    const { data: session } = await supabase
      .from('game_sessions')
      .select('game_session_id, session_phase')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (isNil(session)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.SESSION_NOT_FOUND));
    }

    // GMかどうか確認
    const isGM = await isSessionGM(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 完了済みはキャンセルできない
    if (session.session_phase === SessionPhases.COMPLETED.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.COMPLETED_CANNOT_CANCEL));
    }

    // 既にキャンセル済み
    if (session.session_phase === SessionPhases.CANCELLED.value) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_CANCELLED));
    }

    // キャンセル処理
    await supabase
      .from('game_sessions')
      .update({
        session_phase: SessionPhases.CANCELLED.value,
      })
      .eq('game_session_id', sessionId);

    return ok({
      gameSessionId: sessionId,
      sessionPhase: SessionPhases.CANCELLED.value,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
