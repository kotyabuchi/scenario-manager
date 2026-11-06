-- 空の専用環境へ投入する合成master。実ユーザー・シナリオは取り込まない。
-- actorとケース固有データは各テストのfixtureが所有する。
INSERT INTO public.scenario_systems (system_id, name)
VALUES ('00000000000000000000000001', 'E2Eテストシステム')
ON CONFLICT (system_id) DO UPDATE SET name = EXCLUDED.name;
