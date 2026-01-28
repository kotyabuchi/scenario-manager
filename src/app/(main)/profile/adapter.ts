import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { User } from '@/components/blocks/Profile';

/**
 * Discord IDでユーザーを取得する
 */
export const getUserByDiscordId = async (
  discordId: string,
): Promise<Result<User | null>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    return ok(data ? (camelCaseKeys(data) as User) : null);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('ユーザーの取得に失敗しました'),
    );
  }
};

/**
 * ユーザープロフィールを更新する
 */
export const updateUserProfile = async (
  userId: string,
  input: { userName: string; nickname: string; bio: string | undefined },
): Promise<Result<User>> => {
  try {
    const supabase = await createDbClient();

    // userNameの重複チェック（自分以外で同じuserNameがないか）
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_name', input.userName)
      .neq('user_id', userId)
      .maybeSingle();

    if (existingUser) {
      return err(new Error('このユーザーIDは既に使用されています'));
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        user_name: input.userName,
        nickname: input.nickname,
        bio: input.bio ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return err(new Error(error.message));
    }

    if (!updated) {
      return err(new Error('ユーザーが見つかりません'));
    }

    return ok(camelCaseKeys(updated) as User);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('プロフィールの更新に失敗しました'),
    );
  }
};
