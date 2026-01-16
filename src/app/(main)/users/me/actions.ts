'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getUserByDiscordId, updateUserProfile } from './adapter';

import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { UpdateProfileInput } from './interface';

/**
 * ユーザープロフィールを更新する
 * @param input - 更新内容（表示名、自己紹介）
 * @returns 更新結果（成功時はvoid、失敗時はエラー）
 */
export const updateProfile = async (
  input: UpdateProfileInput,
): Promise<Result<void>> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('認証されていません'));
  }

  // ユーザーを取得
  const userResult = await getUserByDiscordId(authUser.id);
  if (!userResult.success) {
    return err(userResult.error);
  }

  if (isNil(userResult.data)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  // バリデーション
  if (isNil(input.nickname) || input.nickname.trim() === '') {
    return err(new Error('表示名を入力してください'));
  }

  if (input.nickname.length > 50) {
    return err(new Error('表示名は50文字以内で入力してください'));
  }

  if (!isNil(input.bio) && input.bio.length > 500) {
    return err(new Error('自己紹介は500文字以内で入力してください'));
  }

  // プロフィール更新
  const updateResult = await updateUserProfile(userResult.data.userId, input);
  if (!updateResult.success) {
    return err(updateResult.error);
  }

  revalidatePath('/users/me');
  return ok(undefined);
};
