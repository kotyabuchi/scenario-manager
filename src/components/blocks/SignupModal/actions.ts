'use server';

import { ulid } from 'ulid';

import { createClient } from '@/lib/supabase/server';

type RegisterUserInput = {
  userName: string;
  nickname: string;
  bio?: string | undefined;
  favoriteScenarios?: string | undefined;
};

type RegisterUserResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export const registerUser = async (
  input: RegisterUserInput,
): Promise<RegisterUserResult> => {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: '認証されていません' };
    }

    const userId = ulid();

    const { error } = await supabase.from('users').insert({
      user_id: userId,
      discord_id: authUser.id,
      user_name: input.userName,
      nickname: input.nickname,
      bio: input.bio || null,
      favorite_scenarios: input.favoriteScenarios || null,
      image: authUser.user_metadata?.avatar_url ?? null,
    });

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'このユーザーIDは既に使用されています',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, userId };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'ユーザー登録に失敗しました';
    return { success: false, error: message };
  }
};
