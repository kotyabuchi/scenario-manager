'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { feedbackFormSchema } from './schema';

import {
  checkFeedbackRateLimit,
  updateFeedback,
} from '@/app/(main)/feedback/adapter';
import { Roles } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { isValidUlid } from '@/lib/validateUlid';
import { err, ok, type Result } from '@/types/result';

import type { FeedbackCategories } from '@/db/enum';
import type { FeedbackFormValues } from './schema';

type FeedbackCategoryValue =
  (typeof FeedbackCategories)[keyof typeof FeedbackCategories]['value'];

type CreateFeedbackInput = FeedbackFormValues & {
  pageUrl?: string | undefined;
  browserInfo?: string | undefined;
};

type CreateFeedbackResult = {
  feedbackId: string;
};

const logger = getAppLogger(['app', 'feedback']);

/**
 * フィードバックを作成するServer Action
 */
export const createFeedbackAction = async (
  input: CreateFeedbackInput,
): Promise<Result<CreateFeedbackResult>> => {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // Zodバリデーション
  const parsed = feedbackFormSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
    );
  }

  // ユーザーIDとロールを取得
  const { data: user } = await supabase
    .from('users')
    .select('user_id, role')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  if (isNil(user)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  // サーバーサイドレート制限チェック（MODERATORは対象外）
  if (user.role !== Roles.MODERATOR.value) {
    const rateLimitResult = await checkFeedbackRateLimit(user.user_id);
    if (rateLimitResult.success && rateLimitResult.data.isLimited) {
      return err(new Error('投稿上限に達しました。しばらくお待ちください。'));
    }
  }

  // フィードバック作成
  try {
    const feedbackId = ulid();
    const { error } = await supabase.from('feedbacks').insert({
      feedback_id: feedbackId,
      user_id: user.user_id,
      category: parsed.data.category as FeedbackCategoryValue,
      title: parsed.data.title,
      description: parsed.data.description,
      page_url: input.pageUrl ?? null,
      browser_info: input.browserInfo ?? null,
    });

    if (error) {
      return err(new Error('フィードバックの作成に失敗しました'));
    }

    return ok({ feedbackId });
  } catch (error) {
    logger.error`Failed to create feedback: ${error}`;
    return err(new Error('フィードバックの送信に失敗しました'));
  }
};

/**
 * フィードバックを更新するServer Action
 */
export const updateFeedbackAction = async (
  feedbackId: string,
  input: FeedbackFormValues,
): Promise<Result<void>> => {
  if (!isValidUlid(feedbackId)) {
    return err(new Error('無効なフィードバックIDです'));
  }

  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // Zodバリデーション
  const parsed = feedbackFormSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
    );
  }

  // ユーザーIDを取得
  const { data: user } = await supabase
    .from('users')
    .select('user_id')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  if (isNil(user)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  // adapter に委譲（所有者チェック・ステータス制限・TRIAGED→NEW リセットを一元管理）
  const result = await updateFeedback(feedbackId, user.user_id, {
    category: parsed.data.category,
    title: parsed.data.title,
    description: parsed.data.description,
  });

  if (!result.success) {
    return result;
  }

  revalidatePath('/feedback');
  revalidatePath(`/feedback/${feedbackId}`);
  return ok(undefined);
};

/**
 * フィードバック投稿のレート制限チェック（DB方式: 1日10件）
 */
export const checkRateLimitAction = async (): Promise<
  Result<{ isLimited: boolean; remaining: number }>
> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  const { data: user } = await supabase
    .from('users')
    .select('user_id, role')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  if (isNil(user)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  // MODERATORはレート制限対象外
  if (user.role === Roles.MODERATOR.value) {
    return ok({ isLimited: false, remaining: 999 });
  }

  return checkFeedbackRateLimit(user.user_id);
};
