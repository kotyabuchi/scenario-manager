'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { getUserByDiscordId } from '../../scenarios/adapter';
import { createSession } from './adapter';
import { sessionFormSchema } from './schema';

import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { SessionFormValues } from './schema';

type CreateSessionActionResult = {
  gameSessionId: string;
};

/**
 * セッションを作成するServer Action
 *
 * 要件: requirements-session-flow.md Section 3
 * - US-S101: シナリオ未定でも募集可能
 * - US-S102: 日程未定でも募集可能
 * - US-S103: 人数未定でも募集可能
 */
export const createSessionAction = async (
  input: SessionFormValues,
): Promise<Result<CreateSessionActionResult>> => {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // Zodバリデーション
  const parsed = sessionFormSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
    );
  }

  // ユーザーIDを取得
  const userResult = await getUserByDiscordId(authUser.id);
  if (!userResult.success) {
    return err(userResult.error);
  }

  if (isNil(userResult.data)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  // セッション作成
  const createResult = await createSession(parsed.data, userResult.data.userId);

  if (!createResult.success) {
    return err(createResult.error);
  }

  // キャッシュの再検証
  revalidatePath('/sessions');

  return ok({ gameSessionId: createResult.data.gameSessionId });
};

/**
 * セッション作成後にリダイレクトするServer Action
 */
export const createSessionAndRedirect = async (
  input: SessionFormValues,
): Promise<void> => {
  const result = await createSessionAction(input);

  if (result.success) {
    redirect(`/sessions/${result.data.gameSessionId}`);
  }

  // エラー時はフォームに戻る（エラーはクライアント側で処理）
};
