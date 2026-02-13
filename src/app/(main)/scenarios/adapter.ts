import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type {
  CreateScenarioInput,
  ScenarioSystem,
  ScenarioWithRelations,
  SearchParams,
  SearchResult,
  SortOption,
  Tag,
} from './interface';

/**
 * タグANDフィルタ: 全タグを持つシナリオIDを取得
 */
const getTagFilteredIds = async (
  supabase: Awaited<ReturnType<typeof createDbClient>>,
  tagIds: string[],
): Promise<string[] | null> => {
  const { data: tagData } = await supabase
    .from('scenario_tags')
    .select('scenario_id')
    .in('tag_id', tagIds);

  if (!tagData) return null;

  const scenarioTagCounts = new Map<string, number>();
  for (const row of tagData) {
    const count = scenarioTagCounts.get(row.scenario_id) ?? 0;
    scenarioTagCounts.set(row.scenario_id, count + 1);
  }

  const ids: string[] = [];
  for (const [scenarioId, count] of scenarioTagCounts) {
    if (count >= tagIds.length) {
      ids.push(scenarioId);
    }
  }
  return ids;
};

/**
 * ベースクエリにフィルタを適用する
 */
const applyFilters = <
  T extends {
    in: (col: string, values: string[]) => T;
    ilike: (col: string, pattern: string) => T;
    lte: (col: string, value: number) => T;
    gte: (col: string, value: number) => T;
  },
>(
  query: T,
  params: SearchParams,
  tagFilteredScenarioIds: string[] | null,
): T => {
  let q = query;

  if (!isNil(params.systemIds) && params.systemIds.length > 0) {
    q = q.in('scenario_system_id', params.systemIds);
  }

  if (!isNil(params.scenarioName) && params.scenarioName.trim() !== '') {
    q = q.ilike('name', `%${params.scenarioName}%`);
  }

  if (!isNil(params.playerCount)) {
    q = q
      .lte('min_player', params.playerCount.max)
      .gte('max_player', params.playerCount.min);
  }

  if (!isNil(params.playtime)) {
    const minMinutes = params.playtime.min * 60;
    const maxMinutes = params.playtime.max * 60;
    q = q.lte('min_playtime', maxMinutes).gte('max_playtime', minMinutes);
  }

  if (tagFilteredScenarioIds) {
    q = q.in('scenario_id', tagFilteredScenarioIds);
  }

  return q;
};

/**
 * シナリオを検索する
 */
export const searchScenarios = async (
  params: SearchParams,
  sort: SortOption = 'newest',
  limit = 20,
  offset = 0,
): Promise<Result<SearchResult>> => {
  try {
    const supabase = await createDbClient();

    // タグANDフィルタ
    let tagFilteredScenarioIds: string[] | null = null;
    if (!isNil(params.tagIds) && params.tagIds.length > 0) {
      const ids = await getTagFilteredIds(supabase, params.tagIds);
      if (ids !== null && ids.length === 0) {
        return ok({ scenarios: [], totalCount: 0 });
      }
      tagFilteredScenarioIds = ids;
    }

    // 全ソートオプションはDB側ソート＋ページネーション
    return searchWithDbSort(
      supabase,
      params,
      tagFilteredScenarioIds,
      sort,
      limit,
      offset,
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * DB側ソート
 */
const searchWithDbSort = async (
  supabase: Awaited<ReturnType<typeof createDbClient>>,
  params: SearchParams,
  tagFilteredScenarioIds: string[] | null,
  sort: SortOption,
  limit: number,
  offset: number,
): Promise<Result<SearchResult>> => {
  let query = supabase
    .from('scenarios')
    .select(
      '*, system:scenario_systems(*), scenarioTags:scenario_tags(tag:tags(*))',
      { count: 'exact' },
    );

  query = applyFilters(query, params, tagFilteredScenarioIds);

  // ソート（生成カラムで COALESCE 済みの値を使用、scenario_id をタイブレーカーに）
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'playtime_asc':
      query = query.order('sort_playtime_asc', {
        ascending: true,
        nullsFirst: false,
      });
      break;
    case 'playtime_desc':
      query = query.order('sort_playtime_desc', {
        ascending: false,
        nullsFirst: false,
      });
      break;
  }
  query = query
    .order('scenario_id', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return err(new Error(error.message));
  }

  return ok({
    scenarios: (data ?? []).map(
      (s) =>
        camelCaseKeys(s as Record<string, unknown>) as ScenarioWithRelations,
    ),
    totalCount: count ?? 0,
  });
};

/**
 * シナリオをIDで取得する
 */
export const getScenarioById = async (
  id: string,
): Promise<Result<ScenarioWithRelations | null>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('scenarios')
      .select(
        '*, system:scenario_systems(*), scenarioTags:scenario_tags(tag:tags(*))',
      )
      .eq('scenario_id', id)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      data
        ? (camelCaseKeys(
            data as Record<string, unknown>,
          ) as ScenarioWithRelations)
        : null,
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 全システムを取得する
 */
export const getAllSystems = async (): Promise<Result<ScenarioSystem[]>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('scenario_systems')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as ScenarioSystem,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 全タグを取得する
 */
export const getAllTags = async (): Promise<Result<Tag[]>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as Tag,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * Discord IDでユーザーを取得する
 */
export const getUserByDiscordId = async (
  discordId: string,
): Promise<Result<{ userId: string; role: string } | null>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    return ok(data ? { userId: data.user_id, role: data.role } : null);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('ユーザーの取得に失敗しました'),
    );
  }
};

