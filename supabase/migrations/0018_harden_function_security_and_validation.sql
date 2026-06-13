-- 0018: DB関数のセキュリティ強化・バリデーション追加・整合性改善
--
-- レビュー指摘対応:
-- [Critical] create_session_transaction: ULID形式バリデーション追加
-- [Warning]  adjust_session_remaining_player_slots: 直接RPC呼び出し禁止
-- [Warning]  current_app_user_id: anon ロール権限削除
-- [Warning]  update_feedback_comment_count: SECURITY DEFINER + 負値防止
-- [Warning]  update_feedback_vote_count: SECURITY DEFINER + RETURN統一
-- [Warning]  create_session_transaction: 招待メンバー存在確認追加
-- [Warning]  sync_remaining_player_slots_on_participants: INSERT対応で拡張性を担保

-- ============================================================
-- 1. adjust_session_remaining_player_slots
--    - anon/authenticated からの直接RPC呼び出しを禁止
--    - p_delta IS NULL の防御を追加
--    - COALESCE の非対称性を解消
-- ============================================================

REVOKE ALL ON FUNCTION adjust_session_remaining_player_slots(TEXT, INTEGER)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION adjust_session_remaining_player_slots(TEXT, INTEGER)
  FROM anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION adjust_session_remaining_player_slots(
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
    -- 枠を減らす（参加者の追加）
    UPDATE game_sessions
    SET remaining_player_slot_count = remaining_player_slot_count - p_delta
    WHERE game_session_id = p_session_id
      AND remaining_player_slot_count >= p_delta;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
      RAISE EXCEPTION '残りのプレイヤー募集枠がありません'
        USING ERRCODE = 'P0001';
    END IF;

    RETURN;
  END IF;

  -- 枠を戻す（参加者の離脱）
  UPDATE game_sessions
  SET remaining_player_slot_count = remaining_player_slot_count + ABS(p_delta)
  WHERE game_session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. current_app_user_id
--    - anon ロールから EXECUTE を剥奪
--    - 未ログインユーザーがRLSで NULL 比較するリスクを排除
-- ============================================================

REVOKE EXECUTE ON FUNCTION current_app_user_id() FROM anon;

-- ============================================================
-- 3. sync_remaining_player_slots_on_participants
--    - INSERT 時もデルタ計算に含め、create_session_transaction 以外の
--      直接 INSERT でも remaining_player_slot_count が正しく同期される
--    - create_session_transaction 側で初期値を調整して二重カウントを回避
-- ============================================================

CREATE OR REPLACE FUNCTION sync_remaining_player_slots_on_participants()
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
    -- INSERT 時: CONFIRMED PLAYER が追加されたら枠を1つ消費
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

  PERFORM adjust_session_remaining_player_slots(v_session_id, v_delta);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. create_session_transaction
--    - ULID形式バリデーション（セッションID・可用枠ID）
--    - 招待メンバーの存在確認
--    - INSERT トリガー対応に伴う remaining_player_slot_count 初期値調整
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
  v_invalid_slot_id TEXT;
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

  -- 可用枠IDのULID形式チェック
  IF jsonb_array_length(v_initial_slots) > 0 THEN
    SELECT (s->>'availabilitySlotId')::text INTO v_invalid_slot_id
    FROM jsonb_array_elements(v_initial_slots) AS s
    WHERE COALESCE(trim(s->>'startAt'), '') <> ''
      AND COALESCE(trim(s->>'endAt'), '') <> ''
      AND (
        (s->>'availabilitySlotId') IS NULL
        OR char_length(s->>'availabilitySlotId') <> 26
        OR (s->>'availabilitySlotId') !~ '^[0-9A-Z]{26}$'
      )
    LIMIT 1;

    IF v_invalid_slot_id IS NOT NULL THEN
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

  -- 招待メンバーの存在確認
  IF jsonb_array_length(v_invited) > 0 THEN
    SELECT array_agg((m->>'userId')::text)
    INTO v_invalid_user_ids
    FROM jsonb_array_elements(v_invited) AS m
    WHERE (m->>'userId')::text <> v_user_id
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.user_id = (m->>'userId')::text
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

-- create_session_transaction の権限: authenticated と service_role のみ
REVOKE ALL ON FUNCTION create_session_transaction(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP, INTEGER, TEXT, BOOLEAN,
  session_visibility, participant_type, JSONB, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_session_transaction(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP, INTEGER, TEXT, BOOLEAN,
  session_visibility, participant_type, JSONB, JSONB
) TO authenticated, service_role;

-- ============================================================
-- 5. update_feedback_comment_count
--    - SECURITY DEFINER + search_path 追加（RLS環境下でのカウント更新保証）
--    - GREATEST で負値防止（update_feedback_vote_count と統一）
-- ============================================================

CREATE OR REPLACE FUNCTION update_feedback_comment_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedbacks SET comment_count = comment_count + 1
    WHERE feedback_id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedbacks SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE feedback_id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 6. update_feedback_vote_count
--    - SECURITY DEFINER + search_path 追加
--    - RETURN NULL に統一（AFTER トリガーでは戻り値は無視される）
-- ============================================================

CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedbacks SET vote_count = vote_count + 1
    WHERE feedback_id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedbacks SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE feedback_id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
