'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getUserByAuthUserId, toggleFavorite, togglePlayed } from './adapter';

import { createClient } from '@/lib/supabase/server';

/**
 * お気に入り状態をトグルする
 */
export const toggleFavoriteAction = async (
  scenarioId: string,
  userId: string,
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> => {
  const result = await toggleFavorite(scenarioId, userId);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(`/scenarios/${scenarioId}`);
  return { success: true, isFavorite: result.data };
};

/**
 * 詳細ページから使うお気に入り操作。操作時点の認証情報でユーザーを確定し、
 * 失敗時は呼び出し元の楽観的更新をロールバックできるよう例外を返す。
 */
export const toggleFavoriteForCurrentUserAction = async (
  scenarioId: string,
): Promise<void> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (isNil(authUser)) throw new Error('ログインが必要です');

  const userResult = await getUserByAuthUserId(authUser.id);
  if (!userResult.success || isNil(userResult.data)) {
    throw new Error('ユーザー情報を取得できませんでした');
  }

  const result = await toggleFavoriteAction(scenarioId, userResult.data.userId);
  if (!result.success) {
    throw new Error(result.error ?? 'お気に入りの更新に失敗しました');
  }
};

/**
 * プレイ済み状態をトグルする
 */
export const togglePlayedAction = async (
  scenarioId: string,
  userId: string,
): Promise<{ success: boolean; isPlayed?: boolean; error?: string }> => {
  const result = await togglePlayed(scenarioId, userId);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(`/scenarios/${scenarioId}`);
  return { success: true, isPlayed: result.data };
};
