import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';

import type { FeedbackSortOption } from './interface';

export const sortOptions = ['votes', 'newest', 'comments'] as const;

/** デフォルトで表示するステータス（WONT_FIX, DUPLICATE を除外） */
export const DEFAULT_STATUSES = [
  'NEW',
  'TRIAGED',
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
];

/** 全ステータス（トグルで使用） */
export const ALL_STATUSES = [
  'NEW',
  'TRIAGED',
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
  'WONT_FIX',
  'DUPLICATE',
];

export const filterParsers = {
  category: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  mine: parseAsBoolean.withDefault(false),
  statuses: parseAsArrayOf(parseAsString, ',').withDefault(DEFAULT_STATUSES),
};

export type FilterParams = {
  category: string;
  q: string;
  mine: boolean;
  statuses: string[];
};

export const searchParamsParsers = {
  ...filterParsers,
  sort: parseAsStringLiteral(sortOptions).withDefault('votes'),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);

/** URLパラメータから FeedbackSearchParams 型に変換 */
export const toSearchParams = (parsed: {
  category: string;
  q: string;
  mine: boolean;
  statuses: string[];
  sort: FeedbackSortOption;
}) => {
  const params: {
    category?: string;
    q?: string;
    mine?: boolean;
    statuses?: string[];
  } = {};

  if (parsed.category !== '') {
    params.category = parsed.category;
  }

  if (parsed.q !== '') {
    params.q = parsed.q;
  }

  if (parsed.mine) {
    params.mine = true;
  }

  if (parsed.statuses.length > 0) {
    params.statuses = parsed.statuses;
  }

  return params;
};
