-- 全員が提出する可用枠（時間帯）テーブル

CREATE TABLE IF NOT EXISTS public.session_availability_slots (
  availability_slot_id varchar(26) PRIMARY KEY NOT NULL,
  session_id varchar(26) NOT NULL,
  user_id varchar(26) NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT session_availability_slots_session_id_game_sessions_fkey
    FOREIGN KEY (session_id)
    REFERENCES public.game_sessions(game_session_id)
    ON DELETE CASCADE,
  CONSTRAINT session_availability_slots_user_id_users_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT session_availability_slots_time_order_check
    CHECK (start_at < end_at),
  CONSTRAINT session_availability_slots_start_30min_boundary_check
    CHECK ((MOD(EXTRACT(EPOCH FROM start_at)::numeric, 1800)) = 0),
  CONSTRAINT session_availability_slots_end_30min_boundary_check
    CHECK ((MOD(EXTRACT(EPOCH FROM end_at)::numeric, 1800)) = 0)
);

CREATE INDEX IF NOT EXISTS session_availability_slots_session_idx
  ON public.session_availability_slots USING btree (session_id);

CREATE INDEX IF NOT EXISTS session_availability_slots_session_user_idx
  ON public.session_availability_slots USING btree (session_id, user_id);

CREATE INDEX IF NOT EXISTS session_availability_slots_session_start_idx
  ON public.session_availability_slots USING btree (session_id, start_at);

CREATE INDEX IF NOT EXISTS session_availability_slots_session_end_idx
  ON public.session_availability_slots USING btree (session_id, end_at);

ALTER TABLE public.session_availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS session_availability_slots_select
  ON public.session_availability_slots;
DROP POLICY IF EXISTS session_availability_slots_insert
  ON public.session_availability_slots;
DROP POLICY IF EXISTS session_availability_slots_update
  ON public.session_availability_slots;
DROP POLICY IF EXISTS session_availability_slots_delete
  ON public.session_availability_slots;

CREATE POLICY session_availability_slots_select
ON public.session_availability_slots
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = session_availability_slots.session_id
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

CREATE POLICY session_availability_slots_insert
ON public.session_availability_slots
FOR INSERT
WITH CHECK (
  user_id = public.current_app_user_id()
  AND EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = session_availability_slots.session_id
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

CREATE POLICY session_availability_slots_update
ON public.session_availability_slots
FOR UPDATE
USING (user_id = public.current_app_user_id())
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY session_availability_slots_delete
ON public.session_availability_slots
FOR DELETE
USING (user_id = public.current_app_user_id());
