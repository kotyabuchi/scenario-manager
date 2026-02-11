-- シナリオのインポート元情報を管理するカラムを追加
CREATE TYPE scenario_source_type AS ENUM ('manual', 'booth', 'talto');

ALTER TABLE scenarios ADD COLUMN source_type scenario_source_type DEFAULT 'manual';
ALTER TABLE scenarios ADD COLUMN source_url TEXT;
ALTER TABLE scenarios ADD COLUMN source_fetched_at TIMESTAMPTZ;
