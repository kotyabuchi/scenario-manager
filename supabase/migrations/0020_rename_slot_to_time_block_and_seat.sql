-- 0020: Slot → TimeBlock / Seat リネーム
--
-- 「Slot」が時間帯と人数枠の2つの概念に使われており曖昧なため、
-- TRPGコミュニティの自然な用語に統一する:
--   - 時間帯: time_block（候補日時 / 確定日程）
--   - 人数枠: seat（席）

-- ============================================================
-- 1. テーブルリネーム (2件)
-- ============================================================

ALTER TABLE public.session_availability_slots
  RENAME TO session_availability_time_blocks;

ALTER TABLE public.game_schedule_slots
  RENAME TO game_schedule_time_blocks;

-- ============================================================
-- 2. カラムリネーム (4件)
-- ============================================================

-- session_availability_time_blocks
ALTER TABLE public.session_availability_time_blocks
  RENAME COLUMN availability_slot_id TO availability_time_block_id;

-- game_schedule_time_blocks
ALTER TABLE public.game_schedule_time_blocks
  RENAME COLUMN game_schedule_slot_id TO game_schedule_time_block_id;

ALTER TABLE public.game_schedule_time_blocks
  RENAME COLUMN slot_order TO block_order;

-- game_sessions: 人数枠 → 席
ALTER TABLE public.game_sessions
  RENAME COLUMN remaining_player_slot_count TO remaining_seat_count;

-- ============================================================
-- 3. インデックスリネーム (7件)
-- ============================================================

-- session_availability_time_blocks のインデックス
ALTER INDEX session_availability_slots_session_idx
  RENAME TO session_availability_time_blocks_session_idx;

ALTER INDEX session_availability_slots_session_user_idx
  RENAME TO session_availability_time_blocks_session_user_idx;

ALTER INDEX session_availability_slots_session_start_idx
  RENAME TO session_availability_time_blocks_session_start_idx;

ALTER INDEX session_availability_slots_session_end_idx
  RENAME TO session_availability_time_blocks_session_end_idx;

-- game_schedule_time_blocks のインデックス
ALTER INDEX game_schedule_slots_session_idx
  RENAME TO game_schedule_time_blocks_session_idx;

ALTER INDEX game_schedule_slots_session_order_idx
  RENAME TO game_schedule_time_blocks_session_order_idx;

ALTER INDEX game_schedule_slots_session_start_idx
  RENAME TO game_schedule_time_blocks_session_start_idx;

-- ============================================================
-- 4. 制約リネーム (13件)
-- ============================================================

-- session_availability_time_blocks の制約
ALTER TABLE public.session_availability_time_blocks
  RENAME CONSTRAINT session_availability_slots_session_id_game_sessions_fkey
  TO session_availability_time_blocks_session_id_game_sessions_fkey;

ALTER TABLE public.session_availability_time_blocks
  RENAME CONSTRAINT session_availability_slots_user_id_users_fkey
  TO session_availability_time_blocks_user_id_users_fkey;

ALTER TABLE public.session_availability_time_blocks
  RENAME CONSTRAINT session_availability_slots_time_order_check
  TO session_availability_time_blocks_time_order_check;

ALTER TABLE public.session_availability_time_blocks
  RENAME CONSTRAINT session_availability_slots_start_30min_boundary_check
  TO session_availability_time_blocks_start_30min_boundary_check;

ALTER TABLE public.session_availability_time_blocks
  RENAME CONSTRAINT session_availability_slots_end_30min_boundary_check
  TO session_availability_time_blocks_end_30min_boundary_check;

-- game_schedule_time_blocks の制約
ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_session_id_game_schedules_fkey
  TO game_schedule_time_blocks_session_id_game_schedules_fkey;

ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_created_by_users_fkey
  TO game_schedule_time_blocks_created_by_users_fkey;

ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_time_order_check
  TO game_schedule_time_blocks_time_order_check;

ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_slot_order_positive_check
  TO game_schedule_time_blocks_block_order_positive_check;

ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_start_30min_boundary_check
  TO game_schedule_time_blocks_start_30min_boundary_check;

ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_end_30min_boundary_check
  TO game_schedule_time_blocks_end_30min_boundary_check;

-- game_sessions の制約
ALTER TABLE public.game_sessions
  RENAME CONSTRAINT game_sessions_remaining_player_slot_count_non_negative
  TO game_sessions_remaining_seat_count_non_negative;

