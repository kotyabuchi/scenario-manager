import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { SchedulePhases, SessionPhases } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import {
  camelCaseKeys,
  toRecord,
  toRecordArray,
} from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type {
  SessionDetail,
  SessionLink,
  TimelineEvent,
  User,
} from '../interface';

type SessionLinkType = Database['public']['Enums']['session_link_type'];

const logger = getAppLogger(['app', 'sessions']);

// ========================================
// プライベートヘルパー: DB結果の変換関数
// ========================================

/** ユーザー参照（user_id, user_name）をキャメルケースに変換する */
const transformUserRef = (
  raw: unknown,
): Pick<User, 'userId' | 'userName'> | null => {
  if (isNil(raw)) return null;
  const obj = toRecord(raw);
  return { userId: obj.user_id as string, userName: obj.user_name as string };
};

/** 参加者リストを変換する（WITHDRAWN除外済み前提） */
const transformParticipants = (
  rawParticipants: Array<Record<string, unknown>>,
) =>
  rawParticipants.map((p) => ({
    ...camelCaseKeys(p),
    user: camelCaseKeys(toRecord(p.users)),
  }));

/** シナリオ（+system）を変換する */
const transformScenario = (raw: unknown) => {
  if (isNil(raw)) return null;
  const obj = toRecord(raw);
  return {
    ...camelCaseKeys(obj),
    system: camelCaseKeys(toRecord(obj.scenario_systems ?? obj.system)),
  };
};

/** リンクリストを変換する */
const transformLinks = (rawLinks: unknown): SessionLink[] =>
  toRecordArray(rawLinks).map((l) => camelCaseKeys(l) as SessionLink);

// ========================================
// 公開関数
// ========================================

/**
 * セッション詳細を取得する
 */
