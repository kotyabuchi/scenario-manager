import { cache } from 'react';

import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type {
  ActivityItem,
  CalendarSessionDate,
  NewScenario,
  UpcomingSession,
} from './interface';

/**
 * ダッシュボード用ユーザー情報を取得
 * React cache() でリクエスト内メモ化し、layout.tsx との重複呼び出しを排除
 */
export const getDashboardUser = cache(
  async (
    authId: string,
  ): Promise<
    Result<{ nickname: string; image: string | null; userId: string }>
  > => {
    try {
      const supabase = await createDbClient();
      const { data, error } = await supabase
        .from('users')
        .select('user_id, nickname, image')
        .eq('discord_id', authId)
        .single();

      if (error) {
        return err(new Error(error.message));
      }

      return ok({
        nickname: data.nickname,
        image: data.image,
        userId: data.user_id,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Unknown error'));
    }
  },
);

/**
 * 参加予定のセッションを取得（最大3件）
 * RECRUITING/PREPARATION/IN_PROGRESS/COMPLETED を対象とし、UI側で視覚的に区別
 */
export const getUpcomingSessions = async (
  userId: string,
): Promise<Result<UpcomingSession[]>> => {
  try {
    const supabase = await createDbClient();

    const { data: participantSessions, error: partError } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('user_id', userId);

    if (partError) {
      return err(new Error(partError.message));
    }

    if (!participantSessions || participantSessions.length === 0) {
      return ok([]);
    }

    const sessionIds = participantSessions.map((p) => p.session_id);

    const { data: sessions, error: sessError } = await supabase
      .from('game_sessions')
      .select(
        `
        *,
        scenario:scenarios(
          *,
          system:scenario_systems(*)
        ),
        participants:session_participants(
          *,
          user:users(*)
        ),
        schedule:game_schedules(*)
      `,
      )
      .in('game_session_id', sessionIds)
      .in('session_phase', [
        'RECRUITING',
        'PREPARATION',
        'IN_PROGRESS',
        'COMPLETED',
      ])
      .order('created_at', { ascending: false })
      .limit(3);

    if (sessError) {
      return err(new Error(sessError.message));
    }

    return ok(
      (sessions ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as UpcomingSession,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 新着シナリオを取得（最大3件）
 */
export const getNewScenarios = async (): Promise<Result<NewScenario[]>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('scenarios')
      .select(
        `
        *,
        system:scenario_systems(*),
        scenarioTags:scenario_tags(
          tag:tags(*)
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as NewScenario,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 最近のアクティビティを取得（最大5件）
 * 複数テーブルから活動を取得し、timestamp降順でマージ
 */
export const getRecentActivity = async (
  userId: string,
): Promise<Result<ActivityItem[]>> => {
  try {
    const supabase = await createDbClient();

    // keeper セッション情報 + ユーザーシナリオ情報を並列取得
    const [{ data: keeperSessions }, { data: userScenarios }] =
      await Promise.all([
        supabase
          .from('game_sessions')
          .select('game_session_id, session_name')
          .eq('keeper_id', userId),
        supabase
          .from('scenarios')
          .select('scenario_id, name')
          .eq('created_by_id', userId),
      ]);

    const keeperSessionIds =
      keeperSessions?.map((s) => s.game_session_id) ?? [];
    const sessionNameMap = new Map(
      keeperSessions?.map((s) => [s.game_session_id, s.session_name]) ?? [],
    );

    const userScenarioIds = userScenarios?.map((s) => s.scenario_id) ?? [];
    const scenarioNameMap = new Map(
      userScenarios?.map((s) => [s.scenario_id, s.name]) ?? [],
    );

    // 4種類のアクティビティを並列取得
    const [participantResult, scenarioResult, completedResult, reviewResult] =
      await Promise.all([
        // 1. セッションへの参加者
        keeperSessionIds.length > 0
          ? supabase
              .from('session_participants')
              .select('user_id, applied_at, session_id, user:users(nickname)')
              .in('session_id', keeperSessionIds)
              .neq('user_id', userId)
              .not('applied_at', 'is', null)
              .order('applied_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: null }),

        // 2. シナリオ更新
        supabase
          .from('scenarios')
          .select('scenario_id, name, updated_at')
          .eq('created_by_id', userId)
          .order('updated_at', { ascending: false })
          .limit(5),

        // 3. セッション完了
        keeperSessionIds.length > 0
          ? supabase
              .from('game_sessions')
              .select('game_session_id, session_name, updated_at')
              .eq('keeper_id', userId)
              .eq('session_phase', 'COMPLETED')
              .order('updated_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: null }),

        // 4. レビュー投稿
        userScenarioIds.length > 0
          ? supabase
              .from('user_reviews')
              .select(
                'user_review_id, created_at, scenario_id, user:users(nickname)',
              )
              .in('scenario_id', userScenarioIds)
              .neq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: null }),
      ]);

    const activities: ActivityItem[] = [];

    // 参加者アクティビティ
    for (const p of participantResult.data ?? []) {
      const user = p.user as { nickname: string } | null;
      activities.push({
        id: `participant-${p.session_id}-${p.user_id}`,
        type: 'participant_joined',
        description: `${user?.nickname ?? '不明'}さんが「${sessionNameMap.get(p.session_id) ?? 'セッション'}」に参加しました`,
        actorName: user?.nickname ?? '不明',
        targetName: sessionNameMap.get(p.session_id) ?? '',
        timestamp: p.applied_at ?? new Date().toISOString(),
      });
    }

    // シナリオ更新アクティビティ
    for (const s of scenarioResult.data ?? []) {
      activities.push({
        id: `scenario-${s.scenario_id}`,
        type: 'scenario_updated',
        description: `「${s.name}」を更新しました`,
        actorName: '',
        targetName: s.name,
        timestamp: s.updated_at,
      });
    }

    // セッション完了アクティビティ
    for (const s of completedResult.data ?? []) {
      activities.push({
        id: `session-${s.game_session_id}`,
        type: 'session_completed',
        description: `「${s.session_name}」が完了しました`,
        actorName: '',
        targetName: s.session_name,
        timestamp: s.updated_at,
      });
    }

    // レビューアクティビティ
    for (const r of reviewResult.data ?? []) {
      const user = r.user as { nickname: string } | null;
      activities.push({
        id: `review-${r.user_review_id}`,
        type: 'review_created',
        description: `${user?.nickname ?? '不明'}さんが「${scenarioNameMap.get(r.scenario_id) ?? 'シナリオ'}」にレビューを投稿しました`,
        actorName: user?.nickname ?? '不明',
        targetName: scenarioNameMap.get(r.scenario_id) ?? '',
        timestamp: r.created_at,
      });
    }

    return ok(mergeAndSortActivities(activities));
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * アクティビティ配列をtimestamp降順でソートし、最大5件に制限する
 * getRecentActivityから抽出した純粋関数（テスト容易性のため）
 */
export const mergeAndSortActivities = (
  activities: ActivityItem[],
): ActivityItem[] => {
  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 5);
};

/**
 * 指定期間のセッション日程を取得（カレンダー用）
 * ユーザーが参加または主催しているセッションの日程を返す
 */
export const getSessionDatesForRange = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Result<CalendarSessionDate[]>> => {
  try {
    const supabase = await createDbClient();

    // ユーザーが関連するセッションIDを取得
    const [participantResult, keeperResult] = await Promise.all([
      supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', userId),
      supabase
        .from('game_sessions')
        .select('game_session_id')
        .eq('keeper_id', userId),
    ]);

    const sessionIds = new Set([
      ...(participantResult.data?.map((p) => p.session_id) ?? []),
      ...(keeperResult.data?.map((s) => s.game_session_id) ?? []),
    ]);

    if (sessionIds.size === 0) {
      return ok([]);
    }

    const { data, error } = await supabase
      .from('game_schedules')
      .select('schedule_date, session_id, session:game_sessions(session_name)')
      .in('session_id', [...sessionIds])
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate);

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map((d) => {
        const session = d.session as { session_name: string } | null;
        return {
          scheduleDate: d.schedule_date,
          sessionId: d.session_id,
          sessionName: session?.session_name ?? '',
        };
      }),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
