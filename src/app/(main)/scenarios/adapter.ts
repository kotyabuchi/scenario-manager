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

    // タグANDフィルタ: 先にタグ条件に合うシナリオIDを取得
    let tagFilteredScenarioIds: string[] | null = null;
    if (!isNil(params.tagIds) && params.tagIds.length > 0) {
      const { data: tagData } = await supabase
        .from('scenario_tags')
        .select('scenario_id')
        .in('tag_id', params.tagIds);

      if (tagData) {
        // 全タグを持つシナリオのみ（ANDフィルタ）
        const scenarioTagCounts = new Map<string, number>();
        for (const row of tagData) {
          const count = scenarioTagCounts.get(row.scenario_id) ?? 0;
          scenarioTagCounts.set(row.scenario_id, count + 1);
        }
        tagFilteredScenarioIds = [];
        for (const [scenarioId, count] of scenarioTagCounts) {
          if (count >= params.tagIds.length) {
            tagFilteredScenarioIds.push(scenarioId);
          }
        }
        if (tagFilteredScenarioIds.length === 0) {
          return ok({ scenarios: [], totalCount: 0 });
        }
      }
    }

    // ベースクエリ
    let query = supabase
      .from('scenarios')
      .select(
        '*, system:scenario_systems(*), scenarioTags:scenario_tags(tag:tags(*))',
        { count: 'exact' },
      );

    // フィルタ適用
    if (!isNil(params.systemIds) && params.systemIds.length > 0) {
      query = query.in('scenario_system_id', params.systemIds);
    }

    if (!isNil(params.scenarioName) && params.scenarioName.trim() !== '') {
      query = query.ilike('name', `%${params.scenarioName}%`);
    }

    if (!isNil(params.playerCount)) {
      query = query
        .lte('min_player', params.playerCount.max)
        .gte('max_player', params.playerCount.min);
    }

    if (!isNil(params.playtime)) {
      const minMinutes = params.playtime.min * 60;
      const maxMinutes = params.playtime.max * 60;
      query = query
        .lte('min_playtime', maxMinutes)
        .gte('max_playtime', minMinutes);
    }

    if (tagFilteredScenarioIds) {
      query = query.in('scenario_id', tagFilteredScenarioIds);
    }

    // ソート（scenario_id をタイブレーカーに追加し、ページネーションの安定性を保証）
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'playtime_asc':
        query = query.order('min_playtime', { ascending: true });
        break;
      case 'playtime_desc':
        query = query.order('min_playtime', { ascending: false });
        break;
      case 'rating':
        query = query.order('created_at', { ascending: false });
        break;
    }
    query = query.order('scenario_id', { ascending: false });

    // ページネーション
    query = query.range(offset, offset + limit - 1);

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
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
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
