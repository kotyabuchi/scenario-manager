import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';

type FeedbackCategory = Database['public']['Enums']['feedback_category'];
type FeedbackStatus = Database['public']['Enums']['feedback_status'];

import type {
  CommentWithUser,
  FeedbackDetail,
  FeedbackSearchParams,
  FeedbackSearchResult,
  FeedbackSortOption,
  FeedbackWithUser,
} from './interface';

// --- 型安全マッピング関数 ---
// Supabase join クエリの結果は正確な型が付くが、camelCaseKeys 変換後の
// キー名変換を TypeScript が追跡できないため、アプリケーション型
// （FeedbackWithUser 等）への変換に as unknown as キャストを使用している。
// トレードオフ: 型安全性は犠牲になるが、各マッピング関数が変換の境界を
// 1箇所に集約しており、フィールド追加時の修正箇所が明確になっている。

/** Supabase行をキャメルケースに変換しFeedbackWithUserとして返す */
const toFeedbackWithUser = <T extends Record<string, unknown>>(
  row: T,
  hasVoted: boolean,
): FeedbackWithUser => {
  const camel = camelCaseKeys(row) as Record<string, unknown>;
  return {
    ...camel,
    commentCount: Number(camel.commentCount) || 0,
    hasVoted,
  } as unknown as FeedbackWithUser;
};

/** Supabase行をキャメルケースに変換しCommentWithUserとして返す */
const toCommentWithUser = <T extends Record<string, unknown>>(
  row: T,
): CommentWithUser => camelCaseKeys(row) as unknown as CommentWithUser;

/** Supabase行をキャメルケースに変換しFeedbackDetailとして返す */
const toFeedbackDetail = <T extends Record<string, unknown>>(
  row: T,
  comments: CommentWithUser[],
  hasVoted: boolean,
  mergedCount: number,
): FeedbackDetail => {
  const camel = camelCaseKeys(row) as Record<string, unknown>;
  return {
    ...camel,
    comments,
    hasVoted,
    mergedCount,
  } as unknown as FeedbackDetail;
};

/**
 * フィードバックを検索する
 */
