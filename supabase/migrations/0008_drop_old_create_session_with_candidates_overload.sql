-- 0006 changed the argument type of p_scheduled_at from TIMESTAMPTZ to TIMESTAMP.
-- In PostgreSQL, CREATE OR REPLACE FUNCTION cannot change argument types, so the old
-- function remained as an overload. Drop the old TIMESTAMPTZ signature to remove
-- ambiguity in RPC resolution.

DROP FUNCTION IF EXISTS public.create_session_with_candidates(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TIMESTAMPTZ,
  INTEGER,
  TEXT,
  BOOLEAN,
  public.session_visibility,
  public.participant_type,
  JSONB,
  JSONB
);
