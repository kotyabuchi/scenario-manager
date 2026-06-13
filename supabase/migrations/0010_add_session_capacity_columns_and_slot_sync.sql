-- セッション定員（固定）と残りPL募集枠（可変）を分離して管理する
-- - max_participant_count: 見学を除く定員（GM/KP + PL）
-- - remaining_player_slot_count: 残りPL募集枠

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS max_participant_count INTEGER,
  ADD COLUMN IF NOT EXISTS remaining_player_slot_count INTEGER;

-- 既存データの初期化:
-- 現行の recruited_player_count を「募集時のPL募集人数」とみなし、
-- 現在の確定済み（KEEPER/PLAYER）人数を加算して max_participant_count を推定する。
WITH confirmed_non_spectator AS (
  SELECT
    sp.session_id,
    COUNT(*)::INTEGER AS confirmed_count
  FROM session_participants sp
  WHERE sp.participant_status = 'CONFIRMED'
    AND sp.participant_type IN ('KEEPER', 'PLAYER')
  GROUP BY sp.session_id
)
UPDATE game_sessions gs
SET
  max_participant_count = COALESCE(cns.confirmed_count, 0) + GREATEST(COALESCE(gs.recruited_player_count, 0), 0),
  remaining_player_slot_count = GREATEST(COALESCE(gs.recruited_player_count, 0), 0)
FROM (
  SELECT game_session_id
  FROM game_sessions
) target
LEFT JOIN confirmed_non_spectator cns
  ON cns.session_id = target.game_session_id
WHERE gs.game_session_id = target.game_session_id
  AND (gs.max_participant_count IS NULL OR gs.remaining_player_slot_count IS NULL);

ALTER TABLE game_sessions
  ALTER COLUMN max_participant_count SET DEFAULT 0,
  ALTER COLUMN remaining_player_slot_count SET DEFAULT 0;

UPDATE game_sessions
SET
  max_participant_count = COALESCE(max_participant_count, 0),
  remaining_player_slot_count = COALESCE(remaining_player_slot_count, 0)
WHERE max_participant_count IS NULL
   OR remaining_player_slot_count IS NULL;

ALTER TABLE game_sessions
  ALTER COLUMN max_participant_count SET NOT NULL,
  ALTER COLUMN remaining_player_slot_count SET NOT NULL;

ALTER TABLE game_sessions
  DROP CONSTRAINT IF EXISTS game_sessions_max_participant_count_non_negative,
  DROP CONSTRAINT IF EXISTS game_sessions_remaining_player_slot_count_non_negative;

ALTER TABLE game_sessions
  ADD CONSTRAINT game_sessions_max_participant_count_non_negative
    CHECK (max_participant_count >= 0),
  ADD CONSTRAINT game_sessions_remaining_player_slot_count_non_negative
    CHECK (remaining_player_slot_count >= 0);

CREATE OR REPLACE FUNCTION adjust_session_remaining_player_slots(
  p_session_id TEXT,
  p_delta INTEGER
) RETURNS void AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  IF p_session_id IS NULL OR p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_delta > 0 THEN
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

  UPDATE game_sessions
  SET remaining_player_slot_count = COALESCE(remaining_player_slot_count, 0) + ABS(p_delta)
  WHERE game_session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

  -- create_session_with_candidates での初期INSERT（CONFIRMEDな作成者/招待者）では
  -- remaining_player_slot_count を直接セット済みのため、INSERT は同期対象外とする。
  IF TG_OP = 'UPDATE' THEN
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

DROP TRIGGER IF EXISTS trg_sync_remaining_player_slots_on_participants
  ON session_participants;

CREATE TRIGGER trg_sync_remaining_player_slots_on_participants
AFTER INSERT OR UPDATE OF participant_type, participant_status OR DELETE
ON session_participants
FOR EACH ROW
EXECUTE FUNCTION sync_remaining_player_slots_on_participants();

-- セッション作成RPC: fixed max / remaining slots を初期値で保存する
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
      AND discord_id = v_auth_uid;

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
