'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getUserByDiscordId, updateUserProfile } from './adapter';

import { profileFormSchema } from '@/components/blocks/Profile';
import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { ProfileFormData } from '@/components/blocks/Profile';

/**
 * ユーザープロフィールを更新する
 * @param input - 更新内容（表示名、自己紹介）
 * @returns 更新結果（成功時はvoid、失敗時はエラー）
 */
export const updateProfile = async (
  input: ProfileFormData,
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

  // Zodスキーマでバリデーション
  const parsed = profileFormSchema.safeParse({
    userName: input.userName,
    nickname: input.nickname,
    bio: input.bio ?? '',
  });
  if (!parsed.success) {
    return err(
      new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
    );
  }

  // プロフィール更新
  const updateResult = await updateUserProfile(userResult.data.userId, {
    userName: parsed.data.userName,
    nickname: parsed.data.nickname,
    bio: parsed.data.bio || undefined,
  });
  if (!updateResult.success) {
    return err(updateResult.error);
  }

  revalidatePath('/profile');
  revalidatePath(`/users/${userResult.data.userId}`);
  return ok(undefined);
};
