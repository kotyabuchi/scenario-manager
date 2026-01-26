'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { createScenario, getUserByDiscordId } from '../adapter';
import { scenarioFormSchema } from './_components/schema';

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

  // ユーザーIDを取得
  const userResult = await getUserByDiscordId(authUser.id);
  if (!userResult.success) {
    return err(userResult.error);
  }

  if (isNil(userResult.data)) {
    return err(new Error('ユーザーが見つかりません'));
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
    userResult.data.userId,
  );

  if (!createResult.success) {
    return err(createResult.error);
  }

  // キャッシュの再検証
  revalidatePath('/scenarios');

  return ok({ scenarioId: createResult.data.scenarioId });
};