-- PK 制約のリネーム（テーブルリネームで自動追従しない場合）
ALTER TABLE public.session_availability_time_blocks
  RENAME CONSTRAINT session_availability_slots_pkey
  TO session_availability_time_blocks_pkey;

ALTER TABLE public.game_schedule_time_blocks
  RENAME CONSTRAINT game_schedule_slots_pkey
  TO game_schedule_time_blocks_pkey;

-- ============================================================
-- 5. トリガー削除 (1件)
-- ============================================================

DROP TRIGGER IF EXISTS trg_sync_remaining_player_slots_on_participants
  ON public.session_participants;

-- ============================================================
-- 6. 関数削除 (5件)
-- ============================================================

DROP FUNCTION IF EXISTS adjust_session_remaining_player_slots(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_remaining_player_slots_on_participants();
DROP FUNCTION IF EXISTS create_session_transaction(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP, INTEGER, TEXT, BOOLEAN,
  session_visibility, participant_type, JSONB, JSONB
);
DROP FUNCTION IF EXISTS replace_availability_slots(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS replace_confirmed_schedule_slots(TEXT, TEXT, JSONB, TIMESTAMPTZ);

-- ============================================================
-- 7. 関数再作成 (5件)
-- ============================================================

-- 7-1. adjust_session_remaining_seats
CREATE FUNCTION adjust_session_remaining_seats(
  p_session_id TEXT,
  p_delta INTEGER
) RETURNS void AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  IF p_session_id IS NULL OR p_delta IS NULL OR p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_delta > 0 THEN
    -- 席を減らす（参加者の追加）
    UPDATE game_sessions
    SET remaining_seat_count = remaining_seat_count - p_delta
    WHERE game_session_id = p_session_id
      AND remaining_seat_count >= p_delta;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
      RAISE EXCEPTION '残りのプレイヤー募集席がありません'
        USING ERRCODE = 'P0001';
    END IF;

    RETURN;
  END IF;

  -- 席を戻す（参加者の離脱）
  UPDATE game_sessions
  SET remaining_seat_count = remaining_seat_count + ABS(p_delta)
  WHERE game_session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7-2. sync_remaining_seats_on_participants
CREATE FUNCTION sync_remaining_seats_on_participants()
RETURNS trigger AS $$
DECLARE
  v_old_counted BOOLEAN := FALSE;
  v_new_counted BOOLEAN := FALSE;
  v_delta INTEGER := 0;
  v_session_id TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    v_old_counted :=
      OLD.participant_type = 'PLAYER' AND OLD.participant_status = 'CONFIRMED';
  END IF;

  IF TG_OP <> 'DELETE' THEN
    v_new_counted :=
      NEW.participant_type = 'PLAYER' AND NEW.participant_status = 'CONFIRMED';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- INSERT 時: CONFIRMED PLAYER が追加されたら席を1つ消費
    v_delta := CASE WHEN v_new_counted THEN 1 ELSE 0 END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_delta := CASE
      WHEN NOT v_old_counted AND v_new_counted THEN 1
      WHEN v_old_counted AND NOT v_new_counted THEN -1
      ELSE 0
    END;
  ELSIF TG_OP = 'DELETE' AND v_old_counted THEN
    v_delta := -1;
  ELSE
    v_delta := 0;
  END IF;

  v_session_id := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.session_id
    ELSE NEW.session_id
  END;

  PERFORM adjust_session_remaining_seats(v_session_id, v_delta);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7-3. create_session_transaction
CREATE FUNCTION create_session_transaction(
  p_game_session_id TEXT,
  p_user_id TEXT,
  p_session_name TEXT,
  p_session_description TEXT,
  p_scenario_id TEXT,
  p_scheduled_at TIMESTAMP,
  p_recruited_player_count INTEGER,
  p_tools TEXT,
  p_is_beginner_friendly BOOLEAN,
  p_visibility session_visibility,
  p_creator_participant_type participant_type,
  p_initial_availability_time_blocks JSONB,
  p_invited_members JSONB
)
RETURNS TABLE (
  game_session_id TEXT,
  session_name TEXT,
  session_phase session_phase,
  scenario_id TEXT,
  scheduled_at TIMESTAMP,
  recruited_player_count INTEGER,
  tools TEXT,
  is_beginner_friendly BOOLEAN,
  visibility session_visibility
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid TEXT := auth.uid()::text;
  v_auth_role TEXT := auth.role();
  v_user_id TEXT;
  v_initial_time_blocks JSONB;
  v_invited JSONB;
  v_requested_player_seats INTEGER := GREATEST(COALESCE(p_recruited_player_count, 0), 0);
  v_initial_confirmed_non_spectator_count INTEGER := 0;
  v_initial_confirmed_player_count INTEGER := 0;
  v_invalid_user_ids TEXT[];
  v_has_invalid_time_block BOOLEAN := FALSE;
BEGIN
  -- ── バリデーション ──────────────────────────────────────

  -- セッションIDのULID形式チェック（26文字の英数大文字）
  IF p_game_session_id IS NULL
    OR char_length(p_game_session_id) <> 26
    OR p_game_session_id !~ '^[0-9A-Z]{26}$'
  THEN
    RAISE EXCEPTION 'セッションIDの形式が不正です'
      USING ERRCODE = 'P0002';
  END IF;

  v_initial_time_blocks := COALESCE(p_initial_availability_time_blocks, '[]'::jsonb);
  v_invited := COALESCE(p_invited_members, '[]'::jsonb);

  -- 候補日時IDのULID形式チェック（NULL値も不正として検出）
  IF jsonb_array_length(v_initial_time_blocks) > 0 THEN
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_initial_time_blocks) AS s
      WHERE COALESCE(trim(s->>'startAt'), '') <> ''
        AND COALESCE(trim(s->>'endAt'), '') <> ''
        AND (
          (s->>'availabilityTimeBlockId') IS NULL
          OR char_length(s->>'availabilityTimeBlockId') <> 26
          OR (s->>'availabilityTimeBlockId') !~ '^[0-9A-Z]{26}$'
        )
    ) INTO v_has_invalid_time_block;

    IF v_has_invalid_time_block THEN
      RAISE EXCEPTION '候補日時IDの形式が不正です'
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- ── 認証・認可 ──────────────────────────────────────────

  IF v_auth_role = 'service_role' THEN
    v_user_id := p_user_id;
  ELSE
    IF v_auth_uid IS NULL THEN
      RAISE EXCEPTION 'ログインが必要です';
    END IF;

    SELECT u.user_id INTO v_user_id
    FROM users u
    WHERE u.user_id = p_user_id
      AND u.auth_user_id = v_auth_uid::uuid;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'ユーザーが見つかりません';
    END IF;
  END IF;

  -- 招待メンバーの存在確認（userId が NULL のメンバーも不正として検出）
  IF jsonb_array_length(v_invited) > 0 THEN
    SELECT array_agg(COALESCE((m->>'userId')::text, '(null)'))
    INTO v_invalid_user_ids
    FROM jsonb_array_elements(v_invited) AS m
    WHERE (m->>'userId') IS NULL
      OR (
        (m->>'userId')::text <> v_user_id
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.user_id = (m->>'userId')::text
        )
      );

    IF v_invalid_user_ids IS NOT NULL AND array_length(v_invalid_user_ids, 1) > 0 THEN
      RAISE EXCEPTION '招待メンバーに存在しないユーザーが含まれています: %', v_invalid_user_ids
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- ── 参加者カウント ──────────────────────────────────────

  v_initial_confirmed_non_spectator_count :=
    CASE WHEN p_creator_participant_type IN ('KEEPER', 'PLAYER') THEN 1 ELSE 0 END
    + COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM jsonb_array_elements(v_invited) AS m
      WHERE (m->>'userId')::text <> v_user_id
        AND (m->>'participantType') IN ('KEEPER', 'PLAYER')
    ), 0);

  -- INSERT トリガーが CONFIRMED PLAYER を自動カウントするため、
  -- 初期値にはトリガーが差し引く分を上乗せしておく
  v_initial_confirmed_player_count :=
    CASE WHEN p_creator_participant_type = 'PLAYER' THEN 1 ELSE 0 END
    + COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM jsonb_array_elements(v_invited) AS m
      WHERE (m->>'userId')::text <> v_user_id
        AND (m->>'participantType') = 'PLAYER'
    ), 0);

  -- ── INSERT ──────────────────────────────────────────────

  INSERT INTO game_sessions (
    game_session_id,
    session_name,
    session_description,
    scenario_id,
    keeper_id,
    created_by_id,
    session_phase,
    scheduled_at,
    recruited_player_count,
    max_participant_count,
    remaining_seat_count,
    tools,
    is_beginner_friendly,
    visibility
  ) VALUES (
    p_game_session_id,
    p_session_name,
    p_session_description,
    p_scenario_id,
    CASE
      WHEN p_creator_participant_type = 'KEEPER' THEN v_user_id
      ELSE NULL
    END,
    v_user_id,
    'RECRUITING',
    p_scheduled_at,
    p_recruited_player_count,
    v_initial_confirmed_non_spectator_count + v_requested_player_seats,
    -- トリガーが初期 PLAYER を差し引くため、その分を上乗せ
    v_requested_player_seats + v_initial_confirmed_player_count,
    p_tools,
    p_is_beginner_friendly,
    p_visibility
  );

  -- 作成者を参加者として追加
  INSERT INTO session_participants (
    session_id,
    user_id,
    participant_type,
    participant_status,
    applied_at,
    approved_at
  ) VALUES (
    p_game_session_id,
    v_user_id,
    p_creator_participant_type,
    'CONFIRMED',
    now(),
    now()
  );

  -- 初期候補日時の登録
  IF jsonb_array_length(v_initial_time_blocks) > 0 THEN
    INSERT INTO session_availability_time_blocks (
      availability_time_block_id,
      session_id,
      user_id,
      start_at,
      end_at
    )
    SELECT
      (s->>'availabilityTimeBlockId')::text,
      p_game_session_id,
      v_user_id,
      (s->>'startAt')::timestamptz,
      (s->>'endAt')::timestamptz
    FROM jsonb_array_elements(v_initial_time_blocks) AS s
    WHERE COALESCE(trim(s->>'startAt'), '') <> ''
      AND COALESCE(trim(s->>'endAt'), '') <> '';
  END IF;

  -- 招待メンバーの追加
  IF jsonb_array_length(v_invited) > 0 THEN
    INSERT INTO session_participants (
      session_id,
      user_id,
      participant_type,
      participant_status,
      applied_at,
      approved_at
    )
    SELECT
      p_game_session_id,
      (m->>'userId')::text,
      (m->>'participantType')::participant_type,
      'CONFIRMED',
      now(),
      now()
    FROM jsonb_array_elements(v_invited) AS m
    WHERE (m->>'userId')::text <> v_user_id;
  END IF;

  -- ── 結果返却 ────────────────────────────────────────────

  RETURN QUERY
    SELECT
      gs.game_session_id::text,
      gs.session_name,
      gs.session_phase,
      gs.scenario_id::text,
      gs.scheduled_at,
      gs.recruited_player_count,
      gs.tools,
      gs.is_beginner_friendly,
      gs.visibility
    FROM game_sessions gs
    WHERE gs.game_session_id = p_game_session_id;
