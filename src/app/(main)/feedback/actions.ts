'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import {
  checkCommentRateLimit,
  checkFeedbackRateLimit,
  createFeedbackComment,
  deleteFeedback,
  toggleFeedbackVote,
  updateFeedbackStatus,
} from './adapter';

import {
  extractValues,
  FeedbackPriorities,
  FeedbackStatuses,
  Roles,
} from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { isValidUlid } from '@/lib/validateUlid';
import { err, ok, type Result } from '@/types/result';

const VALID_STATUSES: readonly string[] = extractValues(FeedbackStatuses);
const VALID_PRIORITIES: readonly string[] = extractValues(FeedbackPriorities);

const logger = getAppLogger(['app', 'feedback']);

/** 認証済みユーザーのアプリ内userId + roleを取得 */
const getAuthUser = async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('user_id, role')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  return user;
};

/**
 * 投票をトグルする
 */
export const toggleVoteAction = async (
  feedbackId: string,
): Promise<Result<{ hasVoted: boolean }>> => {
  if (!isValidUlid(feedbackId)) {
    return err(new Error('無効なフィードバックIDです'));
  }

  const user = await getAuthUser();
  if (isNil(user)) {
    return err(new Error('ログインが必要です'));
  }

  const result = await toggleFeedbackVote(feedbackId, user.user_id);

  if (!result.success) {
    logger.error`投票トグル失敗: ${result.error}`;
    return err(result.error);
  }

  revalidatePath('/feedback');
  revalidatePath(`/feedback/${feedbackId}`);
  return ok({ hasVoted: result.data });
};

/**
 * コメントを作成する
 */
export const createCommentAction = async (
  feedbackId: string,
  content: string,
): Promise<Result<{ commentId: string }>> => {
  if (!isValidUlid(feedbackId)) {
    return err(new Error('無効なフィードバックIDです'));
  }

  const user = await getAuthUser();
  if (isNil(user)) {
    return err(new Error('ログインが必要です'));
  }

  // サーバーサイドバリデーション
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return err(new Error('コメントを入力してください'));
  }
  if (trimmed.length > 1000) {
    return err(new Error('コメントは1000文字以内で入力してください'));
  }

  // レート制限チェック
  const rateLimitResult = await checkCommentRateLimit(user.user_id);
  if (rateLimitResult.success && rateLimitResult.data.isLimited) {
    return err(
      new Error('コメントの投稿上限に達しました。しばらくお待ちください。'),
    );
  }

  const isOfficial = user.role === Roles.MODERATOR.value;
  const result = await createFeedbackComment(
    feedbackId,
    user.user_id,
    trimmed,
    isOfficial,
  );

  if (!result.success) {
    logger.error`コメント作成失敗: ${result.error}`;
    return err(result.error);
  }

  revalidatePath(`/feedback/${feedbackId}`);
  return ok({ commentId: result.data.commentId });
};

/**
 * ステータスを更新する（MODERATOR専用）
 */
export const updateStatusAction = async (
  feedbackId: string,
  status: string,
  priority?: string,
  adminNote?: string,
): Promise<Result<void>> => {
  if (!isValidUlid(feedbackId)) {
    return err(new Error('無効なフィードバックIDです'));
  }

  const user = await getAuthUser();
  if (isNil(user)) {
    return err(new Error('ログインが必要です'));
  }

  if (user.role !== Roles.MODERATOR.value) {
    return err(new Error('管理者権限が必要です'));
  }

  if (!VALID_STATUSES.includes(status)) {
    return err(new Error('無効なステータスです'));
  }

  if (!isNil(priority) && !VALID_PRIORITIES.includes(priority)) {
    return err(new Error('無効な優先度です'));
  }

  const result = await updateFeedbackStatus(
    feedbackId,
    status,
    priority,
    adminNote,
  );

  if (!result.success) {
    logger.error`ステータス更新失敗: ${result.error}`;
    return err(result.error);
  }

  revalidatePath('/feedback');
  revalidatePath(`/feedback/${feedbackId}`);
  return ok(undefined);
};

/**
 * フィードバックを削除する（投稿者本人 & ステータス NEW のみ）
 */
export const deleteFeedbackAction = async (
  feedbackId: string,
): Promise<Result<void>> => {
  if (!isValidUlid(feedbackId)) {
    return err(new Error('無効なフィードバックIDです'));
  }

  const user = await getAuthUser();
  if (isNil(user)) {
    return err(new Error('ログインが必要です'));
  }

  const result = await deleteFeedback(feedbackId, user.user_id);

  if (!result.success) {
    logger.error`フィードバック削除失敗: ${result.error}`;
    return err(result.error);
  }

  revalidatePath('/feedback');
  return ok(undefined);
};

/**
 * フィードバック投稿のレート制限チェック
 */
export const checkRateLimitAction = async (): Promise<
  Result<{ isLimited: boolean; remaining: number }>
> => {
  const user = await getAuthUser();
  if (isNil(user)) {
    return err(new Error('ログインが必要です'));
  }

  // MODERATORはレート制限対象外
  if (user.role === Roles.MODERATOR.value) {
    return ok({ isLimited: false, remaining: 999 });
  }

  const result = await checkFeedbackRateLimit(user.user_id);

  if (!result.success) {
    return err(result.error);
  }

  return ok({
    isLimited: result.data.isLimited,
    remaining: result.data.remaining,
  });
};