export const searchFeedbacks = async (
  params: FeedbackSearchParams,
  sort: FeedbackSortOption = 'votes',
  limit = 20,
  offset = 0,
  userId?: string,
): Promise<Result<FeedbackSearchResult>> => {
  try {
    const supabase = await createDbClient();

    let query = supabase
      .from('feedbacks')
      .select(
        '*, user:users!feedbacks_user_id_fkey(user_id, nickname, image)',
        { count: 'exact' },
      );

    // カテゴリフィルタ
    if (!isNil(params.category) && params.category !== '') {
      query = query.eq('category', params.category as FeedbackCategory);
    }

    // ステータスフィルタ
    if (!isNil(params.statuses) && params.statuses.length > 0) {
      query = query.in('status', params.statuses as FeedbackStatus[]);
    }

    // テキスト検索（タイトル OR 説明）
    if (!isNil(params.q) && params.q.trim() !== '') {
      // ilike のワイルドカード文字 + PostgREST構文文字をエスケープ
      const escaped = params.q
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/"/g, '\\"');
      // ダブルクォートで囲み、カンマ・ピリオドをリテラル扱いにする
      query = query.or(
        `title.ilike."%${escaped}%",description.ilike."%${escaped}%"`,
      );
    }

    // 自分の投稿のみ
    if (params.mine && !isNil(params.userId)) {
      query = query.eq('user_id', params.userId);
    }

    // ソート
    switch (sort) {
      case 'votes':
        query = query.order('vote_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'comments':
        query = query.order('comment_count', { ascending: false });
        break;
    }
    query = query
      .order('feedback_id', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(new Error(error.message));
    }

    // 投票済みフラグを一括取得
    let votedIds = new Set<string>();
    if (!isNil(userId) && data && data.length > 0) {
      const feedbackIds = data.map((f) => f.feedback_id);
      const { data: votes } = await supabase
        .from('feedback_votes')
        .select('feedback_id')
        .eq('user_id', userId)
        .in('feedback_id', feedbackIds);

      if (votes) {
        votedIds = new Set(votes.map((v) => v.feedback_id));
      }
    }

    const feedbacks: FeedbackWithUser[] = (data ?? []).map((row) =>
      toFeedbackWithUser(row, votedIds.has(row.feedback_id)),
    );

    return ok({
      feedbacks,
      totalCount: count ?? 0,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * フィードバックをIDで取得する
 */
export const getFeedbackById = async (
  id: string,
  userId?: string,
): Promise<Result<FeedbackDetail | null>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('feedbacks')
      .select('*, user:users!feedbacks_user_id_fkey(user_id, nickname, image)')
      .eq('feedback_id', id)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    if (isNil(data)) {
      return ok(null);
    }

    // コメント・投票済みフラグ・マージ元カウントを並列取得
    const [commentsResult, voteResult, mergedResult] = await Promise.all([
      supabase
        .from('feedback_comments')
        .select(
          '*, user:users!feedback_comments_user_id_fkey(user_id, nickname, image)',
        )
        .eq('feedback_id', id)
        .order('created_at', { ascending: true }),
      !isNil(userId)
        ? supabase
            .from('feedback_votes')
            .select('feedback_id')
            .eq('feedback_id', id)
            .eq('user_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('feedbacks')
        .select('feedback_id', { count: 'exact', head: true })
        .eq('merged_into_id', id),
    ]);

    const commentsData = commentsResult.data;
    const hasVoted = !isNil(voteResult.data);
    const mergedCount = mergedResult.count;

    const comments: CommentWithUser[] = (commentsData ?? []).map((c) =>
      toCommentWithUser(c),
    );

    return ok(toFeedbackDetail(data, comments, hasVoted, mergedCount ?? 0));
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 投票をトグルする
 */
export const toggleFeedbackVote = async (
  feedbackId: string,
  userId: string,
): Promise<Result<boolean>> => {
  try {
    const supabase = await createDbClient();

    // 既存の投票を確認
    const { data: existing } = await supabase
      .from('feedback_votes')
      .select('feedback_id')
      .eq('feedback_id', feedbackId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!isNil(existing)) {
      // 投票取り消し
      const { error } = await supabase
        .from('feedback_votes')
        .delete()
        .eq('feedback_id', feedbackId)
        .eq('user_id', userId);

      if (error) {
        return err(new Error(error.message));
      }
      return ok(false);
    }

    // 投票追加
    const { error } = await supabase.from('feedback_votes').insert({
      feedback_id: feedbackId,
      user_id: userId,
    });

    if (error) {
      return err(new Error(error.message));
    }
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('投票の処理に失敗しました'));
  }
};

/**
 * コメントを作成する
 */
export const createFeedbackComment = async (
  feedbackId: string,
  userId: string,
  content: string,
  isOfficial: boolean,
): Promise<Result<{ commentId: string }>> => {
  try {
    const supabase = await createDbClient();
    const commentId = ulid();

    const { error } = await supabase.from('feedback_comments').insert({
      comment_id: commentId,
      feedback_id: feedbackId,
      user_id: userId,
      content,
      is_official: isOfficial,
    });

    if (error) {
      return err(new Error(error.message));
    }

    return ok({ commentId });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('コメントの作成に失敗しました'),
    );
  }
};

/**
 * ステータスを更新する
 */
export const updateFeedbackStatus = async (
  feedbackId: string,
  status: string,
  priority?: string,
  adminNote?: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const updateData: Database['public']['Tables']['feedbacks']['Update'] = {
      status: status as FeedbackStatus,
    };
    if (!isNil(priority)) {
      updateData.priority =
        priority as Database['public']['Enums']['feedback_priority'];
    }
    if (!isNil(adminNote)) {
      updateData.admin_note = adminNote;
    }
    // DONE の場合は resolved_at を設定
    if (status === 'DONE') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('feedbacks')
      .update(updateData)
      .eq('feedback_id', feedbackId);

    if (error) {
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('ステータスの更新に失敗しました'),
    );
  }
};

/**
 * フィードバックを削除する（投稿者本人 & ステータス NEW のみ）
 */
export const deleteFeedback = async (
  feedbackId: string,
  userId: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    // 投稿者本人 & ステータス NEW のみ削除可能
    const { data: feedback } = await supabase
      .from('feedbacks')
      .select('user_id, status')
      .eq('feedback_id', feedbackId)
      .maybeSingle();

    if (isNil(feedback))
      return err(new Error('フィードバックが見つかりません'));
    if (feedback.user_id !== userId)
      return err(new Error('削除権限がありません'));
    if (feedback.status !== 'NEW')
      return err(new Error('受付中のフィードバックのみ削除できます'));

    // ON DELETE CASCADE により関連データ（投票・コメント）は自動削除される
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('feedback_id', feedbackId);

    if (error) return err(new Error(error.message));
    return ok(undefined);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('フィードバックの削除に失敗しました'),
    );
  }
};

/**
 * フィードバックを更新する（投稿者本人 & ステータス NEW/TRIAGED のみ）
 */
export const updateFeedback = async (
  feedbackId: string,
  userId: string,
  data: { category: string; title: string; description: string },
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    // 投稿者本人 & ステータス NEW/TRIAGED のみ編集可能
    const { data: feedback } = await supabase
      .from('feedbacks')
      .select('user_id, status')
      .eq('feedback_id', feedbackId)
      .maybeSingle();

    if (isNil(feedback))
      return err(new Error('フィードバックが見つかりません'));
    if (feedback.user_id !== userId)
      return err(new Error('編集権限がありません'));
    if (feedback.status !== 'NEW' && feedback.status !== 'TRIAGED')
      return err(
        new Error('受付中または検討中のフィードバックのみ編集できます'),
      );

    // TRIAGED で編集した場合は NEW にリセット
    const newStatus = feedback.status === 'TRIAGED' ? 'NEW' : feedback.status;

    const { error } = await supabase
      .from('feedbacks')
      .update({
        category: data.category as FeedbackCategory,
        title: data.title,
        description: data.description,
        status: newStatus as FeedbackStatus,
      })
      .eq('feedback_id', feedbackId);

    if (error) return err(new Error(error.message));
    return ok(undefined);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('フィードバックの更新に失敗しました'),
    );
  }
};

/**
 * フィードバック投稿のレート制限チェック（DB方式: 1日10件）
 */
export const checkFeedbackRateLimit = async (
  userId: string,
): Promise<Result<{ isLimited: boolean; remaining: number }>> => {
  try {
    const supabase = await createDbClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('feedbacks')
      .select('feedback_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo);

    if (error) {
      return err(new Error(error.message));
    }

    const used = count ?? 0;
    const maxPerDay = 10;

    return ok({
      isLimited: used >= maxPerDay,
      remaining: Math.max(0, maxPerDay - used),
    });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('レート制限の確認に失敗しました'),
    );
  }
};

/**
 * コメント投稿のレート制限チェック（DB方式: 1時間20件）
 */
export const checkCommentRateLimit = async (
  userId: string,
): Promise<Result<{ isLimited: boolean; remaining: number }>> => {
  try {
    const supabase = await createDbClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('feedback_comments')
      .select('comment_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if (error) {
      return err(new Error(error.message));
    }

    const used = count ?? 0;
    const maxPerHour = 20;

    return ok({
      isLimited: used >= maxPerHour,
      remaining: Math.max(0, maxPerHour - used),
    });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('レート制限の確認に失敗しました'),
    );
  }
};
