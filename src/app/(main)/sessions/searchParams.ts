import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';

import type {
  HistorySortOption,
  PublicSearchParams,
  PublicSortOption,
  RoleFilterValue,
  SessionPhase,
  StatusFilterValue,
  TabType,
  UpcomingSortOption,
} from './interface';

// タブオプション
const tabOptions = ['upcoming', 'history', 'public'] as const;

// 公開卓ソートオプション
const publicSortOptions = ['date_asc', 'created_desc', 'slots_desc'] as const;

// 参加予定ソートオプション
const upcomingSortOptions = ['date_asc', 'created_desc'] as const;

// 履歴ソートオプション
const historySortOptions = ['date_desc', 'date_asc'] as const;

// 検索パラメータのパーサー定義
export const searchParamsParsers = {
  // 共通
  tab: parseAsStringLiteral(tabOptions).withDefault('public'),

  // 参加予定タブ
  upcomingSort:
    parseAsStringLiteral(upcomingSortOptions).withDefault('date_asc'),

  // 履歴タブ
  roles: parseAsArrayOf(parseAsString, ',').withDefault([]),
  statuses: parseAsArrayOf(parseAsString, ',').withDefault([]),
  historySystems: parseAsArrayOf(parseAsString, ',').withDefault([]),
  historySort:
    parseAsStringLiteral(historySortOptions).withDefault('date_desc'),

  // 公開卓タブ
  systems: parseAsArrayOf(parseAsString, ',').withDefault([]),
  phases: parseAsArrayOf(parseAsString, ',').withDefault([
    'RECRUITING',
    'PREPARATION',
  ]),
  dateFrom: parseAsString,
  dateTo: parseAsString,
  q: parseAsString.withDefault(''),
  publicSort: parseAsStringLiteral(publicSortOptions).withDefault('date_asc'),
};

// サーバーコンポーネント用のキャッシュ
export const searchParamsCache = createSearchParamsCache(searchParamsParsers);

// URLパラメータから PublicSearchParams 型に変換
export const toPublicSearchParams = (parsed: {
  systems: string[];
  phases: string[];
  dateFrom: string | null;
  dateTo: string | null;
  q: string;
}): PublicSearchParams => {
  const params: PublicSearchParams = {};

  if (parsed.systems.length > 0) {
    params.systemIds = parsed.systems;
  }

  if (parsed.phases.length > 0) {
    params.phases = parsed.phases as SessionPhase[];
  }

  if (parsed.dateFrom) {
    params.dateFrom = new Date(parsed.dateFrom);
  }

  if (parsed.dateTo) {
    params.dateTo = new Date(parsed.dateTo);
  }

  if (parsed.q !== '') {
    params.scenarioName = parsed.q;
  }

  return params;
};

export type {
  TabType,
  PublicSortOption,
  UpcomingSortOption,
  HistorySortOption,
  RoleFilterValue,
  StatusFilterValue,
};
