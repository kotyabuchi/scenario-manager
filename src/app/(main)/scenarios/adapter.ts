import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';
import { isNil } from 'ramda';

import { getDb } from '@/db';
import {
  scenarioSystems,
  scenarios,
  scenarioTags,
  tags,
  users,
} from '@/db/schema';
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
  const db = getDb();
  try {
    const conditions = [];

    // システムIDでフィルタ（OR条件）
    if (!isNil(params.systemIds) && params.systemIds.length > 0) {
      conditions.push(inArray(scenarios.scenarioSystemId, params.systemIds));
    }

    // シナリオ名で部分一致検索
    if (!isNil(params.scenarioName) && params.scenarioName.trim() !== '') {
      conditions.push(ilike(scenarios.name, `%${params.scenarioName}%`));
    }

    // プレイ人数で範囲フィルタ
    if (!isNil(params.playerCount)) {
      // シナリオの範囲と検索条件の範囲が重なるものを取得
      // scenarioMin <= filterMax AND scenarioMax >= filterMin
      conditions.push(lte(scenarios.minPlayer, params.playerCount.max));
      conditions.push(gte(scenarios.maxPlayer, params.playerCount.min));
    }

    // プレイ時間で範囲フィルタ（分単位）
    if (!isNil(params.playtime)) {
      const minMinutes = params.playtime.min * 60;
      const maxMinutes = params.playtime.max * 60;
      conditions.push(lte(scenarios.minPlaytime, maxMinutes));
      conditions.push(gte(scenarios.maxPlaytime, minMinutes));
    }

    // タグでフィルタ（AND条件）- サブクエリで実現
    if (!isNil(params.tagIds) && params.tagIds.length > 0) {
      // 指定されたすべてのタグを持つシナリオを取得
      const tagCount = params.tagIds.length;
      const scenariosWithAllTags = db
        .select({ scenarioId: scenarioTags.scenarioId })
        .from(scenarioTags)
        .where(inArray(scenarioTags.tagId, params.tagIds))
        .groupBy(scenarioTags.scenarioId)
        .having(sql`count(distinct ${scenarioTags.tagId}) = ${tagCount}`);

      conditions.push(inArray(scenarios.scenarioId, scenariosWithAllTags));
    }

    // ソート順の決定
    const orderBy = (() => {
      switch (sort) {
        case 'newest':
          return desc(scenarios.createdAt);
        case 'playtime_asc':
          return asc(scenarios.minPlaytime);
        case 'playtime_desc':
          return desc(scenarios.minPlaytime);
        case 'rating':
          // TODO: レビューテーブルと結合して平均評価でソート
          return desc(scenarios.createdAt);
        default:
          return desc(scenarios.createdAt);
      }
    })();

    // 件数取得
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(scenarios)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0]?.count ?? 0);

    // シナリオ取得
    const result = await db.query.scenarios.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        system: true,
        scenarioTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [orderBy],
      limit,
      offset,
    });

    return ok({
      scenarios: result as ScenarioWithRelations[],
      totalCount,
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
  const db = getDb();
  try {
    const result = await db.query.scenarios.findFirst({
      where: eq(scenarios.scenarioId, id),
      with: {
        system: true,
        scenarioTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return ok((result as ScenarioWithRelations) ?? null);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 全システムを取得する
 */
export const getAllSystems = async (): Promise<Result<ScenarioSystem[]>> => {
  const db = getDb();
  try {
    const result = await db.query.scenarioSystems.findMany({
      orderBy: [asc(scenarioSystems.name)],
    });
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 全タグを取得する
 */
export const getAllTags = async (): Promise<Result<Tag[]>> => {
  const db = getDb();
  try {
    const result = await db.query.tags.findMany({
      orderBy: [asc(tags.name)],
    });
    return ok(result);
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
  const db = getDb();
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.discordId, discordId),
      columns: {
        userId: true,
        role: true,
      },
    });
    return ok(result ?? null);
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
  const db = getDb();
  try {
    const existing = await db.query.scenarios.findFirst({
      where: and(
        eq(scenarios.scenarioSystemId, params.scenarioSystemId),
        eq(scenarios.name, params.name),
      ),
      columns: {
        scenarioId: true,
      },
    });

    if (existing) {
      return ok({
        isDuplicate: true,
        existingScenarioId: existing.scenarioId,
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
  const db = getDb();
  try {
    // distributeUrlが未定義の場合はスキップ
    if (isNil(params.distributeUrl)) {
      return ok({ isDuplicate: false });
    }

    // URL正規化: 末尾スラッシュを削除
    const normalizedUrl = params.distributeUrl.replace(/\/+$/, '');

    const existing = await db.query.scenarios.findFirst({
      where: eq(scenarios.distributeUrl, normalizedUrl),
      columns: {
        scenarioId: true,
        name: true,
      },
    });

    if (existing) {
      return ok({
        isDuplicate: true,
        existingScenarioId: existing.scenarioId,
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
  const db = getDb();
  try {
    // distributeUrlの正規化（末尾スラッシュ削除）
    const normalizedDistributeUrl = !isNil(input.distributeUrl)
      ? input.distributeUrl.replace(/\/+$/, '')
      : null;

    // シナリオをINSERT
    const [inserted] = await db
      .insert(scenarios)
      .values({
        name: input.name,
        scenarioSystemId: input.scenarioSystemId,
        handoutType: input.handoutType,
        author: input.author ?? null,
        description: input.description ?? null,
        minPlayer: input.minPlayer ?? null,
        maxPlayer: input.maxPlayer ?? null,
        minPlaytime: input.minPlaytime ?? null,
        maxPlaytime: input.maxPlaytime ?? null,
        scenarioImageUrl: input.scenarioImageUrl ?? null,
        distributeUrl: normalizedDistributeUrl,
        createdById: userId,
      })
      .returning({ scenarioId: scenarios.scenarioId });

    if (!inserted) {
      return err(new Error('シナリオの作成に失敗しました'));
    }

    // タグがある場合は紐付け
    if (!isNil(input.tagIds) && input.tagIds.length > 0) {
      await db.insert(scenarioTags).values(
        input.tagIds.map((tagId) => ({
          scenarioId: inserted.scenarioId,
          tagId,
        })),
      );
    }

    return ok({ scenarioId: inserted.scenarioId });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('シナリオの作成に失敗しました'),
    );
  }
};
