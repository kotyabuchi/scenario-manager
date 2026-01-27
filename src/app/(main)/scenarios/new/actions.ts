'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import {
  checkDistributeUrlDuplicate,
  checkScenarioNameDuplicate,
  createScenario,
  getUserByDiscordId,
} from '../adapter';
import { scenarioFormSchema } from './_components/schema';

import { checkRateLimit } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { ScenarioFormValues } from './_components/schema';

type CreateScenarioResult = {
  scenarioId: string;
};

/**
 * シナリオを作成するServer Action
 */
export const createScenarioAction = async (
  input: ScenarioFormValues,
): Promise<Result<CreateScenarioResult>> => {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // Zodバリデーション
  const parsed = scenarioFormSchema.safeParse(input);
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

  // レートリミットチェック
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

  // 配布URLの重複チェック
  if (!isNil(parsed.data.distributeUrl)) {
    const urlDuplicateResult = await checkDistributeUrlDuplicate({
      distributeUrl: parsed.data.distributeUrl,
    });

    if (!urlDuplicateResult.success) {
      return err(urlDuplicateResult.error);
    }

    if (urlDuplicateResult.data.isDuplicate) {
      return err(new Error('この配布URLのシナリオは既に登録されています'));
    }
  }

  // シナリオ作成
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
    },
    userId,
  );

  if (!createResult.success) {
    return err(createResult.error);
  }

  // キャッシュの再検証
  revalidatePath('/scenarios');

  return ok({ scenarioId: createResult.data.scenarioId });
};
