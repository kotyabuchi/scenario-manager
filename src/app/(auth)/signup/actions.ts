'use server';

import { redirect } from 'next/navigation';
import { ulid } from 'ulid';

import { createClient } from '@/lib/supabase/server';
import { err, type Result } from '@/types/result';

type CreateUserInput = {
  userName: string;
  nickname: string;
};

export const createUser = async (
  input: CreateUserInput,
): Promise<Result<void>> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('認証されていません'));
  }

  // ユーザー名の重複チェック
  const { data: existingUserName } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_name', input.userName)
    .maybeSingle();

  if (existingUserName) {
    return err(new Error('このユーザー名は既に使用されています'));
  }

  // Discord IDの重複チェック（既にサインアップ済みかどうか）
  const { data: existingDiscordId } = await supabase
    .from('users')
    .select('user_id')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  if (existingDiscordId) {
    return err(new Error('既に登録済みです'));
  }

  // ユーザー作成
  const { error } = await supabase.from('users').insert({
    user_id: ulid(),
    discord_id: authUser.id,
    user_name: input.userName,
    nickname: input.nickname,
    image: authUser.user_metadata.avatar_url,
  });

  if (error) {
    return err(new Error(error.message));
  }

  redirect('/home');
};
