'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import {
  checkDistributeUrlDuplicate,
  checkScenarioNameDuplicate,
  createScenario,
  getUserByDiscordId,
} from '../adapter';
import { importFormSchema } from './_components/schema';

import { checkRateLimit } from '@/lib/rateLimit';
import { fetchAndParseScenario } from '@/lib/scenario-fetcher';
import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { ParsedScenario } from '@/lib/scenario-fetcher';
import type { ImportFormValues } from './_components/schema';

/**
 * URLを解析してシナリオ情報を取得するServer Action
 */
export const parseScenarioUrlAction = async (
  url: string,
): Promise<Result<ParsedScenario>> => {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // ユーザーIDとロールを取得
  const userResult = await getUserByDiscordId(authUser.id);
  if (!userResult.success) {
    return err(userResult.error);
  }

  if (isNil(userResult.data)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  const { userId, role } = userResult.data;

  // レートリミットチェック（URL解析: 1分5回）
  const rateLimitResult = await checkRateLimit({
    userId,
    action: 'parse_scenario_url',
    userRole: role,
  });

  if (!rateLimitResult.success) {
    return err(rateLimitResult.error);
  }

  if (!rateLimitResult.data.allowed) {
    return err(
      new Error(
        rateLimitResult.data.message ??
          'しばらく時間をおいてから再度お試しください',
      ),
    );
  }

  // 配布URLの重複チェック
  const urlDuplicateResult = await checkDistributeUrlDuplicate({
    distributeUrl: url,
  });

  if (!urlDuplicateResult.success) {
    return err(urlDuplicateResult.error);
  }

  if (urlDuplicateResult.data.isDuplicate) {
    return err(new Error('このURLのシナリオは既に登録されています'));
  }

  // URL解析
  return await fetchAndParseScenario(url);
};

/**
 * インポートしたシナリオを登録するServer Action
 */
export const createImportedScenarioAction = async (
  input: ImportFormValues,
): Promise<Result<{ scenarioId: string }>> => {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // Zodバリデーション
  const parsed = importFormSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
    );
  }

  // ユーザーIDとロールを取得
  const userResult = await getUserByDiscordId(authUser.id);
  if (!userResult.success) {
    return err(userResult.error);
  }

  if (isNil(userResult.data)) {
    return err(new Error('ユーザーが見つかりません'));
  }

  const { userId, role } = userResult.data;

  // レートリミットチェック（シナリオ作成: 1時間5件）
  const rateLimitResult = await checkRateLimit({
    userId,
    action: 'create_scenario',
    userRole: role,
  });

  if (!rateLimitResult.success) {
    return err(rateLimitResult.error);
  }

  if (!rateLimitResult.data.allowed) {
    return err(
      new Error(
        rateLimitResult.data.message ??
          'しばらく時間をおいてから再度お試しください',
      ),
    );
  }

  // シナリオ名の重複チェック
  const nameDuplicateResult = await checkScenarioNameDuplicate({
    name: parsed.data.name,
    scenarioSystemId: parsed.data.scenarioSystemId,
  });

  if (!nameDuplicateResult.success) {
    return err(nameDuplicateResult.error);
  }

  if (nameDuplicateResult.data.isDuplicate) {
    return err(new Error('同じシステムに同名のシナリオが既に登録されています'));
  }

  // シナリオ作成（ソース情報付き）
  const createResult = await createScenario(
    {
      name: parsed.data.name,
      scenarioSystemId: parsed.data.scenarioSystemId,
      handoutType: parsed.data.handoutType,
      author: parsed.data.author,
      description: parsed.data.description,
      minPlayer: parsed.data.minPlayer,
      maxPlayer: parsed.data.maxPlayer,
      minPlaytime: parsed.data.minPlaytime,
      maxPlaytime: parsed.data.maxPlaytime,
      scenarioImageUrl: parsed.data.scenarioImageUrl,
      distributeUrl: parsed.data.distributeUrl,
      tagIds: parsed.data.tagIds,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl,
      sourceFetchedAt: new Date().toISOString(),
    },
    userId,
  );

  if (!createResult.success) {
    return err(createResult.error);
  }

  revalidatePath('/scenarios');

  return ok({ scenarioId: createResult.data.scenarioId });
};
