-- catalogで確認した定義のうち、既存migrationからの再現に不足しているものを補う。
-- 列・triggerが既に存在する環境でも、同名定義の重複による失敗を避ける。

ALTER TABLE public.scenarios
  ADD COLUMN IF NOT EXISTS sort_playtime_asc integer
    GENERATED ALWAYS AS (COALESCE(min_playtime, max_playtime)) STORED,
  ADD COLUMN IF NOT EXISTS sort_playtime_desc integer
    GENERATED ALWAYS AS (COALESCE(max_playtime, min_playtime)) STORED;

-- 実catalogは0003のDEFAULT 'manual'を持たないため、既存値を変えずdefaultだけ合わせる。
ALTER TABLE public.scenarios
  ALTER COLUMN source_type DROP DEFAULT;

ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.game_sessions
  ALTER COLUMN session_description SET DEFAULT ''::text;

-- 関数本体は0018の定義とcatalogが一致しているため、接続するtriggerだけを補う。
-- 既存のcomment_count/vote_countを再集計せず、以後のINSERT/DELETEの増減を維持する。
CREATE OR REPLACE TRIGGER feedback_comments_count_trigger
  AFTER INSERT OR DELETE ON public.feedback_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_feedback_comment_count();

CREATE OR REPLACE TRIGGER trg_feedback_vote_count
  AFTER INSERT OR DELETE ON public.feedback_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_feedback_vote_count();
