import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export const GET = async (request: Request) => {
  const db = getDb();
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ログインしたユーザー情報を取得
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // usersテーブルにユーザーが存在するかチェック
        const existingUser = await db.query.users.findFirst({
          where: eq(users.discordId, authUser.id),
        });

        const redirectUrl = getRedirectUrl(request, origin);

        // 存在しない場合は /signup へ
        if (!existingUser) {
          return NextResponse.redirect(`${redirectUrl}/signup`);
        }

        // 存在する場合は /home へ
        return NextResponse.redirect(`${redirectUrl}/home`);
      }
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
};

const getRedirectUrl = (request: Request, origin: string): string => {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  if (isLocalEnv) {
    return origin;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}`;
  }

  return origin;
};
