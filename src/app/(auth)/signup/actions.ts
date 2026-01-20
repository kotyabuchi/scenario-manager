'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { err, type Result } from '@/types/result';

type CreateUserInput = {
  userName: string;
  nickname: string;
};

export const createUser = async (
  input: CreateUserInput,
): Promise<Result<void>> => {
  const db = getDb();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('認証されていません'));
  }

  // ユーザー名の重複チェック
  const existingUserName = await db.query.users.findFirst({
    where: eq(users.userName, input.userName),
  });

  if (existingUserName) {
    return err(new Error('このユーザー名は既に使用されています'));
  }

  // Discord IDの重複チェック（既にサインアップ済みかどうか）
  const existingDiscordId = await db.query.users.findFirst({
    where: eq(users.discordId, authUser.id),
  });

  if (existingDiscordId) {
    return err(new Error('既に登録済みです'));
  }

  // ユーザー作成
  await db.insert(users).values({
    discordId: authUser.id,
    userName: input.userName,
    nickname: input.nickname,
    image: authUser.user_metadata['avatar_url'],
  });

  redirect('/home');
};
