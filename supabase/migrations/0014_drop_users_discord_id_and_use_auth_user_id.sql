-- users.discord_id (auth uid を暫定保持していた列) を廃止し、auth_user_id に完全移行する
-- あわせて create_session_with_candidates の認証ユーザー解決も auth_user_id 参照へ更新

CREATE OR REPLACE FUNCTION create_session_with_candidates(
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
  p_schedule_candidates JSONB,
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
  v_candidates JSONB;
  v_invited JSONB;
  v_requested_player_slots INTEGER := GREATEST(COALESCE(p_recruited_player_count, 0), 0);
  v_initial_confirmed_non_spectator_count INTEGER := 0;
BEGIN
  v_candidates := COALESCE(p_schedule_candidates, '[]'::jsonb);
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

  IF jsonb_array_length(v_candidates) > 0 THEN
    INSERT INTO schedule_candidates (
      candidate_id,
      session_id,
      candidate_date,
      end_time,
      status,
      created_by
    )
    SELECT
      (c->>'candidateId')::text,
      p_game_session_id,
      (c->>'from')::timestamptz,
      NULLIF(c->>'to', '')::timestamptz,
      'CONFIRMED',
      v_user_id
    FROM jsonb_array_elements(v_candidates) AS c
    WHERE COALESCE(trim(c->>'from'), '') <> '';
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

DROP TRIGGER IF EXISTS trg_sync_users_auth_identity_columns ON public.users;
DROP FUNCTION IF EXISTS public.sync_users_auth_identity_columns();

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_discord_id_unique;

DROP INDEX IF EXISTS public.users_discord_idx;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS discord_id;
