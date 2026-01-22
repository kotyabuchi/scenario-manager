'use server';

import { eq } from 'drizzle-orm';
import { isNil } from 'ramda';

import { feedbackFormSchema } from './schema';

import { db } from '@/db';
import { feedbacks, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
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

  // ユーザーIDを取得
  const user = await db.query.users.findFirst({
    where: eq(users.discordId, authUser.id),
  });

  if (isNil(user)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  // フィードバック作成
  try {
    const result = await db
      .insert(feedbacks)
      .values({
        userId: user.userId,
        category: parsed.data.category as FeedbackCategoryValue,
        title: parsed.data.title,
        description: parsed.data.description,
        pageUrl: input.pageUrl ?? null,
        browserInfo: input.browserInfo ?? null,
      })
      .returning({ feedbackId: feedbacks.feedbackId });

    const feedback = result[0];
    if (isNil(feedback)) {
      return err(new Error('フィードバックの作成に失敗しました'));
    }

    return ok({ feedbackId: feedback.feedbackId });
  } catch (error) {
    console.error('Failed to create feedback:', error);
    return err(new Error('フィードバックの送信に失敗しました'));
  }
};
