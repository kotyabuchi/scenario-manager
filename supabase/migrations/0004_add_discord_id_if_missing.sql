-- discord_idカラムが存在しない場合のみ追加する
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'discord_id'
  ) THEN
    ALTER TABLE "public"."users" ADD COLUMN "discord_id" text NOT NULL DEFAULT '';
    ALTER TABLE "public"."users" ADD CONSTRAINT "users_discord_id_unique" UNIQUE ("discord_id");
    CREATE INDEX "users_discord_idx" ON "public"."users" USING btree ("discord_id");
  END IF;
END $$;
