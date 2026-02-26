'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import {
  getScenarioById,
  getUserByAuthUserId,
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
  const userResult = await getUserByAuthUserId(authUser.id);
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
 * 成功時はリダイレクト、失敗時はResult<void>でエラーを返す
 */
export const createSessionAndRedirect = async (
  input: SessionFormValues,
): Promise<Result<void>> => {
  const result = await createSessionAction(input);

  if (!result.success) {
    return err(result.error);
  }

  redirect(`/sessions/${result.data.gameSessionId}`);
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
  scenarioId?: string;
  smartFilters?: {
    unplayedByPlayers: boolean;
    canKeeper: boolean;
    ownedByMembers: boolean;
  };
  invitedMembers?: Array<{
    userId: string;
    participantType: 'PLAYER' | 'SPECTATOR' | 'KEEPER';
  }>;
}): Promise<Result<ScenarioSummary[]>> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return err(new Error('ログインが必要です'));
  }

  if (params.scenarioId) {
    const scenarioResult = await getScenarioById(params.scenarioId);
    if (!scenarioResult.success) {
      return err(scenarioResult.error);
    }

    if (!scenarioResult.data) {
      return ok([]);
    }

    const scenario = scenarioResult.data;
    const summary: ScenarioSummary = {
      scenarioId: scenario.scenarioId,
      name: scenario.name,
      minPlayer: scenario.minPlayer,
      maxPlayer: scenario.maxPlayer,
      minPlaytime: scenario.minPlaytime,
      maxPlaytime: scenario.maxPlaytime,
      systemName: scenario.system.name,
    };
    const filtered = await applySmartFilters(
      [summary],
      params.smartFilters,
      params.invitedMembers ?? [],
      supabase,
    );
    return ok(filtered);
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

  const filtered = await applySmartFilters(
    summaries,
    params.smartFilters,
    params.invitedMembers ?? [],
    supabase,
  );
  return ok(filtered);
};

const applySmartFilters = async (
  scenarios: ScenarioSummary[],
  filters:
    | {
        unplayedByPlayers: boolean;
        canKeeper: boolean;
        ownedByMembers: boolean;
      }
    | null
    | undefined,
  invitedMembers: Array<{
    userId: string;
    participantType: 'PLAYER' | 'SPECTATOR' | 'KEEPER';
  }>,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ScenarioSummary[]> => {
  if (!filters) return scenarios;
  if (scenarios.length === 0) return scenarios;
  if (
    !filters.unplayedByPlayers &&
    !filters.canKeeper &&
    !filters.ownedByMembers
  ) {
    return scenarios;
  }

  const playerIds = Array.from(
    new Set(
      invitedMembers
        .filter((m) => m.participantType === 'PLAYER')
        .map((m) => m.userId),
    ),
  );
  const keeperIds = Array.from(
    new Set(
      invitedMembers
        .filter((m) => m.participantType === 'KEEPER')
        .map((m) => m.userId),
    ),
  );
  const memberIds = Array.from(new Set(invitedMembers.map((m) => m.userId)));

  const preferenceUserIds = new Set<string>();
  if (filters.unplayedByPlayers) {
    for (const id of playerIds) preferenceUserIds.add(id);
  }
  if (filters.ownedByMembers) {
    for (const id of memberIds) preferenceUserIds.add(id);
  }
  if (filters.canKeeper) {
    for (const id of keeperIds) preferenceUserIds.add(id);
  }

  const prefMap = new Map<
    string,
    Map<
      string,
      { is_played: boolean; can_keeper: boolean; had_scenario: boolean }
    >
  >();

  if (preferenceUserIds.size > 0) {
    const scenarioIds = scenarios.map((s) => s.scenarioId);
    const { data: preferences, error } = await supabase
      .from('user_scenario_preferences')
      .select('scenario_id, user_id, is_played, can_keeper, had_scenario')
      .in('scenario_id', scenarioIds)
      .in('user_id', Array.from(preferenceUserIds));

    if (error) {
      return scenarios;
    }

    for (const pref of preferences ?? []) {
      const scenarioId = pref.scenario_id;
      const userId = pref.user_id;
      const current = prefMap.get(scenarioId) ?? new Map();
      current.set(userId, {
        is_played: pref.is_played,
        can_keeper: pref.can_keeper,
        had_scenario: pref.had_scenario,
      });
      prefMap.set(scenarioId, current);
    }
  }

  const getPref = (scenarioId: string, userId: string) =>
    prefMap.get(scenarioId)?.get(userId) ?? null;

  return scenarios.filter((scenario) => {
    const scenarioId = scenario.scenarioId;

    if (filters.unplayedByPlayers && playerIds.length > 0) {
      // preference レコードが存在しない場合は「未プレイ」として扱う（is_played のデフォルトは false）
      const allUnplayed = playerIds.every((userId) => {
        const pref = getPref(scenarioId, userId);
        return !(pref?.is_played ?? false);
      });
      if (!allUnplayed) return false;
    }

    if (filters.ownedByMembers && memberIds.length > 0) {
      const anyOwned = memberIds.some((userId) => {
        const pref = getPref(scenarioId, userId);
        return pref?.had_scenario === true;
      });
      if (!anyOwned) return false;
    }

    if (filters.canKeeper && keeperIds.length > 0) {
      const anyKeeperCan = keeperIds.some((userId) => {
        const pref = getPref(scenarioId, userId);
        return pref?.can_keeper === true;
      });
      if (!anyKeeperCan) return false;
    }

    return true;
  });
};
