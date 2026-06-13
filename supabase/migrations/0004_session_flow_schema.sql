-- セッションフロー機能のDBスキーマ拡張
-- schedule_candidates テーブル、FK変更、カラム追加、ENUM追加、RPC関数、RLS

-- 1. schedule_candidates テーブル作成
CREATE TYPE schedule_candidate_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TABLE schedule_candidates (
  candidate_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES game_sessions(game_session_id) ON DELETE CASCADE,
  candidate_date TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status schedule_candidate_status NOT NULL DEFAULT 'PENDING',
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_candidates_session ON schedule_candidates(session_id);

-- 2. schedule_responses の FK 変更
ALTER TABLE schedule_responses
  DROP CONSTRAINT IF EXISTS schedule_responses_schedule_id_game_schedules_session_id_fk;

ALTER TABLE schedule_responses
  RENAME COLUMN schedule_id TO candidate_id;

ALTER TABLE schedule_responses
  ADD CONSTRAINT schedule_responses_candidate_id_fkey
  FOREIGN KEY (candidate_id) REFERENCES schedule_candidates(candidate_id) ON DELETE CASCADE;

-- 3. game_sessions に cancel_reason, completed_at カラム追加
ALTER TABLE game_sessions ADD COLUMN cancel_reason TEXT;
ALTER TABLE game_sessions ADD COLUMN completed_at TIMESTAMPTZ;

-- 4. session_participants に withdrawal_reason カラム追加
ALTER TABLE session_participants ADD COLUMN withdrawal_reason TEXT;

-- 5. game_sessions に created_by_id カラム追加
ALTER TABLE game_sessions ADD COLUMN created_by_id TEXT REFERENCES users(user_id);

-- 既存レコードの created_by_id を keeper_id で埋める（既存データはGM=作成者の前提）
UPDATE game_sessions SET created_by_id = keeper_id WHERE created_by_id IS NULL AND keeper_id IS NOT NULL;

-- NOT NULL制約を追加（新規作成時は必ず設定される）
ALTER TABLE game_sessions ALTER COLUMN created_by_id SET NOT NULL;

-- 6. participant_status ENUM に WITHDRAWN を追加
ALTER TYPE participant_status ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- 7. confirm_schedule RPC関数作成（日程確定のアトミック操作）
CREATE OR REPLACE FUNCTION confirm_schedule(
  p_candidate_id TEXT,
  p_session_id TEXT
) RETURNS void AS $$
DECLARE
  v_caller TEXT := auth.uid()::text;
BEGIN
  -- 認可チェック: セッション管理者（keeper または作成者）のみ実行可能
  IF NOT EXISTS (
    SELECT 1 FROM game_sessions
    WHERE game_session_id = p_session_id
    AND (keeper_id = v_caller OR created_by_id = v_caller)
  ) THEN
    RAISE EXCEPTION '日程確定の権限がありません';
  END IF;

  -- 1. 選択された候補を CONFIRMED に更新
  UPDATE schedule_candidates
    SET status = 'CONFIRMED', updated_at = now()
    WHERE candidate_id = p_candidate_id AND session_id = p_session_id;

  -- 2. 同セッションの他候補を CANCELLED に更新
  UPDATE schedule_candidates
    SET status = 'CANCELLED', updated_at = now()
    WHERE session_id = p_session_id AND candidate_id != p_candidate_id;

  -- 3-4. game_schedules の日程・フェーズを更新
  UPDATE game_schedules
    SET schedule_date = (
      SELECT candidate_date FROM schedule_candidates WHERE candidate_id = p_candidate_id
    ),
    schedule_phase = 'CONFIRMED',
    updated_at = now()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. schedule_candidates テーブルに RLS ポリシー設定
ALTER TABLE schedule_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_candidates_select" ON schedule_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.game_session_id = session_id
      AND (
        gs.keeper_id = auth.uid()::text
        OR gs.created_by_id = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM session_participants sp
          WHERE sp.session_id = gs.game_session_id
          AND sp.user_id = auth.uid()::text
          AND sp.participant_status != 'WITHDRAWN'
        )
      )
    )
  );

CREATE POLICY "schedule_candidates_insert" ON schedule_candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_session_id = session_id
      AND (keeper_id = auth.uid()::text OR created_by_id = auth.uid()::text)
    )
  );

CREATE POLICY "schedule_candidates_update" ON schedule_candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_session_id = session_id
      AND (keeper_id = auth.uid()::text OR created_by_id = auth.uid()::text)
    )
  );

CREATE POLICY "schedule_candidates_delete" ON schedule_candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_session_id = session_id
      AND (keeper_id = auth.uid()::text OR created_by_id = auth.uid()::text)
    )
  );

-- 9. schedule_responses テーブルに RLS ポリシー設定
ALTER TABLE schedule_responses ENABLE ROW LEVEL SECURITY;

-- SELECT: セッション参加者・管理者のみ閲覧可能
CREATE POLICY "schedule_responses_select" ON schedule_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedule_candidates sc
      JOIN game_sessions gs ON gs.game_session_id = sc.session_id
      WHERE sc.candidate_id = schedule_responses.candidate_id
      AND (
        gs.keeper_id = auth.uid()::text
        OR gs.created_by_id = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM session_participants sp
          WHERE sp.session_id = sc.session_id
          AND sp.user_id = auth.uid()::text
          AND sp.participant_status != 'WITHDRAWN'
        )
      )
    )
  );

-- INSERT: 本人のみ回答可能
CREATE POLICY "schedule_responses_insert" ON schedule_responses
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text
  );

-- UPDATE: 本人のみ更新可能
CREATE POLICY "schedule_responses_update" ON schedule_responses
  FOR UPDATE USING (
    user_id = auth.uid()::text
  );

-- DELETE: セッション管理者のみ削除可能
CREATE POLICY "schedule_responses_delete" ON schedule_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM schedule_candidates sc
      JOIN game_sessions gs ON gs.game_session_id = sc.session_id
      WHERE sc.candidate_id = schedule_responses.candidate_id
      AND (gs.keeper_id = auth.uid()::text OR gs.created_by_id = auth.uid()::text)
    )
  );