END;
$$;

-- 7-4. replace_availability_time_blocks
CREATE FUNCTION replace_availability_time_blocks(
  p_session_id TEXT,
  p_user_id TEXT,
  p_time_blocks JSONB
)
RETURNS SETOF session_availability_time_blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 既存の候補日時を削除
  DELETE FROM session_availability_time_blocks
  WHERE session_id = p_session_id
    AND user_id = p_user_id;

  -- 新しい候補日時がある場合のみ挿入
  IF p_time_blocks IS NOT NULL AND jsonb_array_length(p_time_blocks) > 0 THEN
    RETURN QUERY
      INSERT INTO session_availability_time_blocks (
        availability_time_block_id,
        session_id,
        user_id,
        start_at,
        end_at
      )
      SELECT
        (s->>'availabilityTimeBlockId')::text,
        p_session_id,
        p_user_id,
        (s->>'startAt')::timestamptz,
        (s->>'endAt')::timestamptz
      FROM jsonb_array_elements(p_time_blocks) AS s
      RETURNING *;
  END IF;

  RETURN;
END;
$$;

-- 7-5. replace_confirmed_schedule_time_blocks
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
BEGIN
  -- game_schedules 親レコードの upsert
  INSERT INTO game_schedules (session_id, schedule_date, schedule_phase)
  VALUES (p_session_id, p_schedule_date, 'CONFIRMED')
  ON CONFLICT (session_id) DO UPDATE
    SET schedule_date = EXCLUDED.schedule_date,
        schedule_phase = EXCLUDED.schedule_phase;

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

