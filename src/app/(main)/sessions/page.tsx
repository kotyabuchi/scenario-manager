import { Suspense } from 'react';
import Link from 'next/link';
import { isNil } from 'ramda';

import { HistoryTab } from './_components/HistoryTab';
import { LoginPrompt } from './_components/LoginPrompt';
import { PublicTab } from './_components/PublicTab';
import * as styles from './_components/styles';
import { UpcomingTab } from './_components/UpcomingTab';
import {
  getAllSystems,
  getCurrentUserId,
  getHistorySessions,
  getUpcomingSessions,
  searchPublicSessions,
} from './adapter';
import { searchParamsCache, toPublicSearchParams } from './searchParams';

import { Spinner } from '@/components/elements';
import { getAppLogger } from '@/lib/logger';

import type { SearchParams as NuqsSearchParams } from 'nuqs/server';
import type {
  HistorySortOption,
  RoleFilterValue,
  StatusFilterValue,
  UpcomingSortOption,
} from './interface';

export const metadata = {
  title: 'セッション',
  description: 'TRPGセッションを探す・管理する',
};

type PageProps = {
  searchParams: Promise<NuqsSearchParams>;
};

const SessionsLoading = () => (
  <div className={styles.emptyState}>
    <Spinner size="lg" />
    <span className={styles.emptyState_title}>読み込み中...</span>
  </div>
);

export default async function SessionsPage({ searchParams }: PageProps) {
  const parsed = await searchParamsCache.parse(searchParams);
  const tab = parsed.tab;
  const publicParams = toPublicSearchParams(parsed);
  const publicSort = parsed.publicSort;
  const upcomingSort = parsed.upcomingSort as UpcomingSortOption;
  const historySort = parsed.historySort as HistorySortOption;
  const rolesFilter = (parsed.roles ?? []) as RoleFilterValue[];
  const statusesFilter = (parsed.statuses ?? []) as StatusFilterValue[];

  const userId = await getCurrentUserId();
  const isLoggedIn = !isNil(userId);

  const systemsResult = await getAllSystems();

  if (!systemsResult.success) {
    getAppLogger(['app', 'sessions'])
      .error`Systems fetch error: ${systemsResult.error}`;
    return (
      <main className={styles.pageContainer}>
        <div className={styles.emptyState}>
          <span className={styles.emptyState_title}>
            データの取得に失敗しました
          </span>
        </div>
      </main>
    );
  }

  const publicResult = await searchPublicSessions(
    publicParams,
    publicSort,
    20,
    0,
  );
  const publicInitialResult = publicResult.success
    ? publicResult.data
    : { sessions: [], totalCount: 0 };

  const publicInitialParams = {
    systems: parsed.systems ?? [],
    phases: parsed.phases ?? ['RECRUITING', 'PREPARATION'],
    dateFrom: parsed.dateFrom ?? '',
    dateTo: parsed.dateTo ?? '',
    q: parsed.q ?? '',
  };

  const upcomingResult =
    isLoggedIn && userId
      ? await getUpcomingSessions(userId, upcomingSort, 20, 0)
      : null;
  const upcomingInitialResult =
    upcomingResult?.success === true
      ? upcomingResult.data
      : { sessions: [], totalCount: 0 };

  const historySystems = parsed.historySystems ?? [];

  const historyResult =
    isLoggedIn && userId
      ? await getHistorySessions(
          userId,
          rolesFilter,
          statusesFilter,
          historySystems,
          historySort,
          20,
          0,
        )
      : null;
  const historyInitialResult =
    historyResult?.success === true
      ? historyResult.data
      : { sessions: [], totalCount: 0 };

  return (
    <main className={styles.pageContainer}>
      <div className={styles.pageLayout}>
        {/* Pencil準拠: 白bg、h56、center、padding 0 32 のタブバー */}
        <div className={styles.tabBar}>
          <div className={styles.tabContainer}>
            <Link href="/sessions?tab=upcoming">
              <button
                type="button"
                className={styles.tabButton({ active: tab === 'upcoming' })}
                disabled={!isLoggedIn}
              >
                参加予定
              </button>
            </Link>
            <Link href="/sessions?tab=history">
              <button
                type="button"
                className={styles.tabButton({ active: tab === 'history' })}
                disabled={!isLoggedIn}
              >
                参加履歴
              </button>
            </Link>
            <Link href="/sessions?tab=public">
              <button
                type="button"
                className={styles.tabButton({ active: tab === 'public' })}
              >
                公開卓を探す
              </button>
            </Link>
          </div>
        </div>

        <Suspense fallback={<SessionsLoading />}>
          {tab === 'public' && (
            <PublicTab
              systems={systemsResult.data}
              initialResult={publicInitialResult}
              initialParams={publicInitialParams}
            />
          )}
          {tab === 'upcoming' && isLoggedIn && (
            <UpcomingTab initialResult={upcomingInitialResult} />
          )}
          {tab === 'upcoming' && !isLoggedIn && (
            <LoginPrompt message="参加予定を確認するにはログインが必要です" />
          )}
          {tab === 'history' && isLoggedIn && (
            <HistoryTab
              systems={systemsResult.data}
              initialResult={historyInitialResult}
              initialRoles={rolesFilter}
              initialStatuses={statusesFilter}
              initialSystems={historySystems}
            />
          )}
          {tab === 'history' && !isLoggedIn && (
            <LoginPrompt message="参加履歴を確認するにはログインが必要です" />
          )}
        </Suspense>
      </div>
    </main>
  );
}
