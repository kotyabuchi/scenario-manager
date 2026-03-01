-- ============================================================
-- 0021: game_schedules テーブルを game_sessions に統合
-- ============================================================
-- game_schedules は game_sessions と 1:1 関係で schedule_phase/schedule_date の
-- 2カラムしか保持しない。セッション作成時にレコードが作成されず日程確定時に初めて
-- UPSERT されるため、各所で null ハンドリングが必要でバグの温床になっていた。
-- 統合により schedule_phase は NOT NULL DEFAULT 'ADJUSTING' で常に値が存在し、
-- null 分岐を排除できる。
-- ============================================================

-- 1. game_sessions にカラム追加
ALTER TABLE game_sessions
  ADD COLUMN schedule_date TIMESTAMP,
  ADD COLUMN schedule_phase schedule_phase NOT NULL DEFAULT 'ADJUSTING';

-- 2. game_schedules の既存データを game_sessions に移行
UPDATE game_sessions gs
SET
  schedule_date  = gsch.schedule_date,
  schedule_phase = gsch.schedule_phase
FROM game_schedules gsch
WHERE gs.game_session_id = gsch.session_id;

-- 3. game_schedule_time_blocks の FK 変更
-- 旧 FK を DROP し、game_sessions.game_session_id を参照する新 FK を ADD
ALTER TABLE game_schedule_time_blocks
  DROP CONSTRAINT game_schedule_time_blocks_session_id_game_schedules_fkey;

ALTER TABLE game_schedule_time_blocks
  ADD CONSTRAINT game_schedule_time_blocks_session_id_game_sessions_fkey
    FOREIGN KEY (session_id) REFERENCES game_sessions(game_session_id);

-- 4. RPC replace_confirmed_schedule_time_blocks を再作成
-- 変更点:
--   - game_schedules UPSERT → game_sessions UPDATE に変更
--   - auth.uid() 認可チェックを追加
DROP FUNCTION IF EXISTS replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMPTZ);

CREATE FUNCTION replace_confirmed_schedule_time_blocks(
  p_session_id TEXT,
  p_actor_user_id TEXT,
  p_time_blocks JSONB,
  p_schedule_date TIMESTAMP
)
RETURNS SETOF game_schedule_time_blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 認可チェック: 実行者が auth.uid() と一致すること
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- game_sessions の schedule_date / schedule_phase を更新
  UPDATE game_sessions
  SET
    schedule_date  = p_schedule_date,
    schedule_phase = 'CONFIRMED'
  WHERE game_session_id = p_session_id;

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

REVOKE ALL ON FUNCTION replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMP)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMP)
  TO authenticated, service_role;

-- 5. game_sessions(schedule_date) にインデックスを作成
CREATE INDEX idx_game_sessions_schedule_date
  ON game_sessions(schedule_date);

-- 6. game_schedules の RLS ポリシー削除
-- (ポリシーが存在する場合のみ)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'game_schedules'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON game_schedules', pol.policyname);
  END LOOP;
END;
$$;

-- 7. game_schedules テーブル DROP
DROP TABLE IF EXISTS game_schedules;