-- ============================================================
-- 8. トリガー再作成 (1件)
-- ============================================================

CREATE TRIGGER trg_sync_remaining_seats_on_participants
  AFTER INSERT OR UPDATE OF participant_type, participant_status OR DELETE
  ON public.session_participants
  FOR EACH ROW
  EXECUTE FUNCTION sync_remaining_seats_on_participants();

-- ============================================================
-- 9. RLS ポリシー再作成 (8件)
-- ============================================================

-- 9-1. session_availability_time_blocks のポリシー

DROP POLICY IF EXISTS session_availability_slots_select
  ON public.session_availability_time_blocks;
DROP POLICY IF EXISTS session_availability_slots_insert
  ON public.session_availability_time_blocks;
DROP POLICY IF EXISTS session_availability_slots_update
  ON public.session_availability_time_blocks;
DROP POLICY IF EXISTS session_availability_slots_delete
  ON public.session_availability_time_blocks;

CREATE POLICY session_availability_time_blocks_select
ON public.session_availability_time_blocks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = session_availability_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR EXISTS (
          SELECT 1
          FROM public.session_participants sp
          WHERE sp.session_id = gs.game_session_id
            AND sp.user_id = public.current_app_user_id()
            AND sp.participant_status = 'CONFIRMED'
        )
      )
  )
);

