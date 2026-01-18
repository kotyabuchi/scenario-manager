import { and, avg, count, desc, eq, sql } from 'drizzle-orm';
import { isNil } from 'ramda';

import { db } from '@/db';
import {
  gameSchedules,
  gameSessions,
  scenarios,
  sessionParticipants,
  userReviews,
  userScenarioPreferences,
  users,
  videoLinks,
} from '@/db/schema';
import { err, ok, type Result } from '@/types/result';

import type {
  ReviewSortOption,
  ReviewWithUser,
  ScenarioDetail,
  SessionWithKeeper,
  UserPreference,
  VideoLinkWithSession,
} from './interface';

/**
 * シナリオ詳細を取得する
 */
export const getScenarioDetail = async (
  id: string,
): Promise<Result<ScenarioDetail | null>> => {
  try {
    // シナリオ基本情報取得
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.scenarioId, id),
      with: {
        system: true,
        scenarioTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (isNil(scenario)) {
      return ok(null);
    }

    // 評価情報を集計
    const ratingResult = await db
      .select({
        avgRating: avg(userReviews.rating),
        reviewCount: count(userReviews.userReviewId),
      })
      .from(userReviews)
      .where(eq(userReviews.scenarioId, id));

    const avgRating = ratingResult[0]?.avgRating;
    const reviewCount = Number(ratingResult[0]?.reviewCount ?? 0);

    // タグをフラット化
    const flatTags = scenario.scenarioTags.map((st) => st.tag);

    return ok({
      ...scenario,
      tags: flatTags,
      avgRating: avgRating ? Number(avgRating) : null,
      reviewCount,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * シナリオのレビュー一覧を取得する
 */
export const getScenarioReviews = async (
  scenarioId: string,
  sort: ReviewSortOption = 'newest',
  limit = 10,
  offset = 0,
): Promise<Result<{ reviews: ReviewWithUser[]; totalCount: number }>> => {
  try {
    // ソート順の決定
    const orderBy = (() => {
      switch (sort) {
        case 'newest':
          return desc(userReviews.createdAt);
        case 'rating_high':
          return desc(userReviews.rating);
        case 'rating_low':
          return sql`${userReviews.rating} ASC NULLS LAST`;
        default:
          return desc(userReviews.createdAt);
      }
    })();

    // 件数取得
    const countResult = await db
      .select({ count: count(userReviews.userReviewId) })
      .from(userReviews)
      .where(eq(userReviews.scenarioId, scenarioId));

    const totalCount = Number(countResult[0]?.count ?? 0);

    // レビュー取得
    const reviews = await db
      .select({
        userReviewId: userReviews.userReviewId,
        userId: userReviews.userId,
        scenarioId: userReviews.scenarioId,
        sessionId: userReviews.sessionId,
        openComment: userReviews.openComment,
        spoilerComment: userReviews.spoilerComment,
        rating: userReviews.rating,
        createdAt: userReviews.createdAt,
        updatedAt: userReviews.updatedAt,
        user: {
          userId: users.userId,
          nickname: users.nickname,
          userName: users.userName,
          image: users.image,
        },
      })
      .from(userReviews)
      .innerJoin(users, eq(userReviews.userId, users.userId))
      .where(eq(userReviews.scenarioId, scenarioId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return ok({ reviews: reviews as ReviewWithUser[], totalCount });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * シナリオの関連セッション一覧を取得する（COMPLETEDのみ）
 */
export const getScenarioSessions = async (
  scenarioId: string,
  limit = 10,
): Promise<Result<SessionWithKeeper[]>> => {
  try {
    // 完了済みセッションを取得
    const sessionsData = await db
      .select({
        gameSessionId: gameSessions.gameSessionId,
        scenarioId: gameSessions.scenarioId,
        sessionPhase: gameSessions.sessionPhase,
        keeperId: gameSessions.keeperId,
        createdAt: gameSessions.createdAt,
        updatedAt: gameSessions.updatedAt,
        keeperUserId: users.userId,
        keeperNickname: users.nickname,
        keeperImage: users.image,
        scheduleDate: gameSchedules.scheduleDate,
      })
      .from(gameSessions)
      .leftJoin(users, eq(gameSessions.keeperId, users.userId))
      .leftJoin(
        gameSchedules,
        eq(gameSessions.gameSessionId, gameSchedules.sessionId),
      )
      .where(
        and(
          eq(gameSessions.scenarioId, scenarioId),
          eq(gameSessions.sessionPhase, 'COMPLETED'),
        ),
      )
      .orderBy(desc(gameSchedules.scheduleDate))
      .limit(limit);

    // 参加者数を取得
    const sessionIds = sessionsData.map((s) => s.gameSessionId);
    const participantCounts =
      sessionIds.length > 0
        ? await db
            .select({
              sessionId: sessionParticipants.sessionId,
              count: count(sessionParticipants.userId),
            })
            .from(sessionParticipants)
            .where(
              sql`${sessionParticipants.sessionId} IN (${sql.join(
                sessionIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
            .groupBy(sessionParticipants.sessionId)
        : [];

    const countMap = new Map(
      participantCounts.map((p) => [p.sessionId, Number(p.count)]),
    );

    // 結果を整形
    const sessions: SessionWithKeeper[] = sessionsData.map((s) => ({
      gameSessionId: s.gameSessionId,
      scenarioId: s.scenarioId,
      sessionPhase: s.sessionPhase,
      keeperId: s.keeperId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      keeper: s.keeperUserId
        ? {
            userId: s.keeperUserId,
            nickname: s.keeperNickname ?? '',
            image: s.keeperImage,
          }
        : null,
      participantCount: countMap.get(s.gameSessionId) ?? 0,
      scheduleDate: s.scheduleDate,
    }));

    return ok(sessions);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * シナリオの動画リンク一覧を取得する
 */
export const getScenarioVideoLinks = async (
  scenarioId: string,
  limit = 20,
): Promise<Result<VideoLinkWithSession[]>> => {
  try {
    const videos = await db
      .select({
        videoLinkId: videoLinks.videoLinkId,
        scenarioId: videoLinks.scenarioId,
        sessionId: videoLinks.sessionId,
        videoUrl: videoLinks.videoUrl,
        createdById: videoLinks.createdById,
        createdAt: videoLinks.createdAt,
        updatedAt: videoLinks.updatedAt,
        session: {
          gameSessionId: gameSessions.gameSessionId,
        },
        user: {
          userId: users.userId,
          nickname: users.nickname,
        },
      })
      .from(videoLinks)
      .innerJoin(
        gameSessions,
        eq(videoLinks.sessionId, gameSessions.gameSessionId),
      )
      .innerJoin(users, eq(videoLinks.createdById, users.userId))
      .where(eq(videoLinks.scenarioId, scenarioId))
      .orderBy(desc(videoLinks.createdAt))
      .limit(limit);

    return ok(videos as VideoLinkWithSession[]);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * ユーザーのシナリオ経験情報を取得する
 */
export const getUserScenarioPreference = async (
  scenarioId: string,
  userId: string,
): Promise<Result<UserPreference | null>> => {
  try {
    const preference = await db.query.userScenarioPreferences.findFirst({
      where: and(
        eq(userScenarioPreferences.scenarioId, scenarioId),
        eq(userScenarioPreferences.userId, userId),
      ),
    });

    if (isNil(preference)) {
      return ok(null);
    }

    return ok({
      isLike: preference.isLike,
      isPlayed: preference.isPlayed,
      isWatched: preference.isWatched,
      canKeeper: preference.canKeeper,
      hadScenario: preference.hadScenario,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * お気に入り状態をトグルする
 */
export const toggleFavorite = async (
  scenarioId: string,
  userId: string,
): Promise<Result<boolean>> => {
  try {
    const existing = await db.query.userScenarioPreferences.findFirst({
      where: and(
        eq(userScenarioPreferences.scenarioId, scenarioId),
        eq(userScenarioPreferences.userId, userId),
      ),
    });

    if (isNil(existing)) {
      // 新規作成（お気に入りのみtrue）
      await db.insert(userScenarioPreferences).values({
        scenarioId,
        userId,
        isLike: true,
        isPlayed: false,
        isWatched: false,
        canKeeper: false,
        hadScenario: false,
      });
      return ok(true);
    }

    // トグル
    const newValue = !existing.isLike;
    await db
      .update(userScenarioPreferences)
      .set({ isLike: newValue })
      .where(
        and(
          eq(userScenarioPreferences.scenarioId, scenarioId),
          eq(userScenarioPreferences.userId, userId),
        ),
      );

    return ok(newValue);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * プレイ済み状態をトグルする
 */
export const togglePlayed = async (
  scenarioId: string,
  userId: string,
): Promise<Result<boolean>> => {
  try {
    const existing = await db.query.userScenarioPreferences.findFirst({
      where: and(
        eq(userScenarioPreferences.scenarioId, scenarioId),
        eq(userScenarioPreferences.userId, userId),
      ),
    });

    if (isNil(existing)) {
      // 新規作成
      await db.insert(userScenarioPreferences).values({
        scenarioId,
        userId,
        isLike: false,
        isPlayed: true,
        isWatched: false,
        canKeeper: false,
        hadScenario: false,
      });
      return ok(true);
    }

    // トグル
    const newValue = !existing.isPlayed;
    await db
      .update(userScenarioPreferences)
      .set({ isPlayed: newValue })
      .where(
        and(
          eq(userScenarioPreferences.scenarioId, scenarioId),
          eq(userScenarioPreferences.userId, userId),
        ),
      );

    return ok(newValue);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
