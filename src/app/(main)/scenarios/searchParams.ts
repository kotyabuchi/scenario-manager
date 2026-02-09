import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { isNotNil } from 'ramda';

import type { SortOption } from './interface';

// ソートオプションの定義
export const sortOptions = [
  'newest',
  'rating',
  'playtime_asc',
  'playtime_desc',
] as const;

// フィルターUI用パーサー（Client Component で useQueryStates に使用）
export const filterParsers = {
  systems: parseAsArrayOf(parseAsString, ',').withDefault([]),
  tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
  minPlayer: parseAsInteger,
  maxPlayer: parseAsInteger,
  minPlaytime: parseAsInteger,
  maxPlaytime: parseAsInteger,
  q: parseAsString.withDefault(''),
};

export type FilterParams = {
  systems: string[];
  tags: string[];
  minPlayer: number | null;
  maxPlayer: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  q: string;
};

// Server Component 用パーサー（filterParsers + sort）
export const searchParamsParsers = {
  ...filterParsers,
  sort: parseAsStringLiteral(sortOptions).withDefault('newest'),
};

// サーバーコンポーネント用のキャッシュ
export const searchParamsCache = createSearchParamsCache(searchParamsParsers);

// URLパラメータから SearchParams 型に変換
export const toSearchParams = (parsed: {
  systems: string[];
  tags: string[];
  minPlayer: number | null;
  maxPlayer: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  q: string;
  sort: SortOption;
}) => {
  const params: {
    systemIds?: string[];
    tagIds?: string[];
    playerCount?: { min: number; max: number };
    playtime?: { min: number; max: number };
    scenarioName?: string;
  } = {};

  if (parsed.systems.length > 0) {
    params.systemIds = parsed.systems;
  }

  if (parsed.tags.length > 0) {
    params.tagIds = parsed.tags;
  }

  if (isNotNil(parsed.minPlayer) || isNotNil(parsed.maxPlayer)) {
    params.playerCount = {
      min: parsed.minPlayer ?? 1,
      max: parsed.maxPlayer ?? 20,
    };
  }

  if (isNotNil(parsed.minPlaytime) || isNotNil(parsed.maxPlaytime)) {
    params.playtime = {
      min: parsed.minPlaytime ?? 1,
      max: parsed.maxPlaytime ?? 240,
    };
  }

  if (parsed.q !== '') {
    params.scenarioName = parsed.q;
  }

  return params;
};
