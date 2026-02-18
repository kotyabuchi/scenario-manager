'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../adapter';
import {
  applyToSession,
  cancelApplication,
  cancelSession,
  isSessionManager,
  withdrawFromSession,
} from '../participantAdapter';
import {
  completeSession,
  deleteSessionLink,
  getSessionPhase,
  updateCharacterSheetUrl,
  updateSessionMemo,
  updateSessionPhase,
  upsertSessionLink,
} from './adapter';
import {
  cancelApplicationSchema,
  cancelSessionSchema,
  characterSheetSchema,
  completeSessionSchema,
  participationRequestSchema,
  sessionLinkSchema,
  sessionMemoSchema,
  withdrawSchema,
} from './schema';

import { ParticipantStatuses } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type { SessionLink } from '../interface';
import type {
  CancelApplicationValues,
  CancelSessionValues,
  CompleteSessionValues,
  ParticipationRequestValues,
  SessionLinkValues,
  WithdrawValues,
} from './schema';

const logger = getAppLogger(['app', 'sessions']);

type SessionPhaseValue = Database['public']['Enums']['session_phase'];

/**
 * フェーズ遷移の許可マップ
 * 注意: ADJUSTING は schedule_phase の値だが、セッションフロー上の遷移先として使用している
 */
const VALID_TRANSITIONS: Partial<
  Record<SessionPhaseValue | 'ADJUSTING', (SessionPhaseValue | 'ADJUSTING')[]>
> = {
  RECRUITING: ['ADJUSTING', 'PREPARATION', 'CANCELLED'],
  ADJUSTING: ['PREPARATION', 'CANCELLED'],
  PREPARATION: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
};

/**
 * フェーズ遷移が有効かどうかを確認する
 */
const validatePhaseTransition = (current: string, next: string): boolean => {
  const allowed = VALID_TRANSITIONS[current as SessionPhaseValue | 'ADJUSTING'];
  if (!allowed) return false;
  return allowed.includes(next as SessionPhaseValue | 'ADJUSTING');
};

/**
 * セッションメモを更新する
 */
export const updateMemoAction = async (
  sessionId: string,
  memo: string,
): Promise<Result<void>> => {
  try {
    // 認可チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    // Zodバリデーション
    const parsed = sessionMemoSchema.safeParse({ memo });
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // メモ更新
    const result = await updateSessionMemo(sessionId, parsed.data.memo);
    if (!result.success) {
      logger.error`セッションメモ更新エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションリンクをupsertする
 */
export const upsertLinkAction = async (
  sessionId: string,
  formData: SessionLinkValues,
): Promise<Result<SessionLink>> => {
  try {
    // 認可チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    // Zodバリデーション
    const parsed = sessionLinkSchema.safeParse(formData);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // リンクupsert
    const result = await upsertSessionLink(sessionId, parsed.data);
    if (!result.success) {
      logger.error`セッションリンクupsertエラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(result.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションリンクを削除する
 */
export const deleteLinkAction = async (
  linkId: string,
  sessionId: string,
): Promise<Result<void>> => {
  try {
    // 認可チェック（sessionIdで検証）
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    // リンク削除
    const result = await deleteSessionLink(sessionId, linkId);
    if (!result.success) {
      logger.error`セッションリンク削除エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * キャラクターシートURLを更新する（本人のみ）
 */
export const updateCharacterSheetAction = async (
  sessionId: string,
  url: string,
): Promise<Result<void>> => {
  try {
    // 認可チェック（セッション参加者本人のみ）
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    // セッション参加者かどうか確認（辞退済みを除外）
    const dbClient = await createDbClient();
    const { data: participant } = await dbClient
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .neq('participant_status', ParticipantStatuses.WITHDRAWN.value)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error('このセッションに参加していません'));
    }

    // Zodバリデーション
    const parsed = characterSheetSchema.safeParse({ url });
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // キャラクターシートURL更新
    const result = await updateCharacterSheetUrl(
      sessionId,
      userId,
      parsed.data.url,
    );
    if (!result.success) {
      logger.error`キャラクターシートURL更新エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッション参加を申請する
 */
export const applyToSessionAction = async (
  sessionId: string,
  data: ParticipationRequestValues,
): Promise<Result<void>> => {
  try {
    // 認証チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    // Zodバリデーション
    const parsed = participationRequestSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // 参加申請
    const result = await applyToSession(sessionId, userId, {
      participantType: parsed.data.participantType,
      applicationMessage: parsed.data.applicationMessage,
    });
    if (!result.success) {
      logger.error`参加申請エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションから辞退する
 */
export const withdrawFromSessionAction = async (
  sessionId: string,
  data: WithdrawValues,
): Promise<Result<void>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const parsed = withdrawSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    const result = await withdrawFromSession(
      sessionId,
      userId,
      parsed.data.reason,
    );
    if (!result.success) {
      logger.error`辞退処理エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を取り消す
 */
export const cancelApplicationAction = async (
  sessionId: string,
  _data: CancelApplicationValues,
): Promise<Result<void>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const parsed = cancelApplicationSchema.safeParse(_data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    const result = await cancelApplication(sessionId, userId);
    if (!result.success) {
      logger.error`申請取り消しエラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションをキャンセルする（GM用）
 */
export const cancelSessionAction = async (
  sessionId: string,
  data: CancelSessionValues,
): Promise<Result<void>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    const parsed = cancelSessionSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    const result = await cancelSession(sessionId, userId, parsed.data.reason);
    if (!result.success) {
      logger.error`セッションキャンセルエラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションを完了する（楽観的ロック付き）
 */
export const completeSessionAction = async (
  sessionId: string,
  expectedUpdatedAt: string,
  data: CompleteSessionValues,
): Promise<Result<void>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    const parsed = completeSessionSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // 現在のフェーズを取得して遷移チェック
    const phaseResult = await getSessionPhase(sessionId);
    if (!phaseResult.success) {
      return err(phaseResult.error);
    }

    if (!validatePhaseTransition(phaseResult.data, 'COMPLETED')) {
      return err(
        new Error(
          `${phaseResult.data} から COMPLETED へのフェーズ遷移は許可されていません`,
        ),
      );
    }

    // セッション完了（adapter経由）
    const result = await completeSession(
      sessionId,
      expectedUpdatedAt,
      parsed.data.note,
    );
    if (!result.success) {
      logger.error`セッション完了処理エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションフェーズを更新する（楽観的ロック付き）
 */
export const updateSessionPhaseAction = async (
  sessionId: string,
  phase: Database['public']['Enums']['session_phase'],
  expectedUpdatedAt: string,
): Promise<Result<void>> => {
  try {
    // 認証チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    // 認可チェック
    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    // フェーズ値のバリデーション
    const validPhases = [
      'RECRUITING',
      'PREPARATION',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ] as const;
    if (!validPhases.includes(phase as (typeof validPhases)[number])) {
      return err(new Error('無効なフェーズ値です'));
    }

    // 現在のフェーズを取得して遷移チェック
    const phaseResult = await getSessionPhase(sessionId);
    if (!phaseResult.success) {
      return err(phaseResult.error);
    }

    if (!validatePhaseTransition(phaseResult.data, phase)) {
      return err(
        new Error(
          `${phaseResult.data} から ${phase} へのフェーズ遷移は許可されていません`,
        ),
      );
    }

    // 楽観的ロックによるフェーズ更新（adapter経由）
    const result = await updateSessionPhase(
      sessionId,
      phase,
      expectedUpdatedAt,
    );
    if (!result.success) {
      logger.error`セッションフェーズ更新エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
