-- ============================================================
-- 0022: replace_confirmed_schedule_time_blocks の認可強化と型修正
-- ============================================================
-- codex-debate レビューで指摘された以下の問題を修正:
-- 1. SECURITY DEFINER 関数に current_app_user_id() による認可チェック追加
-- 2. p_schedule_date の型を TIMESTAMPTZ に統一（旧 RPC との互換性維持）
-- 3. UPDATE 後の NOT FOUND チェック追加
-- ============================================================

-- 旧関数を DROP（TIMESTAMP シグネチャ）
DROP FUNCTION IF EXISTS replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMP);

-- 新関数を作成（TIMESTAMPTZ シグネチャに戻す + 認可強化）
CREATE FUNCTION replace_confirmed_schedule_time_blocks(
  p_session_id TEXT,
  p_actor_user_id TEXT,
  p_time_blocks JSONB,
  p_schedule_date TIMESTAMPTZ
)
RETURNS SETOF game_schedule_time_blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller TEXT;
BEGIN
  -- 認可チェック 1: 認証済みであること
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 認可チェック 2: 呼び出し元ユーザーIDが現在の認証ユーザーと一致すること
  v_caller := public.current_app_user_id();
  IF v_caller IS NULL OR v_caller <> p_actor_user_id THEN
    RAISE EXCEPTION 'User ID mismatch';
  END IF;

  -- 認可チェック 3: セッションの keeper または creator であること
  IF NOT EXISTS (
    SELECT 1 FROM game_sessions
    WHERE game_session_id = p_session_id
      AND (keeper_id = v_caller OR created_by_id = v_caller)
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify this session schedule';
  END IF;

  -- game_sessions の schedule_date / schedule_phase を更新
  UPDATE game_sessions
  SET
    schedule_date  = p_schedule_date,
    schedule_phase = 'CONFIRMED'
  WHERE game_session_id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- 既存の確定日程を削除
  DELETE FROM game_schedule_time_blocks
  WHERE session_id = p_session_id;

  -- 新しい確定日程を挿入
  RETURN QUERY
    INSERT INTO game_schedule_time_blocks (
      game_schedule_time_block_id,
      session_id,
      start_at,
      end_at,
      block_order,
      created_by
    )
    SELECT
      (s->>'gameScheduleTimeBlockId')::text,
      p_session_id,
      (s->>'startAt')::timestamptz,
      (s->>'endAt')::timestamptz,
      (s->>'blockOrder')::integer,
      p_actor_user_id
    FROM jsonb_array_elements(p_time_blocks) AS s
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMPTZ)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMPTZ)
  TO authenticated, service_role;
