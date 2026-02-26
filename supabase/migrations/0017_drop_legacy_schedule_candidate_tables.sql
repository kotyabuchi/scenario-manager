-- 旧候補日ベース日程調整フローのレガシーテーブル/関数を削除する
-- 新フローは session_availability_slots / game_schedule_slots を使用する

DROP FUNCTION IF EXISTS public.confirm_schedule(TEXT, TEXT);

DROP TABLE IF EXISTS public.schedule_responses CASCADE;
DROP TABLE IF EXISTS public.schedule_candidates CASCADE;

-- 旧候補日フロー専用の enum を整理（他オブジェクト参照が残っている場合は IF EXISTS で保護）
DROP TYPE IF EXISTS public.schedule_availability;
DROP TYPE IF EXISTS public.schedule_candidate_status;
