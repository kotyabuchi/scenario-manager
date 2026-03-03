import { isNil } from 'ramda';

import { ParticipantStatuses, SessionPhases } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { SessionParticipantRow } from '@/db/helpers';

const logger = getAppLogger(['app', 'sessions']);

/**
 * セッションの管理者（KeeperまたはCreator）かどうかを確認する
 */
export const isSessionManager = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const supabase = await createDbClient();
  const { data: session, error } = await supabase
    .from('game_sessions')
    .select('keeper_id, created_by_id')
    .eq('game_session_id', sessionId)
    .maybeSingle();

  if (error) {
    logger.error`isSessionManager DBエラー: ${error.message}`;
    return false;
  }

  return session?.keeper_id === userId || session?.created_by_id === userId;
};

/**
 * 参加申請入力型
 */
export type ApplyToSessionInput = {
  participantType: 'KEEPER' | 'PLAYER' | 'SPECTATOR';
  applicationMessage?: string | null | undefined;
};

/**
 * 参加者情報型（Supabase生成型から導出）
 */
export type ParticipantResult = Pick<
  SessionParticipantRow,
  | 'sessionId'
  | 'userId'
  | 'participantType'
  | 'participantStatus'
  | 'applicationMessage'
>;

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
  NO_SEATS_LEFT: '残りのプレイヤー募集席がありません',
  COMPLETED_CANNOT_CANCEL: '完了済みのセッションはキャンセルできません',
  ALREADY_CANCELLED: 'このセッションは既にキャンセル済みです',
  PARTICIPANT_NOT_FOUND: '参加申請が見つかりません',
  ALREADY_WITHDRAWN: '辞退済みの申請は取り消せません',
} as const;

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
      .select('session_id, participant_status')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!isNil(existingParticipant)) {
      // 辞退済みの場合は再申請を許可（WITHDRAWN → PENDING に復帰）
      if (
        existingParticipant.participant_status ===
        ParticipantStatuses.WITHDRAWN.value
      ) {
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({
            participant_type: input.participantType,
            participant_status: ParticipantStatuses.PENDING.value,
            application_message: input.applicationMessage ?? null,
            applied_at: new Date().toISOString(),
            withdrawal_reason: null,
          })
          .eq('session_id', sessionId)
          .eq('user_id', userId);

        if (updateError) {
          logger.error`再申請更新エラー: ${updateError.message}`;
          return err(new Error(updateError.message));
        }

        return ok({
          sessionId,
          userId,
          participantType: input.participantType,
          participantStatus: ParticipantStatuses.PENDING.value,
          applicationMessage: input.applicationMessage ?? null,
        });
      }
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED));
    }

    // 参加申請を作成
    const { error: insertError } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        participant_type: input.participantType,
        participant_status: ParticipantStatuses.PENDING.value,
        application_message: input.applicationMessage ?? null,
        applied_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error`参加申請作成エラー: ${insertError.message}`;
      return err(new Error(insertError.message));
    }

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

    // GMかどうか確認（参加申請データの取得より先に認可チェック）
    const isGM = await isSessionManager(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

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

    // 辞退済みの場合は承認不可
    if (
      participant.participant_status === ParticipantStatuses.WITHDRAWN.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_WITHDRAWN));
    }

    // 既に処理済みかどうか確認
    if (
      participant.participant_status === ParticipantStatuses.CONFIRMED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_PROCESSED));
    }

    // PLAYER 承認時は残りPL募集席を確認（見学は対象外）
    if (participant.participant_type === 'PLAYER') {
      const { data: sessionCapacity, error: capacityError } = await supabase
        .from('game_sessions')
        .select('remaining_seat_count')
        .eq('game_session_id', sessionId)
        .maybeSingle();

      if (capacityError) {
        logger.error`残りPL募集席取得エラー: ${capacityError.message}`;
        return err(new Error(capacityError.message));
      }

      if (isNil(sessionCapacity) || sessionCapacity.remaining_seat_count <= 0) {
        return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_SEATS_LEFT));
      }
    }

    // 承認処理
    const { error: updateError } = await supabase
      .from('session_participants')
      .update({
        participant_status: ParticipantStatuses.CONFIRMED.value,
        approved_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId);

    if (updateError) {
      logger.error`参加申請承認エラー: ${updateError.message}`;
      return err(new Error(updateError.message));
    }

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

    // GMかどうか確認（認可チェックをデータアクセスより先に実施）
    const isGM = await isSessionManager(sessionId, gmUserId);
    if (!isGM) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NO_PERMISSION));
    }

    // 参加申請の存在確認
    const { data: participant } = await supabase
      .from('session_participants')
      .select('session_id, participant_status')
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.PARTICIPANT_NOT_FOUND));
    }

    // 承認済み参加者は拒否できない（辞退フローを案内）
    if (
      participant.participant_status === ParticipantStatuses.CONFIRMED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW));
    }

    // 参加者レコードを削除
    const { error: deleteError } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', applicantUserId);

    if (deleteError) {
      logger.error`参加申請拒否エラー: ${deleteError.message}`;
      return err(new Error(deleteError.message));
    }

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションから辞退する（ステータスを WITHDRAWN に更新）
 */
export const withdrawFromSession = async (
  sessionId: string,
  userId: string,
  reason?: string,
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
      .select('session_id, participant_status')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.NOT_PARTICIPANT));
    }

    // 既に辞退済みの場合
    if (
      participant.participant_status === ParticipantStatuses.WITHDRAWN.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_WITHDRAWN));
    }

    // ステータスを WITHDRAWN に更新し、辞退理由を保存
    const { error: withdrawError } = await supabase
      .from('session_participants')
      .update({
        participant_status: ParticipantStatuses.WITHDRAWN.value,
        withdrawal_reason: reason ?? null,
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (withdrawError) {
      logger.error`辞退処理エラー: ${withdrawError.message}`;
      return err(new Error(withdrawError.message));
    }

    // 提出済みスケジュールを削除（best-effort: 辞退処理自体は上記で完了済み）
    const { error: deleteAvailabilityError } = await supabase
      .from('session_availability_time_blocks')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (deleteAvailabilityError) {
      logger.warn`辞退後のスケジュール削除でエラー（best-effort）: ${deleteAvailabilityError.message}`;
    }

    logger.info`ユーザー ${userId} がセッション ${sessionId} から辞退`;

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

    // 辞退済みの場合は取り消せない
    if (
      participant.participant_status === ParticipantStatuses.WITHDRAWN.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_WITHDRAWN));
    }

    // 承認済みの場合は取り消せない（辞退を使う）
    if (
      participant.participant_status === ParticipantStatuses.CONFIRMED.value
    ) {
      return err(new Error(PARTICIPANT_ERROR_MESSAGES.USE_WITHDRAW));
    }

    // 申請を削除
    const { error: deleteError } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error`申請取り消しエラー: ${deleteError.message}`;
      return err(new Error(deleteError.message));
    }

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
  reason?: string,
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
    const isGM = await isSessionManager(sessionId, gmUserId);
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

    // キャンセル処理（キャンセル理由を保存）
    const { error: cancelError } = await supabase
      .from('game_sessions')
      .update({
        session_phase: SessionPhases.CANCELLED.value,
        cancel_reason: reason ?? null,
      })
      .eq('game_session_id', sessionId);

    if (cancelError) {
      logger.error`セッションキャンセルエラー: ${cancelError.message}`;
      return err(new Error(cancelError.message));
    }

    return ok({
      gameSessionId: sessionId,
      sessionPhase: SessionPhases.CANCELLED.value,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
