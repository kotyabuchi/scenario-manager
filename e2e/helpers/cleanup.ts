import { createClient } from '@supabase/supabase-js';

const E2E_PREFIX = '[E2E]';

/** E2Eテスト用のユニークなセッション名を生成する */
export function generateE2ESessionName(base: string): string {
  return `${E2E_PREFIX} ${Date.now()} ${base}`;
}

/**
 * E2Eテストで作成されたセッションをクリーンアップする
 *
 * SUPABASE_SERVICE_ROLE_KEY が設定されていない場合はスキップする。
 * RLSバイパスのため service role key が必要。
 */
export async function cleanupE2ESessions(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 参加者テーブルも連携削除（session_idで紐づく）
  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('game_session_id')
    .like('session_name', `${E2E_PREFIX}%`);

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.game_session_id);

    await supabase
      .from('session_participants')
      .delete()
      .in('session_id', sessionIds);

    await supabase
      .from('game_sessions')
      .delete()
      .like('session_name', `${E2E_PREFIX}%`);
  }
}
