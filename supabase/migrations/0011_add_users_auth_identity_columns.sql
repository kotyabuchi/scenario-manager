-- users テーブルの認証ID/Discord実IDを分離する
-- - auth_user_id: Supabase Auth UID (uuid)
-- - discord_account_id: Discord User ID (Snowflake, text)
-- 既存 discord_id は互換のため当面残置（現状は auth uid を保持している前提）

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS discord_account_id text;

-- Backfill auth_user_id:
-- 1. discord_id が UUID 形式 → そのままキャスト（正規ユーザー: auth uid が格納されている）
-- 2. discord_id が非UUID形式 → ランダムUUID生成（テストユーザー等）
-- 3. discord_id が NULL → ランダムUUID生成

UPDATE public.users
SET auth_user_id = discord_id::uuid
WHERE auth_user_id IS NULL
  AND discord_id IS NOT NULL
  AND discord_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

UPDATE public.users
SET auth_user_id = gen_random_uuid()
WHERE auth_user_id IS NULL;

-- 既存コード互換: auth_user_id 未指定の INSERT/UPDATE 時に discord_id から自動同期
CREATE OR REPLACE FUNCTION public.sync_users_auth_identity_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    IF NEW.discord_id IS NOT NULL
       AND NEW.discord_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN
      NEW.auth_user_id := NEW.discord_id::uuid;
    ELSE
      NEW.auth_user_id := gen_random_uuid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_users_auth_identity_columns
  ON public.users;

CREATE TRIGGER trg_sync_users_auth_identity_columns
BEFORE INSERT OR UPDATE OF discord_id, auth_user_id
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_users_auth_identity_columns();

ALTER TABLE public.users
  ALTER COLUMN auth_user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_auth_user_id_unique'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_auth_user_id_unique UNIQUE (auth_user_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_discord_account_id_unique'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_discord_account_id_unique UNIQUE (discord_account_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx
  ON public.users USING btree (auth_user_id);

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.user_id
  INTO v_user_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO service_role;

