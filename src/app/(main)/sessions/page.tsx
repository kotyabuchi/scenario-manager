import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { HistoryTab } from './_components/HistoryTab';
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
import { Button } from '@/components/elements/button/button';

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
  <div className={styles.sessionListEmpty}>
    <Spinner size="lg" />
    <span className={styles.sessionListEmptyText}>読み込み中...</span>
  </div>
);

export default async function SessionsPage({ searchParams }: PageProps) {
  // nuqsで型安全にパース
  const parsed = await searchParamsCache.parse(searchParams);
  const tab = parsed.tab;
  const publicParams = toPublicSearchParams(parsed);
  const publicSort = parsed.publicSort;
  const upcomingSort = parsed.upcomingSort as UpcomingSortOption;
  const historySort = parsed.historySort as HistorySortOption;
  const rolesFilter = (parsed.roles ?? []) as RoleFilterValue[];
  const statusesFilter = (parsed.statuses ?? []) as StatusFilterValue[];

  // 現在のユーザーIDを取得
  const userId = await getCurrentUserId();
  const isLoggedIn = userId !== null;

  // システム一覧を取得
  const systemsResult = await getAllSystems();

  if (!systemsResult.success) {
    console.error('Systems fetch error:', systemsResult.error);
    return (
      <main className={styles.pageContainer}>
        <div className={styles.sessionListEmpty}>
          <span className={styles.sessionListEmptyText}>
            データの取得に失敗しました
          </span>
        </div>
      </main>
    );
  }

  // 公開卓タブの初期データを取得
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

  // 参加予定タブの初期データ（ログイン済みの場合のみ）
  const upcomingResult =
    isLoggedIn && userId
      ? await getUpcomingSessions(userId, upcomingSort, 20, 0)
      : null;
  const upcomingInitialResult =
    upcomingResult?.success === true
      ? upcomingResult.data
      : { sessions: [], totalCount: 0 };

  // 履歴タブのシステムフィルタ
  const historySystems = parsed.historySystems ?? [];

  // 参加履歴タブの初期データ（ログイン済みの場合のみ）
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
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>セッション</h1>
        {isLoggedIn && (
          <Link href="/sessions/new">
            <Button status="primary">
              <Plus size={16} />
              セッション作成
            </Button>
          </Link>
        )}
      </div>

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
          <div className={styles.sessionListEmpty}>
            <span className={styles.sessionListEmptyText}>
              参加予定を確認するにはログインが必要です
            </span>
            <div className={styles.sessionListEmptyActions}>
              <Link href="/login">
                <Button status="primary">ログイン</Button>
              </Link>
            </div>
          </div>
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
          <div className={styles.sessionListEmpty}>
            <span className={styles.sessionListEmptyText}>
              参加履歴を確認するにはログインが必要です
            </span>
            <div className={styles.sessionListEmptyActions}>
              <Link href="/login">
                <Button status="primary">ログイン</Button>
              </Link>
            </div>
          </div>
        )}
      </Suspense>
    </main>
  );
}
