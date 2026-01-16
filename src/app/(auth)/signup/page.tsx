import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { SignupForm } from './_components/SignupForm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

const SignupPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインの場合はログインページへ
  if (!user) {
    redirect('/login');
  }

  // 既にユーザー登録済みの場合はホームへ
  const existingUser = await db.query.users.findFirst({
    where: eq(users.discordId, user.id),
  });

  if (existingUser) {
    redirect('/home');
  }

  const discordName =
    user.user_metadata.full_name ?? user.user_metadata.name ?? '';
  const avatarUrl = user.user_metadata.avatar_url ?? '';

  return <SignupForm defaultNickname={discordName} avatarUrl={avatarUrl} />;
};

export default SignupPage;
