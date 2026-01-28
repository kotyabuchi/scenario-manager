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
          .eq('discord_id', authUser.id)
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
  const html = `<!DOCTYPE html>
<html>
<head><title>認証中...</title></head>
<body>
<p>認証処理中です。このウィンドウは自動的に閉じます。</p>
<script>
  try {
    const channel = new BroadcastChannel('auth');
    channel.postMessage(${JSON.stringify(message)});
    channel.close();
  } catch (e) {
    console.error('BroadcastChannel error:', e);
  }
  window.close();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
};
