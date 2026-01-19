import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';
import { isNil } from 'ramda';

import { db } from '@/db';
import { ParticipantTypes, SessionPhases } from '@/db/enum';
import {
  gameSchedules,
  gameSessions,
  scenarioSystems,
  scenarios,
  sessionParticipants,
  userReviews,
  users,
  videoLinks,
} from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
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

    // DiscordのユーザーIDからDBのユーザーIDを取得
    const dbUser = await db.query.users.findFirst({
      where: eq(users.discordId, user.id),
      columns: { userId: true },
    });

    return dbUser?.userId ?? null;
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
    // 公開セッション用のフェーズ（デフォルト: 募集中・準備中）
    const targetPhases = params.phases ?? [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
    ];

    const conditions = [inArray(gameSessions.sessionPhase, targetPhases)];

    // システムIDでフィルタ
    if (!isNil(params.systemIds) && params.systemIds.length > 0) {
      const scenariosWithSystems = db
        .select({ scenarioId: scenarios.scenarioId })
        .from(scenarios)
        .where(inArray(scenarios.scenarioSystemId, params.systemIds));
      conditions.push(inArray(gameSessions.scenarioId, scenariosWithSystems));
    }

    // シナリオ名で部分一致検索
    if (!isNil(params.scenarioName) && params.scenarioName.trim() !== '') {
      const matchingScenarios = db
        .select({ scenarioId: scenarios.scenarioId })
        .from(scenarios)
        .where(ilike(scenarios.name, `%${params.scenarioName}%`));
      conditions.push(inArray(gameSessions.scenarioId, matchingScenarios));
    }

    // 日付範囲でフィルタ
    const dateConditions = [];
    if (!isNil(params.dateFrom)) {
      dateConditions.push(gte(gameSchedules.scheduleDate, params.dateFrom));
    }
    if (!isNil(params.dateTo)) {
      dateConditions.push(lte(gameSchedules.scheduleDate, params.dateTo));
    }

    // ソート順の決定
    const orderBy = (() => {
      switch (sort) {
        case 'date_asc':
          return asc(gameSchedules.scheduleDate);
        case 'created_desc':
          return desc(gameSessions.createdAt);
        case 'slots_desc':
          // 残り枠順（空き枠が多い順）: 後で計算する必要があるため一旦作成日降順
          return desc(gameSessions.createdAt);
        default:
          return asc(gameSchedules.scheduleDate);
      }
    })();

    // 件数取得（日付条件なし）
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(gameSessions)
      .where(and(...conditions));

    const totalCount = Number(countResult[0]?.count ?? 0);

    // セッション取得（LEFT JOINでスケジュールとシナリオ情報を取得）
    const result = await db
      .select({
        gameSessionId: gameSessions.gameSessionId,
        sessionName: gameSessions.sessionName,
        sessionPhase: gameSessions.sessionPhase,
        scenarioId: gameSessions.scenarioId,
        scenarioName: scenarios.name,
        systemName: scenarioSystems.name,
        scheduleDate: gameSchedules.scheduleDate,
        schedulePhase: gameSchedules.schedulePhase,
        maxPlayer: scenarios.maxPlayer,
        minPlaytime: scenarios.minPlaytime,
        maxPlaytime: scenarios.maxPlaytime,
        createdAt: gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(scenarios, eq(gameSessions.scenarioId, scenarios.scenarioId))
      .innerJoin(
        scenarioSystems,
        eq(scenarios.scenarioSystemId, scenarioSystems.systemId),
      )
      .leftJoin(
        gameSchedules,
        eq(gameSessions.gameSessionId, gameSchedules.sessionId),
      )
      .where(
        dateConditions.length > 0
          ? and(...conditions, ...dateConditions)
          : and(...conditions),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // 各セッションのKeeperと参加者数を取得
    const sessionsWithDetails = await Promise.all(
      result.map(async (session) => {
        // Keeper情報取得
        const keeper = await db.query.sessionParticipants.findFirst({
          where: and(
            eq(sessionParticipants.sessionId, session.gameSessionId),
            eq(
              sessionParticipants.participantType,
              ParticipantTypes.KEEPER.value,
            ),
          ),
          with: { user: true },
        });

        // 参加者数取得
        const participantCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(sessionParticipants)
          .where(eq(sessionParticipants.sessionId, session.gameSessionId));

        return {
          ...session,
          keeperName: keeper?.user?.nickname ?? null,
          keeperUserId: keeper?.userId ?? null,
          participantCount: Number(participantCountResult[0]?.count ?? 0),
        } as PublicSession;
      }),
    );

    return ok({
      sessions: sessionsWithDetails,
      totalCount,
    });
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
    // 参加予定のフェーズ
    const targetPhases = [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
      SessionPhases.IN_PROGRESS.value,
    ];

    // ユーザーが参加しているセッションIDを取得
    const userSessions = await db
      .select({
        sessionId: sessionParticipants.sessionId,
        participantType: sessionParticipants.participantType,
      })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.userId, userId));

    if (userSessions.length === 0) {
      return ok({ sessions: [], totalCount: 0 });
    }

    const sessionIds = userSessions.map((s) => s.sessionId);
    const roleMap = new Map(
      userSessions.map((s) => [s.sessionId, s.participantType]),
    );

    // ソート順の決定
    const orderBy =
      sort === 'date_asc'
        ? asc(gameSchedules.scheduleDate)
        : desc(gameSessions.createdAt);

    // 件数取得
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(gameSessions)
      .where(
        and(
          inArray(gameSessions.gameSessionId, sessionIds),
          inArray(gameSessions.sessionPhase, targetPhases),
        ),
      );

    const totalCount = Number(countResult[0]?.count ?? 0);

    // セッション取得
    const result = await db.query.gameSessions.findMany({
      where: and(
        inArray(gameSessions.gameSessionId, sessionIds),
        inArray(gameSessions.sessionPhase, targetPhases),
      ),
      with: {
        scenario: {
          with: {
            system: true,
          },
        },
        schedule: true,
        participants: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [orderBy],
      limit,
      offset,
    });

    const sessions: MySessionWithRole[] = result.map((session) => ({
      ...session,
      myRole: roleMap.get(session.gameSessionId) as
        | 'KEEPER'
        | 'PLAYER'
        | 'SPECTATOR',
    }));

    return ok({
      sessions,
      totalCount,
    });
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
    // 履歴のフェーズ（空の場合は全て表示）
    const targetPhases =
      statuses.length === 0
        ? [SessionPhases.COMPLETED.value, SessionPhases.CANCELLED.value]
        : statuses.map((s) =>
            s === 'completed'
              ? SessionPhases.COMPLETED.value
              : SessionPhases.CANCELLED.value,
          );

    // ユーザーが参加しているセッションを取得（役割フィルタ付き）
    const participantConditions = [eq(sessionParticipants.userId, userId)];

    if (roles.length > 0) {
      const roleValues = roles.map((r) =>
        r === 'keeper'
          ? ParticipantTypes.KEEPER.value
          : r === 'player'
            ? ParticipantTypes.PLAYER.value
            : ParticipantTypes.SPECTATOR.value,
      );
      participantConditions.push(
        inArray(sessionParticipants.participantType, roleValues),
      );
    }

    const userSessions = await db
      .select({
        sessionId: sessionParticipants.sessionId,
        participantType: sessionParticipants.participantType,
      })
      .from(sessionParticipants)
      .where(and(...participantConditions));

    if (userSessions.length === 0) {
      return ok({ sessions: [], totalCount: 0 });
    }

    const sessionIds = userSessions.map((s) => s.sessionId);
    const roleMap = new Map(
      userSessions.map((s) => [s.sessionId, s.participantType]),
    );

    // ソート順の決定
    const orderBy =
      sort === 'date_desc'
        ? desc(gameSchedules.scheduleDate)
        : asc(gameSchedules.scheduleDate);

    // システムIDフィルタ用のシナリオIDを取得
    let filteredSessionIds = sessionIds;
    if (systemIds.length > 0) {
      const scenariosWithSystems = await db
        .select({ scenarioId: scenarios.scenarioId })
        .from(scenarios)
        .where(inArray(scenarios.scenarioSystemId, systemIds));
      const scenarioIdSet = new Set(
        scenariosWithSystems.map((s) => s.scenarioId),
      );

      // セッションIDをフィルタ（シナリオIDで絞り込み）
      const sessionsWithScenarios = await db
        .select({
          gameSessionId: gameSessions.gameSessionId,
          scenarioId: gameSessions.scenarioId,
        })
        .from(gameSessions)
        .where(inArray(gameSessions.gameSessionId, sessionIds));

      filteredSessionIds = sessionsWithScenarios
        .filter((s) => scenarioIdSet.has(s.scenarioId))
        .map((s) => s.gameSessionId);

      if (filteredSessionIds.length === 0) {
        return ok({ sessions: [], totalCount: 0 });
      }
    }

    // 件数取得
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(gameSessions)
      .where(
        and(
          inArray(gameSessions.gameSessionId, filteredSessionIds),
          inArray(gameSessions.sessionPhase, targetPhases),
        ),
      );

    const totalCount = Number(countResult[0]?.count ?? 0);

    // セッション取得
    const result = await db.query.gameSessions.findMany({
      where: and(
        inArray(gameSessions.gameSessionId, filteredSessionIds),
        inArray(gameSessions.sessionPhase, targetPhases),
      ),
      with: {
        scenario: {
          with: {
            system: true,
          },
        },
        schedule: true,
        participants: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [orderBy],
      limit,
      offset,
    });

    // レビュー済み・動画あり情報を追加
    const sessionsWithMeta = await Promise.all(
      result.map(async (session) => {
        const review = await db.query.userReviews.findFirst({
          where: and(
            eq(userReviews.userId, userId),
            eq(userReviews.scenarioId, session.scenarioId),
          ),
        });

        const video = await db.query.videoLinks.findFirst({
          where: eq(videoLinks.sessionId, session.gameSessionId),
        });

        return {
          ...session,
          myRole: roleMap.get(session.gameSessionId) as
            | 'KEEPER'
            | 'PLAYER'
            | 'SPECTATOR',
          isReviewed: !isNil(review),
          hasVideo: !isNil(video),
        };
      }),
    );

    return ok({
      sessions: sessionsWithMeta,
      totalCount,
    });
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
    // 参加予定のフェーズ
    const targetPhases = [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
      SessionPhases.IN_PROGRESS.value,
    ];

    // ユーザーが参加しているセッションを取得
    const userSessions = await db
      .select({
        sessionId: sessionParticipants.sessionId,
        participantType: sessionParticipants.participantType,
      })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.userId, userId));

    if (userSessions.length === 0) {
      return ok({ sessions: [], unscheduledSessions: [] });
    }

    const sessionIds = userSessions.map((s) => s.sessionId);
    const roleMap = new Map(
      userSessions.map((s) => [s.sessionId, s.participantType]),
    );

    // 月の開始日と終了日
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // スケジュール確定済みセッション
    const scheduledSessions = await db
      .select({
        gameSessionId: gameSessions.gameSessionId,
        sessionName: gameSessions.sessionName,
        sessionPhase: gameSessions.sessionPhase,
        scenarioName: scenarios.name,
        scheduleDate: gameSchedules.scheduleDate,
      })
      .from(gameSessions)
      .innerJoin(scenarios, eq(gameSessions.scenarioId, scenarios.scenarioId))
      .innerJoin(
        gameSchedules,
        eq(gameSessions.gameSessionId, gameSchedules.sessionId),
      )
      .where(
        and(
          inArray(gameSessions.gameSessionId, sessionIds),
          inArray(gameSessions.sessionPhase, targetPhases),
          gte(gameSchedules.scheduleDate, startDate),
          lte(gameSchedules.scheduleDate, endDate),
        ),
      );

    // 日程未確定セッション
    const unscheduledResult = await db
      .select({
        gameSessionId: gameSessions.gameSessionId,
        sessionName: gameSessions.sessionName,
        sessionPhase: gameSessions.sessionPhase,
        scenarioName: scenarios.name,
      })
      .from(gameSessions)
      .innerJoin(scenarios, eq(gameSessions.scenarioId, scenarios.scenarioId))
      .leftJoin(
        gameSchedules,
        eq(gameSessions.gameSessionId, gameSchedules.sessionId),
      )
      .where(
        and(
          inArray(gameSessions.gameSessionId, sessionIds),
          inArray(gameSessions.sessionPhase, targetPhases),
          sql`${gameSchedules.sessionId} IS NULL`,
        ),
      );

    return ok({
      sessions: scheduledSessions.map((s) => ({
        ...s,
        scheduleDate: s.scheduleDate,
        myRole: roleMap.get(s.gameSessionId) as
          | 'KEEPER'
          | 'PLAYER'
          | 'SPECTATOR',
      })),
      unscheduledSessions: unscheduledResult.map((s) => ({
        ...s,
        scheduleDate: new Date(), // プレースホルダー
        myRole: roleMap.get(s.gameSessionId) as
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
    const result = await db.query.scenarioSystems.findMany({
      orderBy: [asc(scenarioSystems.name)],
    });
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
