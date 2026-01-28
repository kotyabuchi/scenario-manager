import { isNil } from 'ramda';

import { ParticipantTypes, SessionPhases } from '@/db/enum';
import { createClient, createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type {
  CalendarData,
  HistorySortOption,
  MySessionWithRole,
  PublicSearchParams,
  PublicSession,
  PublicSortOption,
  RoleFilterValue,
  ScenarioSystem,
  SearchResult,
  StatusFilterValue,
  UpcomingSortOption,
} from './interface';

/**
 * 現在のユーザーIDを取得
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('discord_id', user.id)
      .maybeSingle();

    return dbUser?.user_id ?? null;
  } catch {
    return null;
  }
};

/**
 * 公開セッションを検索
 */
export const searchPublicSessions = async (
  params: PublicSearchParams,
  sort: PublicSortOption = 'date_asc',
  limit = 20,
  offset = 0,
): Promise<Result<SearchResult<PublicSession>>> => {
  try {
    const supabase = await createDbClient();

    const targetPhases = params.phases ?? [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
    ];

    // シナリオ付きセッションを取得（シナリオINNER JOINの代替）
    let query = supabase
      .from('game_sessions')
      .select(
        `
        game_session_id, session_name, session_phase, scenario_id, created_at,
        scenario:scenarios!inner(
          scenario_id, name, max_player, min_playtime, max_playtime,
          scenario_system_id,
          system:scenario_systems!inner(name)
        ),
        schedule:game_schedules(schedule_date, schedule_phase)
      `,
        { count: 'exact' },
      )
      .in('session_phase', targetPhases);

    // システムIDフィルタ
    if (!isNil(params.systemIds) && params.systemIds.length > 0) {
      query = query.in(
        'scenario.scenario_system_id' as string,
        params.systemIds,
      );
    }

    // シナリオ名検索
    if (!isNil(params.scenarioName) && params.scenarioName.trim() !== '') {
      query = query.ilike(
        'scenario.name' as string,
        `%${params.scenarioName}%`,
      );
    }

    // ソート
    switch (sort) {
      case 'date_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'created_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'slots_desc':
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data: result, error, count } = await query;

    if (error) {
      return err(new Error(error.message));
    }

    const totalCount = count ?? 0;

    // 各セッションのKeeperと参加者数を取得
    const sessionIds = (result ?? []).map((s) => s.game_session_id);

    // Keeper情報を一括取得
    const { data: keepers } = await supabase
      .from('session_participants')
      .select('session_id, user_id, user:users(nickname)')
      .in('session_id', sessionIds)
      .eq('participant_type', ParticipantTypes.KEEPER.value);

    const keeperMap = new Map(
      (keepers ?? []).map((k) => [
        k.session_id,
        {
          keeperName: (k.user as Record<string, unknown>)?.nickname as
            | string
            | null,
          keeperUserId: k.user_id,
        },
      ]),
    );

    // 参加者数を一括取得
    const { data: participants } = await supabase
      .from('session_participants')
      .select('session_id')
      .in('session_id', sessionIds);

    const countMap = new Map<string, number>();
    for (const p of participants ?? []) {
      countMap.set(p.session_id, (countMap.get(p.session_id) ?? 0) + 1);
    }

    const sessions: PublicSession[] = (result ?? []).map((session) => {
      const scenario = session.scenario as Record<string, unknown>;
      const system = (scenario?.system ?? {}) as Record<string, unknown>;
      const schedule = session.schedule as Record<string, unknown> | null;
      const keeper = keeperMap.get(session.game_session_id);

      return {
        gameSessionId: session.game_session_id,
        sessionName: session.session_name,
        sessionPhase: session.session_phase,
        scenarioId: session.scenario_id ?? '',
        scenarioName: (scenario?.name as string) ?? '',
        systemName: (system?.name as string) ?? '',
        scheduleDate: (schedule?.schedule_date as string) ?? null,
        schedulePhase: (schedule?.schedule_phase as string) ?? null,
        keeperName: keeper?.keeperName ?? null,
        keeperUserId: keeper?.keeperUserId ?? null,
        participantCount: countMap.get(session.game_session_id) ?? 0,
        maxPlayer: (scenario?.max_player as number) ?? null,
        minPlaytime: (scenario?.min_playtime as number) ?? null,
        maxPlaytime: (scenario?.max_playtime as number) ?? null,
        createdAt: session.created_at,
      };
    });

    return ok({ sessions, totalCount });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加予定セッションを取得
 */
export const getUpcomingSessions = async (
  userId: string,
  sort: UpcomingSortOption = 'date_asc',
  limit = 20,
  offset = 0,
): Promise<Result<SearchResult<MySessionWithRole>>> => {
  try {
    const supabase = await createDbClient();

    const targetPhases = [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
      SessionPhases.IN_PROGRESS.value,
    ];

    // ユーザーが参加しているセッションIDを取得
    const { data: userSessions } = await supabase
      .from('session_participants')
      .select('session_id, participant_type')
      .eq('user_id', userId);

    if (!userSessions || userSessions.length === 0) {
      return ok({ sessions: [], totalCount: 0 });
    }

    const sessionIds = userSessions.map((s) => s.session_id);
    const roleMap = new Map(
      userSessions.map((s) => [s.session_id, s.participant_type]),
    );

    // 件数取得
    const { count } = await supabase
      .from('game_sessions')
      .select('game_session_id', { count: 'exact', head: true })
      .in('game_session_id', sessionIds)
      .in('session_phase', targetPhases);

    const totalCount = count ?? 0;

    // セッション取得
    let query = supabase
      .from('game_sessions')
      .select(`
        *,
        scenario:scenarios(
          *,
          system:scenario_systems(*)
        ),
        schedule:game_schedules(*),
        participants:session_participants(
          *,
          user:users(*)
        )
      `)
      .in('game_session_id', sessionIds)
      .in('session_phase', targetPhases);

    if (sort === 'date_asc') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: result, error } = await query;

    if (error) {
      return err(new Error(error.message));
    }

    const sessions: MySessionWithRole[] = (result ?? []).map((session) => {
      const s = camelCaseKeys(session as Record<string, unknown>);
      return {
        ...s,
        myRole: roleMap.get(session.game_session_id) as
          | 'KEEPER'
          | 'PLAYER'
          | 'SPECTATOR',
      } as MySessionWithRole;
    });

    return ok({ sessions, totalCount });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加履歴セッションを取得
 */
export const getHistorySessions = async (
  userId: string,
  roles: RoleFilterValue[] = [],
  statuses: StatusFilterValue[] = [],
  systemIds: string[] = [],
  sort: HistorySortOption = 'date_desc',
  limit = 20,
  offset = 0,
): Promise<Result<SearchResult<MySessionWithRole>>> => {
  try {
    const supabase = await createDbClient();

    const targetPhases =
      statuses.length === 0
        ? [SessionPhases.COMPLETED.value, SessionPhases.CANCELLED.value]
        : statuses.map((s) =>
            s === 'completed'
              ? SessionPhases.COMPLETED.value
              : SessionPhases.CANCELLED.value,
          );

    // ユーザーが参加しているセッション取得（役割フィルタ付き）
    let participantQuery = supabase
      .from('session_participants')
      .select('session_id, participant_type')
      .eq('user_id', userId);

    if (roles.length > 0) {
      const roleValues = roles.map((r) =>
        r === 'keeper'
          ? ParticipantTypes.KEEPER.value
          : r === 'player'
            ? ParticipantTypes.PLAYER.value
            : ParticipantTypes.SPECTATOR.value,
      );
      participantQuery = participantQuery.in('participant_type', roleValues);
    }

    const { data: userSessions } = await participantQuery;

    if (!userSessions || userSessions.length === 0) {
      return ok({ sessions: [], totalCount: 0 });
    }

    let sessionIds = userSessions.map((s) => s.session_id);
    const roleMap = new Map(
      userSessions.map((s) => [s.session_id, s.participant_type]),
    );

    // システムIDフィルタ
    if (systemIds.length > 0) {
      const { data: scenariosWithSystems } = await supabase
        .from('scenarios')
        .select('scenario_id')
        .in('scenario_system_id', systemIds);

      const scenarioIdSet = new Set(
        (scenariosWithSystems ?? []).map((s) => s.scenario_id),
      );

      const { data: sessionsWithScenarios } = await supabase
        .from('game_sessions')
        .select('game_session_id, scenario_id')
        .in('game_session_id', sessionIds);

      sessionIds = (sessionsWithScenarios ?? [])
        .filter((s) => s.scenario_id && scenarioIdSet.has(s.scenario_id))
        .map((s) => s.game_session_id);

      if (sessionIds.length === 0) {
        return ok({ sessions: [], totalCount: 0 });
      }
    }

    // 件数取得
    const { count } = await supabase
      .from('game_sessions')
      .select('game_session_id', { count: 'exact', head: true })
      .in('game_session_id', sessionIds)
      .in('session_phase', targetPhases);

    const totalCount = count ?? 0;

    // セッション取得
    let query = supabase
      .from('game_sessions')
      .select(`
        *,
        scenario:scenarios(
          *,
          system:scenario_systems(*)
        ),
        schedule:game_schedules(*),
        participants:session_participants(
          *,
          user:users(*)
        )
      `)
      .in('game_session_id', sessionIds)
      .in('session_phase', targetPhases);

    if (sort === 'date_desc') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: result, error } = await query;

    if (error) {
      return err(new Error(error.message));
    }

    // レビュー済み・動画あり情報を追加
    const gameSessionIds = (result ?? []).map((s) => s.game_session_id);
    const scenarioIds = (result ?? [])
      .map((s) => s.scenario_id)
      .filter((id): id is string => !isNil(id));

    // レビュー情報を一括取得
    const { data: reviewData } = await supabase
      .from('user_reviews')
      .select('scenario_id')
      .eq('user_id', userId)
      .in('scenario_id', scenarioIds.length > 0 ? scenarioIds : ['__none__']);

    const reviewedScenarioIds = new Set(
      (reviewData ?? []).map((r) => r.scenario_id),
    );

    // 動画リンク情報を一括取得
    const { data: videoData } = await supabase
      .from('video_links')
      .select('session_id')
      .in(
        'session_id',
        gameSessionIds.length > 0 ? gameSessionIds : ['__none__'],
      );

    const sessionsWithVideo = new Set(
      (videoData ?? []).map((v) => v.session_id),
    );

    const sessions: MySessionWithRole[] = (result ?? []).map((session) => {
      const s = camelCaseKeys(session as Record<string, unknown>);
      return {
        ...s,
        myRole: roleMap.get(session.game_session_id) as
          | 'KEEPER'
          | 'PLAYER'
          | 'SPECTATOR',
        isReviewed: session.scenario_id
          ? reviewedScenarioIds.has(session.scenario_id)
          : false,
        hasVideo: sessionsWithVideo.has(session.game_session_id),
      } as MySessionWithRole;
    });

    return ok({ sessions, totalCount });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * カレンダー用セッションデータを取得
 */
export const getCalendarSessions = async (
  userId: string,
  year: number,
  month: number,
): Promise<Result<CalendarData>> => {
  try {
    const supabase = await createDbClient();

    const targetPhases = [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
      SessionPhases.IN_PROGRESS.value,
    ];

    // ユーザーが参加しているセッションを取得
    const { data: userSessions } = await supabase
      .from('session_participants')
      .select('session_id, participant_type')
      .eq('user_id', userId);

    if (!userSessions || userSessions.length === 0) {
      return ok({ sessions: [], unscheduledSessions: [] });
    }

    const sessionIds = userSessions.map((s) => s.session_id);
    const roleMap = new Map(
      userSessions.map((s) => [s.session_id, s.participant_type]),
    );

    // 月の開始日と終了日
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    // スケジュール確定済みセッション
    const { data: scheduledSessions } = await supabase
      .from('game_sessions')
      .select(`
        game_session_id, session_name, session_phase,
        scenario:scenarios!inner(name),
        schedule:game_schedules!inner(schedule_date)
      `)
      .in('game_session_id', sessionIds)
      .in('session_phase', targetPhases)
      .gte('game_schedules.schedule_date', startDate)
      .lte('game_schedules.schedule_date', endDate);

    // 日程未確定セッション
    const { data: allSessionsForPhase } = await supabase
      .from('game_sessions')
      .select(`
        game_session_id, session_name, session_phase,
        scenario:scenarios!inner(name),
        schedule:game_schedules(schedule_date)
      `)
      .in('game_session_id', sessionIds)
      .in('session_phase', targetPhases);

    const unscheduledResult = (allSessionsForPhase ?? []).filter((s) =>
      isNil(s.schedule),
    );

    return ok({
      sessions: (scheduledSessions ?? []).map((s) => ({
        gameSessionId: s.game_session_id,
        sessionName: s.session_name,
        sessionPhase: s.session_phase,
        scenarioName: (s.scenario as Record<string, unknown>)?.name as string,
        scheduleDate: (s.schedule as Record<string, unknown>)
          ?.schedule_date as string,
        myRole: roleMap.get(s.game_session_id) as
          | 'KEEPER'
          | 'PLAYER'
          | 'SPECTATOR',
      })),
      unscheduledSessions: unscheduledResult.map((s) => ({
        gameSessionId: s.game_session_id,
        sessionName: s.session_name,
        sessionPhase: s.session_phase,
        scenarioName: (s.scenario as Record<string, unknown>)?.name as string,
        scheduleDate: new Date().toISOString(),
        myRole: roleMap.get(s.game_session_id) as
          | 'KEEPER'
          | 'PLAYER'
          | 'SPECTATOR',
      })),
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 全システムを取得
 */
export const getAllSystems = async (): Promise<Result<ScenarioSystem[]>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('scenario_systems')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as ScenarioSystem,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
