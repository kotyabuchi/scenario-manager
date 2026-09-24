import { createClient } from '@/lib/supabase/server';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('nickname')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        const discordMeta = {
          avatarUrl: authUser.user_metadata?.avatar_url ?? undefined,
          userName:
            authUser.user_metadata?.user_name ??
            authUser.user_metadata?.preferred_username ??
            undefined,
          displayName:
            authUser.user_metadata?.full_name ??
            authUser.user_metadata?.name ??
            undefined,
        };

        if (existingUser) {
          return createPopupResponse({
            type: 'success',
            redirectTo: '/home',
            isNewUser: false,
            nickname: existingUser.nickname,
          });
        }

        return createPopupResponse({
          type: 'success',
          redirectTo: '/home',
          isNewUser: true,
          discordMeta,
        });
      }
    }
  }

  return createPopupResponse({
    type: 'error',
    message: '認証に失敗しました。もう一度お試しください。',
  });
};

type DiscordMeta = {
  avatarUrl?: string;
  userName?: string;
  displayName?: string;
};

type AuthMessage =
  | {
      type: 'success';
      redirectTo: string;
      isNewUser: boolean;
      nickname?: string;
      discordMeta?: DiscordMeta;
    }
  | { type: 'error'; message: string };

const createPopupResponse = (message: AuthMessage) => {
  const serializedMessage = JSON.stringify(message).replaceAll('<', '\\u003c');
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>認証中...</title></head>
<body>
<p>認証処理中です。このウィンドウは自動的に閉じます。</p>
<script>
  const message = ${serializedMessage};
  if (window.name === 'discord-auth') {
    try {
      const channel = new BroadcastChannel('auth');
      channel.postMessage(message);
      channel.close();
    } finally {
      window.close();
    }
  } else {
    let returnTo = message.type === 'success' ? message.redirectTo : '/scenarios';
    try {
      const key = 'scenario-manager:auth-return-to';
      const saved = window.sessionStorage.getItem(key);
      window.sessionStorage.removeItem(key);
      if (saved && saved.startsWith('/') && !saved.startsWith('//') && !saved.includes('\\') && !saved.startsWith('/auth/')) {
        returnTo = saved;
      }
    } catch {
      // ストレージが利用できない場合は既定の行き先に戻る。
    }
    window.location.replace(returnTo);
  }
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
