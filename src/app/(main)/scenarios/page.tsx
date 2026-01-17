import { Suspense } from 'react';
import Link from 'next/link';
import { isNil } from 'ramda';

import { ScenariosContent } from './_components/ScenariosContent';
import * as styles from './_components/styles';
import { getAllSystems, getAllTags, searchScenarios } from './adapter';

import { Spinner } from '@/components/elements';
import { Button } from '@/components/elements/button/button';

import type { SearchParams, SortOption } from './interface';

export const metadata = {
  title: 'シナリオ検索',
  description: 'TRPGシナリオを検索',
};

type PageProps = {
  searchParams: Promise<{
    systems?: string;
    tags?: string;
    minPlayer?: string;
    maxPlayer?: string;
    minPlaytime?: string;
    maxPlaytime?: string;
    q?: string;
    sort?: string;
  }>;
};

const parseSearchParams = async (
  searchParamsPromise: PageProps['searchParams'],
): Promise<{ params: SearchParams; sort: SortOption }> => {
  const searchParams = await searchParamsPromise;
  const params: SearchParams = {};

  if (!isNil(searchParams.systems) && searchParams.systems !== '') {
    params.systemIds = searchParams.systems.split(',');
  }

  if (!isNil(searchParams.tags) && searchParams.tags !== '') {
    params.tagIds = searchParams.tags.split(',');
  }

  if (!isNil(searchParams.minPlayer) || !isNil(searchParams.maxPlayer)) {
    params.playerCount = {
      min: searchParams.minPlayer
        ? Number.parseInt(searchParams.minPlayer, 10)
        : 1,
      max: searchParams.maxPlayer
        ? Number.parseInt(searchParams.maxPlayer, 10)
        : 20,
    };
  }

  if (!isNil(searchParams.minPlaytime) || !isNil(searchParams.maxPlaytime)) {
    params.playtime = {
      min: searchParams.minPlaytime
        ? Number.parseInt(searchParams.minPlaytime, 10)
        : 1,
      max: searchParams.maxPlaytime
        ? Number.parseInt(searchParams.maxPlaytime, 10)
        : 24,
    };
  }

  if (!isNil(searchParams.q) && searchParams.q !== '') {
    params.scenarioName = searchParams.q;
  }

  const sort = (searchParams.sort as SortOption) ?? 'newest';

  return { params, sort };
};

const ScenariosLoading = () => (
  <div className={styles.scenarioListEmpty}>
    <Spinner size="lg" />
    <span className={styles.scenarioListEmptyText}>読み込み中...</span>
  </div>
);

export default async function ScenariosPage({ searchParams }: PageProps) {
  const { params, sort } = await parseSearchParams(searchParams);

  // 並行してデータ取得
  const [systemsResult, tagsResult, scenariosResult] = await Promise.all([
    getAllSystems(),
    getAllTags(),
    searchScenarios(params, sort, 20, 0),
  ]);

  if (!systemsResult.success || !tagsResult.success) {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.scenarioListEmpty}>
          <span className={styles.scenarioListEmptyText}>
            データの取得に失敗しました
          </span>
        </div>
      </main>
    );
  }

  const initialResult = scenariosResult.success
    ? scenariosResult.data
    : { scenarios: [], totalCount: 0 };

  return (
    <main className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>シナリオ検索</h1>
        <Link href="/scenarios/new">
          <Button status="primary">シナリオを登録</Button>
        </Link>
      </div>

      <Suspense fallback={<ScenariosLoading />}>
        <ScenariosContent
          systems={systemsResult.data}
          tags={tagsResult.data}
          initialResult={initialResult}
          initialParams={params}
        />
      </Suspense>
    </main>
  );
}
