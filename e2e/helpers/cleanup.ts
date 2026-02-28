import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const E2E_PREFIX = '[E2E]';

/** E2Eテスト用のユニークなセッション名を生成する */
export function generateE2ESessionName(base: string): string {
  return `${E2E_PREFIX} ${Date.now()} ${base}`;
}

/**
 * 指定されたセッションIDの関連レコードを削除する（内部ヘルパー）
 */
async function deleteSessionRelatedRecords(
  supabase: SupabaseClient,
  sessionIds: string[],
): Promise<void> {
  // 関連テーブルを先に削除（外部キー制約）
  const { data: candidates } = await supabase
    .from('schedule_candidates')
    .select('candidate_id')
    .in('session_id', sessionIds);

  const candidateIds =
    (candidates as { candidate_id: string }[] | null)?.map(
      (c) => c.candidate_id,
    ) ?? [];

  await supabase
    .from('schedule_responses')
    .delete()
    .in('candidate_id', candidateIds);

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
}

/**
 * 特定のセッションをクリーンアップする
 *
 * 並列テスト実行時に他プロジェクトのセッションを誤削除しないよう、
 * セッションIDを指定して削除する。
 */
export async function cleanupE2ESession(sessionId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  await deleteSessionRelatedRecords(supabase, [sessionId]);
  await supabase
    .from('game_sessions')
    .delete()
    .eq('game_session_id', sessionId);
}

/**
 * E2Eテストで作成された全セッションをクリーンアップする
 *
 * グローバルティアダウン等で使用する。
 * 並列実行中のテストに影響するため、個別テストの afterAll では
 * cleanupE2ESession(sessionId) を使用すること。
 */
export async function cleanupE2ESessions(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('game_session_id')
    .like('session_name', `${E2E_PREFIX}%`);

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.game_session_id);
    await deleteSessionRelatedRecords(supabase, sessionIds);
    await supabase
      .from('game_sessions')
      .delete()
      .like('session_name', `${E2E_PREFIX}%`);
  }
}
