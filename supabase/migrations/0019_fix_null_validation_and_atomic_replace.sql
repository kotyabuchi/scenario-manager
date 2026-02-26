-- 0019: NULLバリデーション修正 + 可用枠/確定枠のアトミック置換RPC
--
-- Issue 4: create_session_transaction の NULL 判定漏れ修正
--   - availabilitySlotId が NULL の場合 v_invalid_slot_id も NULL になり
--     IS NOT NULL チェックをすり抜ける問題を修正
--   - invitedMembers[].userId が NULL の場合 NULL <> v_user_id が
--     NULL 扱いで存在確認から漏れる問題を修正
--
-- Issue 5: 可用枠/確定枠の全置換をアトミック化
--   - replace_availability_slots: DELETE + INSERT を単一トランザクションで実行
--   - replace_confirmed_schedule_slots: 親レコード更新 + DELETE + INSERT を
--     単一トランザクションで実行

-- ============================================================
-- 1. create_session_transaction: NULL バリデーション修正
-- ============================================================

CREATE OR REPLACE FUNCTION create_session_transaction(
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
  p_initial_availability_slots JSONB,
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
  v_initial_slots JSONB;
  v_invited JSONB;
  v_requested_player_slots INTEGER := GREATEST(COALESCE(p_recruited_player_count, 0), 0);
  v_initial_confirmed_non_spectator_count INTEGER := 0;
  v_initial_confirmed_player_count INTEGER := 0;
  v_invalid_user_ids TEXT[];
  v_has_invalid_slot BOOLEAN := FALSE;
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

  v_initial_slots := COALESCE(p_initial_availability_slots, '[]'::jsonb);
  v_invited := COALESCE(p_invited_members, '[]'::jsonb);

  -- 可用枠IDのULID形式チェック（NULL値も不正として検出）
  IF jsonb_array_length(v_initial_slots) > 0 THEN
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_initial_slots) AS s
      WHERE COALESCE(trim(s->>'startAt'), '') <> ''
        AND COALESCE(trim(s->>'endAt'), '') <> ''
        AND (
          (s->>'availabilitySlotId') IS NULL
          OR char_length(s->>'availabilitySlotId') <> 26
          OR (s->>'availabilitySlotId') !~ '^[0-9A-Z]{26}$'
        )
    ) INTO v_has_invalid_slot;

    IF v_has_invalid_slot THEN
      RAISE EXCEPTION '可用枠IDの形式が不正です'
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
    remaining_player_slot_count,
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
    v_initial_confirmed_non_spectator_count + v_requested_player_slots,
    -- トリガーが初期 PLAYER を差し引くため、その分を上乗せ
    v_requested_player_slots + v_initial_confirmed_player_count,
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

  -- 初期可用枠の登録
  IF jsonb_array_length(v_initial_slots) > 0 THEN
    INSERT INTO session_availability_slots (
      availability_slot_id,
      session_id,
      user_id,
      start_at,
      end_at
    )
    SELECT
      (s->>'availabilitySlotId')::text,
      p_game_session_id,
      v_user_id,
      (s->>'startAt')::timestamptz,
      (s->>'endAt')::timestamptz
    FROM jsonb_array_elements(v_initial_slots) AS s
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

-- ============================================================
-- 2. replace_availability_slots: 可用枠のアトミック全置換
-- ============================================================

CREATE OR REPLACE FUNCTION replace_availability_slots(
  p_session_id TEXT,
  p_user_id TEXT,
  p_slots JSONB
)
RETURNS SETOF session_availability_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 既存の可用枠を削除
  DELETE FROM session_availability_slots
  WHERE session_id = p_session_id
    AND user_id = p_user_id;

  -- 新しい可用枠がある場合のみ挿入
  IF p_slots IS NOT NULL AND jsonb_array_length(p_slots) > 0 THEN
    RETURN QUERY
      INSERT INTO session_availability_slots (
        availability_slot_id,
        session_id,
        user_id,
        start_at,
        end_at
      )
      SELECT
        (s->>'availabilitySlotId')::text,
        p_session_id,
        p_user_id,
        (s->>'startAt')::timestamptz,
        (s->>'endAt')::timestamptz
      FROM jsonb_array_elements(p_slots) AS s
      RETURNING *;
  END IF;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION replace_availability_slots(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_availability_slots(TEXT, TEXT, JSONB) TO authenticated, service_role;

-- ============================================================
-- 3. replace_confirmed_schedule_slots: 確定枠のアトミック全置換
-- ============================================================

CREATE OR REPLACE FUNCTION replace_confirmed_schedule_slots(
  p_session_id TEXT,
  p_actor_user_id TEXT,
  p_slots JSONB,
  p_schedule_date TIMESTAMPTZ
)
RETURNS SETOF game_schedule_slots
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

  -- 既存の確定枠を削除
  DELETE FROM game_schedule_slots
  WHERE session_id = p_session_id;

  -- 新しい確定枠を挿入
  RETURN QUERY
    INSERT INTO game_schedule_slots (
      game_schedule_slot_id,
      session_id,
      start_at,
      end_at,
      slot_order,
      created_by
    )
    SELECT
      (s->>'gameScheduleSlotId')::text,
      p_session_id,
      (s->>'startAt')::timestamptz,
      (s->>'endAt')::timestamptz,
      (s->>'slotOrder')::integer,
      p_actor_user_id
    FROM jsonb_array_elements(p_slots) AS s
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION replace_confirmed_schedule_slots(TEXT, TEXT, JSONB, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_confirmed_schedule_slots(TEXT, TEXT, JSONB, TIMESTAMPTZ) TO authenticated, service_role;