export const getSessionDetail = async (
  sessionId: string,
): Promise<Result<SessionDetail>> => {
  try {
    const supabase = await createDbClient();

    const [
      { data, error },
      { data: scheduleTimeBlocks, error: scheduleTimeBlocksError },
    ] = await Promise.all([
      supabase
        .from('game_sessions')
        .select(`
          *,
          keeper:users!game_sessions_keeper_id_users_user_id_fk(user_id, user_name),
          creator:users!game_sessions_created_by_id_fkey(user_id, user_name),
          scenarios(*, scenario_systems(*)),
          session_participants(*, users(*)),
          session_links(*)
        `)
        .eq('game_session_id', sessionId)
        .maybeSingle(),
      supabase
        .from('game_schedule_time_blocks')
        .select('*')
        .eq('session_id', sessionId)
        .order('block_order', { ascending: true }),
    ]);

    if (error) {
      logger.error`セッション詳細取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }
    if (scheduleTimeBlocksError) {
      logger.error`セッション詳細取得(確定日程)エラー: ${scheduleTimeBlocksError.message}`;
      return err(new Error(scheduleTimeBlocksError.message));
    }

    if (isNil(data)) {
      return err(new Error('セッションが見つかりません'));
    }

    const creator = transformUserRef(data.creator);
    if (isNil(creator)) {
      return err(new Error('作成者情報が見つかりません'));
    }

    const rawParticipants = toRecordArray(data.session_participants).filter(
      (p) => p.participant_status !== 'WITHDRAWN',
    );

    const sessionBase = camelCaseKeys(toRecord(data));

    // camelCaseKeys の戻り型は CamelCaseKeys<Record<string, unknown>> のため
    // SessionDetail へのアサーションが必要。各リレーションフィールドは
    // 上記の transform ヘルパーで型安全に変換済み。
    const sessionDetail = {
      ...sessionBase,
      scenario: transformScenario(data.scenarios),
      scheduleTimeBlocks: toRecordArray(scheduleTimeBlocks).map(
        (block) =>
          camelCaseKeys(block) as SessionDetail['scheduleTimeBlocks'][number],
      ),
      participants: transformParticipants(rawParticipants),
      links: transformLinks(data.session_links),
      keeper: transformUserRef(data.keeper),
      creator,
    } as SessionDetail;

    return ok(sessionDetail);
  } catch (e) {
    logger.error`getSessionDetail 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッション詳細からタイムラインを生成する（DBクエリなしの純粋変換）
 * getSessionDetail の結果を受け取り、重複クエリを排除する
 */
export const buildSessionTimeline = (
  session: SessionDetail,
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // セッション作成イベント
  events.push({
    type: 'created',
    date: session.createdAt,
    description: 'セッション作成',
  });

  // 参加申請・承認イベント
  for (const participant of session.participants) {
    const actor: Pick<User, 'userId' | 'userName'> = {
      userId: participant.user.userId,
      userName: participant.user.userName,
    };

    if (!isNil(participant.appliedAt)) {
      events.push({
        type: 'applied',
        date: participant.appliedAt,
        actor,
        description: `${actor.userName}が参加申請`,
      });
    }

    if (!isNil(participant.approvedAt)) {
      events.push({
        type: 'approved',
        date: participant.approvedAt,
        actor,
        description: `${actor.userName}の参加が承認`,
      });
    }
  }

  // 日程確定イベント
  if (
    session.schedulePhase === SchedulePhases.CONFIRMED.value &&
    !isNil(session.scheduleDate)
  ) {
    events.push({
      type: 'date_confirmed',
      date: session.scheduleDate,
      description: '日程確定',
    });
  }

  // セッション完了イベント
  if (
    session.sessionPhase === SessionPhases.COMPLETED.value &&
    !isNil(session.completedAt)
  ) {
    events.push({
      type: 'completed',
      date: session.completedAt,
      description: 'セッション完了',
    });
  }

  // 日時順でソート
  events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return events;
};

/**
 * セッションの現在のフェーズを取得する
 */
export const getSessionPhase = async (
  sessionId: string,
): Promise<Result<string>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_phase')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (error) {
      logger.error`セッションフェーズ取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    if (isNil(data)) {
      return err(new Error('セッションが見つかりません'));
    }

    return ok(data.session_phase);
  } catch (e) {
    logger.error`getSessionPhase 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションフェーズを更新する（楽観的ロック付き）
 * 認可チェックは呼び出し元の Action 側で実施済み
 */
export const updateSessionPhase = async (
  sessionId: string,
  phase: Database['public']['Enums']['session_phase'],
  expectedUpdatedAt: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();
    const { data: updatedSessions, error } = await supabase
      .from('game_sessions')
      .update({ session_phase: phase })
      .eq('game_session_id', sessionId)
      .eq('updated_at', expectedUpdatedAt)
      .select('game_session_id');

    if (error) {
      logger.error`セッションフェーズ更新エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    if (!updatedSessions || updatedSessions.length === 0) {
      return err(new Error('Conflict: session was modified'));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`updateSessionPhase 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションを完了する（楽観的ロック付き）
 * 認可チェックは呼び出し元の Action 側で実施済み
 */
export const completeSession = async (
  sessionId: string,
  expectedUpdatedAt: string,
  note?: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const updatePayload: {
      session_phase: 'COMPLETED';
      completed_at: string;
      completion_note?: string;
    } = {
      session_phase: 'COMPLETED',
      completed_at: new Date().toISOString(),
    };
    if (note) {
      updatePayload.completion_note = note;
    }

    const { data: updatedSessions, error } = await supabase
      .from('game_sessions')
      .update(updatePayload)
      .eq('game_session_id', sessionId)
      .eq('updated_at', expectedUpdatedAt)
      .select('game_session_id');

    if (error) {
      logger.error`セッション完了処理エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    if (!updatedSessions || updatedSessions.length === 0) {
      return err(new Error('Conflict: session was modified'));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`completeSession 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションメモを更新する（session_memo カラムを使用）
 * 認可チェックは呼び出し元の Action 側（isSessionManager）で実施済み
 */
export const updateSessionMemo = async (
  sessionId: string,
  memo: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const { error } = await supabase
      .from('game_sessions')
      .update({ session_memo: memo || null })
      .eq('game_session_id', sessionId);

    if (error) {
      logger.error`セッションメモ更新エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`updateSessionMemo 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッション基本情報を更新する（楽観的ロック + remaining_seat_count 同期）
 * 認可チェックは呼び出し元の Action 側（isSessionManager）で実施済み
 */
export const updateSessionBasicInfo = async (
  sessionId: string,
  data: {
    sessionName: string;
    sessionDescription: string;
    maxParticipantCount: number;
    isBeginnerFriendly: boolean;
  },
  expectedUpdatedAt: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    // 現在のmax/remainingを取得してdelta計算
    const { data: current, error: fetchError } = await supabase
      .from('game_sessions')
      .select('max_participant_count, remaining_seat_count')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (fetchError) {
      logger.error`基本情報取得エラー: ${fetchError.message}`;
      return err(new Error(fetchError.message));
    }

    if (isNil(current)) {
      return err(new Error('セッションが見つかりません'));
    }

    // remaining_seat_count の計算（maxParticipantCount=0 は「制限なし」）
    let newRemaining: number;

    if (data.maxParticipantCount === 0) {
      // 有限→無制限 または 無制限→無制限: remaining=0（無制限マーカー）
      newRemaining = 0;
    } else if (current.max_participant_count === 0) {
      // 無制限→有限: 現在の参加者数を実カウントして残席を算出
      const { count, error: countError } = await supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .in('participant_type', ['PLAYER', 'KEEPER'])
        .eq('participant_status', 'CONFIRMED');

      if (countError) {
        logger.error`参加者数取得エラー: ${countError.message}`;
        return err(new Error(countError.message));
      }

      const occupiedSeats = count ?? 0;
      newRemaining = data.maxParticipantCount - occupiedSeats;

      if (newRemaining < 0) {
        return err(new Error('参加上限を現在の参加者数以下に設定できません'));
      }
    } else {
      // 有限→有限: デルタ計算
      const delta = data.maxParticipantCount - current.max_participant_count;
      newRemaining = current.remaining_seat_count + delta;

      if (newRemaining < 0) {
        return err(new Error('参加上限を現在の参加者数以下に設定できません'));
      }
    }

    const { data: updatedSessions, error } = await supabase
      .from('game_sessions')
      .update({
        session_name: data.sessionName,
        session_description: data.sessionDescription,
        max_participant_count: data.maxParticipantCount,
        remaining_seat_count: newRemaining,
        is_beginner_friendly: data.isBeginnerFriendly,
      })
      .eq('game_session_id', sessionId)
      .eq('updated_at', expectedUpdatedAt)
      .select('game_session_id');

    if (error) {
      logger.error`基本情報更新エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    if (!updatedSessions || updatedSessions.length === 0) {
      return err(new Error('Conflict: session was modified'));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`updateSessionBasicInfo 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションリンク一覧を取得する
 */
export const getSessionLinks = async (
  sessionId: string,
): Promise<Result<SessionLink[]>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('session_links')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      logger.error`セッションリンク取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    const links = (data ?? []).map(
      (l) => camelCaseKeys(toRecord(l)) as SessionLink,
    );

    return ok(links);
  } catch (e) {
    logger.error`getSessionLinks 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションリンクをUpsertする（linkId があれば更新、なければ挿入）
 */
export const upsertSessionLink = async (
  sessionId: string,
  linkData: {
    linkType: string;
    url: string;
    label?: string | undefined;
    linkId?: string | undefined;
  },
): Promise<Result<SessionLink>> => {
  try {
    const supabase = await createDbClient();

    if (!isNil(linkData.linkId)) {
      // 更新（session_id も一致確認して IDOR を防止）
      const { data, error } = await supabase
        .from('session_links')
        .update({
          link_type: linkData.linkType as SessionLinkType,
          url: linkData.url,
          label: linkData.label ?? null,
        })
        .eq('link_id', linkData.linkId)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        logger.error`セッションリンク更新エラー: ${error.message}`;
        return err(new Error(error.message));
      }

      return ok(camelCaseKeys(toRecord(data)) as SessionLink);
    }

    // 挿入
    const { data, error } = await supabase
      .from('session_links')
      .insert({
        link_id: ulid(),
        session_id: sessionId,
        link_type: linkData.linkType as SessionLinkType,
        url: linkData.url,
        label: linkData.label ?? null,
      })
      .select()
      .single();

    if (error) {
      logger.error`セッションリンク挿入エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(camelCaseKeys(toRecord(data)) as SessionLink);
  } catch (e) {
    logger.error`upsertSessionLink 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションリンクを削除する
 */
export const deleteSessionLink = async (
  sessionId: string,
  linkId: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const { error } = await supabase
      .from('session_links')
      .delete()
      .eq('link_id', linkId)
      .eq('session_id', sessionId);

    if (error) {
      logger.error`セッションリンク削除エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`deleteSessionLink 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * キャラクターシートURLを更新する
 * TODO: session_participants テーブルに character_sheet_url カラムが存在しない場合は要追加
 */
export const updateCharacterSheetUrl = async (
  sessionId: string,
  userId: string,
  url: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const { error } = await supabase
      .from('session_participants')
      .update({ character_sheet_url: url || null })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      logger.error`キャラクターシートURL更新エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`updateCharacterSheetUrl 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
