-- 0015 の差分 migration
-- create_session_transaction を再定義し、sessions/new の複数日時入力を
-- 旧 schedule_candidates ではなく session_availability_slots
-- （作成者の初期可用枠）として保存する。
--
-- PostgreSQL の関数は一部差分更新ができないため、CREATE OR REPLACE で
-- 関数本文を再定義する（変更点は以下）。
-- 1) 引数名: p_initial_schedule_candidates -> p_initial_availability_slots
-- 2) 保存先: schedule_candidates -> session_availability_slots
-- 3) payloadキー: candidateId/from/to -> availabilitySlotId/startAt/endAt
--
-- パラメータ名の変更は CREATE OR REPLACE では不可のため DROP → CREATE で再定義する

DROP FUNCTION IF EXISTS create_session_transaction(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP, INTEGER, TEXT, BOOLEAN,
  session_visibility, participant_type, JSONB, JSONB
);

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
  p_initial_availability_slots JSONB,
  p_invited_members JSONB
) RETURNS TABLE (
  game_session_id TEXT,
  session_name TEXT,
  session_phase session_phase,
  scenario_id TEXT,
  scheduled_at TIMESTAMP,
  recruited_player_count INTEGER,
  tools TEXT,
  is_beginner_friendly BOOLEAN,
  visibility session_visibility
) AS $$
DECLARE
  v_auth_uid TEXT := auth.uid()::text;
  v_auth_role TEXT := auth.role();
  v_user_id TEXT;
  v_initial_slots JSONB;
  v_invited JSONB;
  v_requested_player_slots INTEGER := GREATEST(COALESCE(p_recruited_player_count, 0), 0);
  v_initial_confirmed_non_spectator_count INTEGER := 0;
BEGIN
  v_initial_slots := COALESCE(p_initial_availability_slots, '[]'::jsonb);
  v_invited := COALESCE(p_invited_members, '[]'::jsonb);

  IF v_auth_role = 'service_role' THEN
    v_user_id := p_user_id;
  ELSE
    IF v_auth_uid IS NULL THEN
      RAISE EXCEPTION 'ログインが必要です';
    END IF;

    SELECT user_id INTO v_user_id
    FROM users
    WHERE user_id = p_user_id
      AND auth_user_id = v_auth_uid::uuid;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'ユーザーが見つかりません';
    END IF;
  END IF;

  v_initial_confirmed_non_spectator_count :=
    CASE WHEN p_creator_participant_type IN ('KEEPER', 'PLAYER') THEN 1 ELSE 0 END
    + COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM jsonb_array_elements(v_invited) AS m
      WHERE (m->>'userId')::text <> v_user_id
        AND (m->>'participantType') IN ('KEEPER', 'PLAYER')
    ), 0);

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
    v_requested_player_slots,
    p_tools,
    p_is_beginner_friendly,
    p_visibility
  );

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
