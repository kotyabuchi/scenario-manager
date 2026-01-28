import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type {
  ReviewSortOption,
  ReviewWithUser,
  ScenarioDetail,
  SessionWithKeeper,
  UserPreference,
  UserReview,
  VideoLinkWithSession,
} from './interface';
import type { CreateReviewInput, UpdateReviewInput } from './schema';

/**
 * シナリオ詳細を取得する
 */
export const getScenarioDetail = async (
  id: string,
): Promise<Result<ScenarioDetail | null>> => {
  try {
    const supabase = await createDbClient();

    // シナリオ基本情報取得
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .select(
        '*, system:scenario_systems(*), scenarioTags:scenario_tags(tag:tags(*))',
      )
      .eq('scenario_id', id)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    if (isNil(scenario)) {
      return ok(null);
    }

    // 評価情報を集計（RPCの代わりにクライアントサイドで計算）
    const { data: reviews } = await supabase
      .from('user_reviews')
      .select('rating')
      .eq('scenario_id', id);

    const reviewCount = reviews?.length ?? 0;
    const avgRating =
      reviewCount > 0
        ? (reviews ?? []).reduce((sum, r) => sum + (r.rating ?? 0), 0) /
          reviewCount
        : null;

    const s = camelCaseKeys(scenario as Record<string, unknown>);

    // タグをフラット化
    const scenarioTags = ((s as Record<string, unknown>).scenarioTags ??
      []) as Array<{
      tag: Record<string, unknown>;
    }>;
    const flatTags = scenarioTags.map((st) => st.tag);

    return ok({
      ...s,
      tags: flatTags,
      avgRating,
      reviewCount,
    } as ScenarioDetail);
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
    const supabase = await createDbClient();

    // 件数取得
    const { count } = await supabase
      .from('user_reviews')
      .select('user_review_id', { count: 'exact', head: true })
      .eq('scenario_id', scenarioId);

    const totalCount = count ?? 0;

    // ソート順
    const orderColumn =
      sort === 'rating_high' || sort === 'rating_low' ? 'rating' : 'created_at';
    const ascending = sort === 'rating_low';

    // レビュー取得（ユーザー情報JOIN）
    const { data, error } = await supabase
      .from('user_reviews')
      .select('*, user:users(user_id, nickname, user_name, image)')
      .eq('scenario_id', scenarioId)
      .order(orderColumn, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      return err(new Error(error.message));
    }

    return ok({
      reviews: (data ?? []).map(
        (r) => camelCaseKeys(r as Record<string, unknown>) as ReviewWithUser,
      ),
      totalCount,
    });
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
    const supabase = await createDbClient();

    // 完了済みセッションを取得（スケジュール情報付き）
    const { data: sessionsData, error } = await supabase
      .from('game_sessions')
      .select(`
        game_session_id, session_name, scenario_id, session_phase,
        created_at, updated_at,
        schedule:game_schedules(schedule_date)
      `)
      .eq('scenario_id', scenarioId)
      .eq('session_phase', 'COMPLETED')
      .limit(limit);

    if (error) {
      return err(new Error(error.message));
    }

    if (!sessionsData || sessionsData.length === 0) {
      return ok([]);
    }

    const sessionIds = sessionsData.map((s) => s.game_session_id);

    // GMを取得
    const { data: keepers } = await supabase
      .from('session_participants')
      .select('session_id, user:users(user_id, nickname, image)')
      .in('session_id', sessionIds)
      .eq('participant_type', 'KEEPER');

    const keeperMap = new Map(
      (keepers ?? []).map((k) => [
        k.session_id,
        k.user
          ? {
              userId: (k.user as Record<string, unknown>).user_id as string,
              nickname:
                ((k.user as Record<string, unknown>).nickname as string) ?? '',
              image: (k.user as Record<string, unknown>).image as string | null,
            }
          : null,
      ]),
    );

    // 参加者数を取得
    const { data: participantCounts } = await supabase
      .from('session_participants')
      .select('session_id')
      .in('session_id', sessionIds);

    const countMap = new Map<string, number>();
    for (const p of participantCounts ?? []) {
      countMap.set(p.session_id, (countMap.get(p.session_id) ?? 0) + 1);
    }

    // 結果を整形
    const sessions: SessionWithKeeper[] = sessionsData.map((s) => ({
      gameSessionId: s.game_session_id,
      sessionName: s.session_name,
      scenarioId: s.scenario_id,
      sessionPhase: s.session_phase,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      keeper: keeperMap.get(s.game_session_id) ?? null,
      participantCount: countMap.get(s.game_session_id) ?? 0,
      scheduleDate:
        ((s.schedule as Record<string, unknown> | null)?.schedule_date as
          | string
          | null) ?? null,
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
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('video_links')
      .select(
        '*, session:game_sessions(game_session_id), user:users(user_id, nickname)',
      )
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map(
        (v) =>
          camelCaseKeys(v as Record<string, unknown>) as VideoLinkWithSession,
      ),
    );
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
    const supabase = await createDbClient();

    const { data: preference, error } = await supabase
      .from('user_scenario_preferences')
      .select('is_like, is_played, is_watched, can_keeper, had_scenario')
      .eq('scenario_id', scenarioId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    if (isNil(preference)) {
      return ok(null);
    }

    return ok({
      isLike: preference.is_like,
      isPlayed: preference.is_played,
      isWatched: preference.is_watched,
      canKeeper: preference.can_keeper,
      hadScenario: preference.had_scenario,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * Discord IDでユーザーを取得する
 */
export const getUserByDiscordId = async (
  discordId: string,
): Promise<Result<{ userId: string } | null>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    return ok(data ? { userId: data.user_id } : null);
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
    const supabase = await createDbClient();

    const { data: existing } = await supabase
      .from('user_scenario_preferences')
      .select('is_like')
      .eq('scenario_id', scenarioId)
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(existing)) {
      // 新規作成（お気に入りのみtrue）
      await supabase.from('user_scenario_preferences').insert({
        scenario_id: scenarioId,
        user_id: userId,
        is_like: true,
        is_played: false,
        is_watched: false,
        can_keeper: false,
        had_scenario: false,
      });
      return ok(true);
    }

    // トグル
    const newValue = !existing.is_like;
    await supabase
      .from('user_scenario_preferences')
      .update({ is_like: newValue })
      .eq('scenario_id', scenarioId)
      .eq('user_id', userId);

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
    const supabase = await createDbClient();

    const { data: existing } = await supabase
      .from('user_scenario_preferences')
      .select('is_played')
      .eq('scenario_id', scenarioId)
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(existing)) {
      await supabase.from('user_scenario_preferences').insert({
        scenario_id: scenarioId,
        user_id: userId,
        is_like: false,
        is_played: true,
        is_watched: false,
        can_keeper: false,
        had_scenario: false,
      });
      return ok(true);
    }

    const newValue = !existing.is_played;
    await supabase
      .from('user_scenario_preferences')
      .update({ is_played: newValue })
      .eq('scenario_id', scenarioId)
      .eq('user_id', userId);

    return ok(newValue);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * レビューを作成する
 */
export const createReview = async (
  input: CreateReviewInput,
  userId: string,
): Promise<Result<{ userReviewId: string }>> => {
  try {
    const supabase = await createDbClient();
    const userReviewId = ulid();

    const { error } = await supabase.from('user_reviews').insert({
      user_review_id: userReviewId,
      user_id: userId,
      scenario_id: input.scenarioId,
      session_id: input.sessionId ?? null,
      rating: input.rating ?? null,
      open_comment: input.openComment ?? null,
      spoiler_comment: input.spoilerComment ?? null,
    });

    if (error) {
      return err(new Error('Failed to create review'));
    }

    return ok({ userReviewId });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * レビューを更新する
 */
export const updateReview = async (
  reviewId: string,
  input: UpdateReviewInput,
  userId: string,
): Promise<Result<UserReview | null>> => {
  try {
    const supabase = await createDbClient();

    const { data: updated, error } = await supabase
      .from('user_reviews')
      .update({
        rating: input.rating ?? null,
        open_comment: input.openComment ?? null,
        spoiler_comment: input.spoilerComment ?? null,
      })
      .eq('user_review_id', reviewId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    if (isNil(updated)) {
      return ok(null);
    }

    return ok(camelCaseKeys(updated as Record<string, unknown>) as UserReview);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * レビューを削除する
 */
export const deleteReview = async (
  reviewId: string,
  userId: string,
): Promise<Result<boolean>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('user_reviews')
      .delete()
      .eq('user_review_id', reviewId)
      .eq('user_id', userId)
      .select('user_review_id');

    if (error) {
      return err(new Error(error.message));
    }

    return ok((data ?? []).length > 0);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
