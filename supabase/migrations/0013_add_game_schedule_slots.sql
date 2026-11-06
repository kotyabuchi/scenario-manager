-- 複数枠の日程確定を表現する子テーブル
-- 現行 game_schedules は session_id が PK のため、親参照も session_id で行う

CREATE TABLE IF NOT EXISTS public.game_schedule_slots (
  game_schedule_slot_id varchar(26) PRIMARY KEY NOT NULL,
  session_id varchar(26) NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  slot_order integer NOT NULL,
  created_by varchar(26) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT game_schedule_slots_session_id_game_schedules_fkey
    FOREIGN KEY (session_id)
    REFERENCES public.game_schedules(session_id)
    ON DELETE CASCADE,
  CONSTRAINT game_schedule_slots_created_by_users_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.users(user_id)
    ON DELETE RESTRICT,
  CONSTRAINT game_schedule_slots_time_order_check
    CHECK (start_at < end_at),
  CONSTRAINT game_schedule_slots_slot_order_positive_check
    CHECK (slot_order >= 1),
  CONSTRAINT game_schedule_slots_start_30min_boundary_check
    CHECK ((MOD(EXTRACT(EPOCH FROM start_at)::numeric, 1800)) = 0),
  CONSTRAINT game_schedule_slots_end_30min_boundary_check
    CHECK ((MOD(EXTRACT(EPOCH FROM end_at)::numeric, 1800)) = 0)
);

CREATE INDEX IF NOT EXISTS game_schedule_slots_session_idx
  ON public.game_schedule_slots USING btree (session_id);

CREATE INDEX IF NOT EXISTS game_schedule_slots_session_order_idx
  ON public.game_schedule_slots USING btree (session_id, slot_order);

CREATE INDEX IF NOT EXISTS game_schedule_slots_session_start_idx
  ON public.game_schedule_slots USING btree (session_id, start_at);

ALTER TABLE public.game_schedule_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_schedule_slots_select
  ON public.game_schedule_slots;
DROP POLICY IF EXISTS game_schedule_slots_insert
  ON public.game_schedule_slots;
DROP POLICY IF EXISTS game_schedule_slots_update
  ON public.game_schedule_slots;
DROP POLICY IF EXISTS game_schedule_slots_delete
  ON public.game_schedule_slots;

CREATE POLICY game_schedule_slots_select
ON public.game_schedule_slots
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_slots.session_id
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

CREATE POLICY game_schedule_slots_insert
ON public.game_schedule_slots
FOR INSERT
WITH CHECK (
  created_by = public.current_app_user_id()
  AND
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_slots.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
);

CREATE POLICY game_schedule_slots_update
ON public.game_schedule_slots
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_slots.session_id
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
    WHERE gs.game_session_id = game_schedule_slots.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
);

CREATE POLICY game_schedule_slots_delete
ON public.game_schedule_slots
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    WHERE gs.game_session_id = game_schedule_slots.session_id
      AND (
        gs.created_by_id = public.current_app_user_id()
        OR gs.keeper_id = public.current_app_user_id()
      )
  )
);
