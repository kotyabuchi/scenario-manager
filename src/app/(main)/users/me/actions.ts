'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import {
  type ProfileFormValues,
  profileFormSchema,
} from './_components/schema';
import { getUserByDiscordId, updateUserProfile } from './adapter';

import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

/**
 * ユーザープロフィールを更新する
 * @param input - 更新内容（表示名、自己紹介）
 * @returns 更新結果（成功時はvoid、失敗時はエラー）
 */
export const updateProfile = async (
  input: ProfileFormValues,
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
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
    );
  }

  // プロフィール更新（空文字はundefinedに変換）
  const updateResult = await updateUserProfile(userResult.data.userId, {
    nickname: parsed.data.nickname,
    bio: parsed.data.bio || undefined,
  });
  if (!updateResult.success) {
    return err(updateResult.error);
  }

  revalidatePath('/users/me');
  return ok(undefined);
};