/**
 * 同一システム内でシナリオ名が重複しているかチェック
 */
export const checkScenarioNameDuplicate = async (params: {
  name: string;
  scenarioSystemId: string;
}): Promise<Result<{ isDuplicate: boolean; existingScenarioId?: string }>> => {
  try {
    const supabase = await createDbClient();
    const { data: existing } = await supabase
      .from('scenarios')
      .select('scenario_id')
      .eq('scenario_system_id', params.scenarioSystemId)
      .eq('name', params.name)
      .maybeSingle();

    if (existing) {
      return ok({
        isDuplicate: true,
        existingScenarioId: existing.scenario_id,
      });
    }

    return ok({ isDuplicate: false });
  } catch (e) {
    return err(
      e instanceof Error
        ? e
        : new Error('シナリオ名の重複チェックに失敗しました'),
    );
  }
};

/**
 * 配布URLが重複しているかチェック
 */
export const checkDistributeUrlDuplicate = async (params: {
  distributeUrl?: string;
}): Promise<
  Result<{
    isDuplicate: boolean;
    existingScenarioId?: string;
    existingScenarioName?: string;
  }>
> => {
  try {
    if (isNil(params.distributeUrl)) {
      return ok({ isDuplicate: false });
    }

    const normalizedUrl = params.distributeUrl.replace(/\/+$/, '');

    const supabase = await createDbClient();
    const { data: existing } = await supabase
      .from('scenarios')
      .select('scenario_id, name')
      .eq('distribute_url', normalizedUrl)
      .maybeSingle();

    if (existing) {
      return ok({
        isDuplicate: true,
        existingScenarioId: existing.scenario_id,
        existingScenarioName: existing.name,
      });
    }

    return ok({ isDuplicate: false });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('配布URLの重複チェックに失敗しました'),
    );
  }
};

/**
 * シナリオを作成する
 */
export const createScenario = async (
  input: CreateScenarioInput,
  userId: string,
): Promise<Result<{ scenarioId: string }>> => {
  try {
    const supabase = await createDbClient();

    const normalizedDistributeUrl = !isNil(input.distributeUrl)
      ? input.distributeUrl.replace(/\/+$/, '')
      : null;

    const scenarioId = ulid();

    const { error: insertError } = await supabase.from('scenarios').insert({
      scenario_id: scenarioId,
      name: input.name,
      scenario_system_id: input.scenarioSystemId,
      handout_type: input.handoutType,
      author: input.author ?? null,
      description: input.description ?? null,
      min_player: input.minPlayer ?? null,
      max_player: input.maxPlayer ?? null,
      min_playtime: input.minPlaytime ?? null,
      max_playtime: input.maxPlaytime ?? null,
      scenario_image_url: input.scenarioImageUrl ?? null,
      distribute_url: normalizedDistributeUrl,
      created_by_id: userId,
      source_type: input.sourceType ?? 'manual',
      source_url: input.sourceUrl ?? null,
      source_fetched_at: input.sourceFetchedAt ?? null,
    });

    if (insertError) {
      return err(new Error('シナリオの作成に失敗しました'));
    }

    // タグがある場合は紐付け
    if (!isNil(input.tagIds) && input.tagIds.length > 0) {
      await supabase.from('scenario_tags').insert(
        input.tagIds.map((tagId) => ({
          scenario_id: scenarioId,
          tag_id: tagId,
        })),
      );
    }

    return ok({ scenarioId });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('シナリオの作成に失敗しました'),
    );
  }
};