CREATE POLICY session_availability_time_blocks_insert
ON public.session_availability_time_blocks
FOR INSERT
WITH CHECK (
  user_id = public.current_app_user_id()
  AND EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = session_availability_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR EXISTS (
          SELECT 1
          FROM public.session_participants sp
          WHERE sp.session_id = gs.game_session_id
            AND sp.user_id = public.current_app_user_id()
            AND sp.participant_status = 'CONFIRMED'
        )
      )
  )
);

CREATE POLICY session_availability_time_blocks_update
ON public.session_availability_time_blocks
FOR UPDATE
USING (user_id = public.current_app_user_id())
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY session_availability_time_blocks_delete
ON public.session_availability_time_blocks
FOR DELETE
USING (user_id = public.current_app_user_id());

-- 9-2. game_schedule_time_blocks のポリシー

DROP POLICY IF EXISTS game_schedule_slots_select
  ON public.game_schedule_time_blocks;
DROP POLICY IF EXISTS game_schedule_slots_insert
  ON public.game_schedule_time_blocks;
DROP POLICY IF EXISTS game_schedule_slots_update
  ON public.game_schedule_time_blocks;
DROP POLICY IF EXISTS game_schedule_slots_delete
  ON public.game_schedule_time_blocks;

CREATE POLICY game_schedule_time_blocks_select
ON public.game_schedule_time_blocks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR EXISTS (
          SELECT 1
          FROM public.session_participants sp
          WHERE sp.session_id = gs.game_session_id
            AND sp.user_id = public.current_app_user_id()
            AND sp.participant_status = 'CONFIRMED'
        )
      )
  )
);

CREATE POLICY game_schedule_time_blocks_insert
ON public.game_schedule_time_blocks
FOR INSERT
WITH CHECK (
  created_by = public.current_app_user_id()
  AND
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
);

CREATE POLICY game_schedule_time_blocks_update
ON public.game_schedule_time_blocks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
)
WITH CHECK (
  created_by = public.current_app_user_id()
  AND
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
);

CREATE POLICY game_schedule_time_blocks_delete
ON public.game_schedule_time_blocks
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_time_blocks.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
);

-- ============================================================
-- 10. RPC 権限設定
-- ============================================================

-- adjust_session_remaining_seats: 直接呼び出し禁止（トリガー経由のみ）
REVOKE ALL ON FUNCTION adjust_session_remaining_seats(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION adjust_session_remaining_seats(TEXT, INTEGER)
  FROM anon, authenticated, service_role;

-- create_session_transaction: authenticated + service_role のみ
REVOKE ALL ON FUNCTION create_session_transaction(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP, INTEGER, TEXT, BOOLEAN,
  session_visibility, participant_type, JSONB, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_session_transaction(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP, INTEGER, TEXT, BOOLEAN,
  session_visibility, participant_type, JSONB, JSONB
) TO authenticated, service_role;

-- replace_availability_time_blocks
REVOKE ALL ON FUNCTION replace_availability_time_blocks(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_availability_time_blocks(TEXT, TEXT, JSONB)
  TO authenticated, service_role;

-- replace_confirmed_schedule_time_blocks
REVOKE ALL ON FUNCTION replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMPTZ)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_confirmed_schedule_time_blocks(TEXT, TEXT, JSONB, TIMESTAMPTZ)
  TO authenticated, service_role;
