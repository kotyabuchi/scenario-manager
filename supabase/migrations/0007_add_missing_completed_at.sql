-- game_sessions.completed_at が欠けていたため追加
-- migration 0004 で追加予定だったが、部分適用により欠落していた
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
