import { isNil } from 'ramda';

import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys, toRecord } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type { CamelCaseKeys } from '@/lib/supabase/transform';

const logger = getAppLogger(['app', 'sessions']);

type SessionParticipantRow =
  Database['public']['Tables']['session_participants']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

/**
 * ユーザー情報付き申請情報（Supabase生成型から導出）
 */
export type ApplicationWithUser = CamelCaseKeys<
  Pick<
    SessionParticipantRow,
    | 'session_id'
    | 'user_id'
    | 'participant_type'
    | 'participant_status'
    | 'application_message'
    | 'applied_at'
    | 'approved_at'
  >
> & {
  user: CamelCaseKeys<
    Pick<UserRow, 'user_id' | 'user_name' | 'nickname' | 'image' | 'bio'>
  >;
};

/**
 * 申請統計
 */
export type ApplicationStats = {
  total: number;
  pending: number;
  confirmed: number;
};

/**
 * セッションの申請一覧を取得する（PENDING・CONFIRMED のみ、WITHDRAWN除外）
 */
export const getApplications = async (
  sessionId: string,
): Promise<Result<ApplicationWithUser[]>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('session_participants')
      .select(
        'session_id, user_id, participant_type, participant_status, application_message, applied_at, approved_at, users(*)',
      )
      .eq('session_id', sessionId)
      .neq('participant_status', 'WITHDRAWN')
      .order('applied_at', { ascending: true });

    if (error) {
      logger.error`申請一覧取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    // Supabase の型付きデータから直接マッピング（camelCaseKeys 不要）
    const applications: ApplicationWithUser[] = (data ?? []).map((p) => {
      const userRecord = toRecord(p.users);
      const user = camelCaseKeys(userRecord) as ApplicationWithUser['user'];
      return {
        sessionId: p.session_id,
        userId: p.user_id,
        participantType: p.participant_type,
        participantStatus: p.participant_status,
        applicationMessage: p.application_message,
        appliedAt: p.applied_at,
        approvedAt: p.approved_at,
        user,
      };
    });

    return ok(applications);
  } catch (e) {
    logger.error`getApplications 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 申請リストから統計を算出する（DBクエリなしの純粋変換）
 * getApplications の結果を再利用して二重アクセスを排除
 */
export const computeApplicationStats = (
  applications: ApplicationWithUser[],
): ApplicationStats => {
  const pending = applications.filter(
    (a) => a.participantStatus === 'PENDING',
  ).length;
  const confirmed = applications.filter(
    (a) => a.participantStatus === 'CONFIRMED',
  ).length;
  return { total: applications.length, pending, confirmed };
};

/**
 * セッション名と最大プレイヤー数を取得する
 */
export const getSessionBasicInfo = async (
  sessionId: string,
): Promise<Result<{ sessionName: string; maxPlayer: number | null }>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_name, max_participant_count')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (error) {
      logger.error`セッション基本情報取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    if (isNil(data)) {
      return err(new Error('セッションが見つかりません'));
    }

    return ok({
      sessionName: data.session_name,
      maxPlayer: data.max_participant_count,
    });
  } catch (e) {
    logger.error`getSessionBasicInfo 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
