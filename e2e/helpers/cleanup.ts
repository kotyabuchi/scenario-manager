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

    // 関連テーブルを先に削除（外部キー制約）
    await supabase
      .from('schedule_responses')
      .delete()
      .in(
        'candidate_id',
        (
          await supabase
            .from('schedule_candidates')
            .select('candidate_id')
            .in('session_id', sessionIds)
        ).data?.map((c) => c.candidate_id) ?? [],
      );

    await supabase
      .from('schedule_candidates')
      .delete()
      .in('session_id', sessionIds);

    await supabase.from('session_links').delete().in('session_id', sessionIds);

    // 可用枠・確定日程の関連テーブルを削除
    await supabase
      .from('session_availability_time_blocks')
      .delete()
      .in('session_id', sessionIds);
    await supabase
      .from('game_schedule_time_blocks')
      .delete()
      .in('session_id', sessionIds);

    await supabase.from('game_schedules').delete().in('session_id', sessionIds);

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
