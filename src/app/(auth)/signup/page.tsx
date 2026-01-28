import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { SignupForm } from './_components/SignupForm';

import { createClient, createDbClient } from '@/lib/supabase/server';

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインの場合はログインページへ
  if (!user) {
    redirect('/login');
  }

  // 既にユーザー登録済みの場合はホームへ
  const db = await createDbClient();
  const { data: existingUser } = await db
    .from('users')
    .select('user_id')
    .eq('discord_id', user.id)
    .maybeSingle();

  if (existingUser) {
    redirect('/home');
  }

  const discordName = !isNil(user.user_metadata)
    ? (user.user_metadata.full_name ?? user.user_metadata.name ?? '')
    : '';
  const avatarUrl = !isNil(user.user_metadata)
    ? (user.user_metadata.avatar_url ?? '')
    : '';

  return <SignupForm defaultNickname={discordName} avatarUrl={avatarUrl} />;
}
