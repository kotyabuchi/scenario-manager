'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import {
  getAllSystems,
  getUserByDiscordId,
  searchScenarios,
} from '../../scenarios/adapter';
import { createSession } from './adapter';
import { sessionFormSchema } from './schema';

import { createClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type { ScenarioSummary } from './interface';
import type { SessionFormValues } from './schema';

type UserRow = Database['public']['Tables']['users']['Row'];

/** ユーザー検索結果の型 */
export type UserSummary = Pick<
  UserRow,
  'user_id' | 'user_name' | 'nickname' | 'image'
>;

type CreateSessionActionResult = {
  gameSessionId: string;
};

/**
 * セッションを作成するServer Action
 *
 * 要件: requirements-session-flow.md Section 3
 * - US-S101: シナリオ未定でも募集可能
 * - US-S102: 日程未定でも募集可能
 * - US-S103: 人数未定でも募集可能
 */
export const createSessionAction = async (
  input: SessionFormValues,
): Promise<Result<CreateSessionActionResult>> => {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  // Zodバリデーション
  const parsed = sessionFormSchema.safeParse(input);
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

  // セッション作成
  const createResult = await createSession(parsed.data, userResult.data.userId);

  if (!createResult.success) {
    return err(createResult.error);
  }

  // キャッシュの再検証
  revalidatePath('/sessions');

  return ok({ gameSessionId: createResult.data.gameSessionId });
};

/**
 * セッション作成後にリダイレクトするServer Action
 */
export const createSessionAndRedirect = async (
  input: SessionFormValues,
): Promise<void> => {
  const result = await createSessionAction(input);

  if (result.success) {
    redirect(`/sessions/${result.data.gameSessionId}`);
  }

  // エラー時はフォームに戻る（エラーはクライアント側で処理）
};

/**
 * ユーザーを名前で検索するServer Action
 *
 * セキュリティ:
 * - 認証必須
 * - 2文字未満のクエリは空配列を即座に返す（ユーザー列挙攻撃の防止）
 * - 上限10件
 */
export const searchUsersAction = async (
  query: string,
): Promise<Result<UserSummary[]>> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  if (query.length < 2) {
    return ok([]);
  }

  const escaped = query.replace(/%/g, '\\%').replace(/_/g, '\\_');

  const { data, error } = await supabase
    .from('users')
    .select('user_id, user_name, nickname, image')
    .or(`user_name.ilike.%${escaped}%,nickname.ilike.%${escaped}%`)
    .limit(10);

  if (error) {
    return err(new Error('ユーザーの検索に失敗しました'));
  }

  return ok(data);
};

/**
 * セッション作成フォーム用のシナリオ検索Server Action
 *
 * 既存の `searchScenarios` を内部で呼び出し、
 * 結果を `ScenarioSummary[]` に変換して返す。
 */
export const searchScenariosForSessionAction = async (params: {
  scenarioName?: string;
  systemId?: string;
}): Promise<Result<ScenarioSummary[]>> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  const searchParams = {
    ...(params.scenarioName ? { scenarioName: params.scenarioName } : {}),
    ...(params.systemId ? { systemIds: [params.systemId] } : {}),
  };

  const result = await searchScenarios(searchParams, 'newest', 20, 0);

  if (!result.success) {
    return err(result.error);
  }

  const summaries: ScenarioSummary[] = result.data.scenarios.map((s) => ({
    scenarioId: s.scenarioId,
    name: s.name,
    minPlayer: s.minPlayer,
    maxPlayer: s.maxPlayer,
    minPlaytime: s.minPlaytime,
    maxPlaytime: s.maxPlaytime,
    systemName: s.system.name,
  }));

  return ok(summaries);
};

/** システム一覧の型 */
export type SystemSummary = {
  systemId: string;
  name: string;
};

/**
 * シナリオシステム一覧を取得するServer Action
 */
export const getSystemsAction = async (): Promise<Result<SystemSummary[]>> => {
  const result = await getAllSystems();

  if (!result.success) {
    return err(result.error);
  }

  return ok(
    result.data.map((s) => ({
      systemId: s.systemId,
      name: s.name,
    })),
  );
};
