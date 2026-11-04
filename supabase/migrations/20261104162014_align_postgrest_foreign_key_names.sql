-- 確認済cloud metadataのFK名へ揃える。PostgRESTの!constraint指定もAPI契約に含まれる。
-- 原証拠: test-results/quality/schema-catalog-evidence.json constraints
-- SHA256: 905e40bc85f2a1d9bd2313404a19a8d4ff1da6b0dbd8600441cd7cef1e868830
-- 列・参照先・削除動作は0001の定義と同じ。PKや制約の実体は変更しない。
SET LOCAL search_path = pg_catalog, public;

DO $migration$
DECLARE
  target record;
  observed record;
  matching_count integer;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('feedback_comments', 'feedback_comments_feedback_id_feedbacks_feedback_id_fk', 'feedback_comments_feedback_id_fkey', 'FOREIGN KEY (feedback_id) REFERENCES feedbacks(feedback_id) ON DELETE CASCADE'),
      ('feedback_comments', 'feedback_comments_user_id_users_user_id_fk', 'feedback_comments_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES users(user_id)'),
      ('feedback_votes', 'feedback_votes_feedback_id_feedbacks_feedback_id_fk', 'feedback_votes_feedback_id_fkey', 'FOREIGN KEY (feedback_id) REFERENCES feedbacks(feedback_id) ON DELETE CASCADE'),
      ('feedback_votes', 'feedback_votes_user_id_users_user_id_fk', 'feedback_votes_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE'),
      ('feedbacks', 'feedbacks_user_id_users_user_id_fk', 'feedbacks_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES users(user_id)'),
      ('notifications', 'notifications_user_id_users_user_id_fk', 'notifications_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE')
    ) AS mappings(table_name, old_name, cloud_name, expected_definition)
  LOOP
    SELECT count(*) INTO matching_count
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid = format('public.%I', target.table_name)::regclass
      AND constraint_row.conname IN (target.old_name, target.cloud_name);
    IF matching_count <> 1 THEN
      RAISE EXCEPTION 'FK name alignment requires exactly one known constraint on public.%', target.table_name;
    END IF;

    SELECT constraint_row.conname, constraint_row.contype, constraint_row.convalidated,
      pg_catalog.pg_get_constraintdef(constraint_row.oid) AS definition
    INTO observed
    FROM pg_catalog.pg_constraint AS constraint_row
    WHERE constraint_row.conrelid = format('public.%I', target.table_name)::regclass
      AND constraint_row.conname IN (target.old_name, target.cloud_name);
    IF observed.contype <> 'f' OR NOT observed.convalidated
      OR observed.definition <> target.expected_definition THEN
      RAISE EXCEPTION 'FK definition mismatch on public.%', target.table_name;
    END IF;

    -- cloud名が既にある環境では、定義一致を検証した上で何もしない。
    IF observed.conname = target.old_name THEN
      EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I',
        target.table_name, target.old_name, target.cloud_name);
    END IF;
  END LOOP;
END;
$migration$;
