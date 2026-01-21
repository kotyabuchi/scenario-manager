import { Suspense } from 'react';
import Link from 'next/link';

import { ScenariosContent } from './_components/ScenariosContent';
import * as styles from './_components/styles.experimental'; // 実験用スタイル
import { getAllSystems, getAllTags, searchScenarios } from './adapter';
import { searchParamsCache, toSearchParams } from './searchParams';

import { Spinner } from '@/components/elements';
import { Button } from '@/components/elements/button/button';

import type { SearchParams as NuqsSearchParams } from 'nuqs/server';

export const metadata = {
  title: 'シナリオ検索',
  description: 'TRPGシナリオを検索',
};

type PageProps = {
  searchParams: Promise<NuqsSearchParams>;
};

const ScenariosLoading = () => (
  <div className={styles.scenarioListEmpty}>
    <Spinner size="lg" />
    <span className={styles.scenarioListEmptyText}>読み込み中...</span>
  </div>
);

export default async function ScenariosPage({ searchParams }: PageProps) {
  // nuqsで型安全にパース
  const parsed = await searchParamsCache.parse(searchParams);
  const params = toSearchParams(parsed);
  const sort = parsed.sort;

  // 並行してデータ取得
  const [systemsResult, tagsResult, scenariosResult] = await Promise.all([
    getAllSystems(),
    getAllTags(),
    searchScenarios(params, sort, 20, 0),
  ]);

  if (!systemsResult.success || !tagsResult.success) {
    // エラーの詳細をログ出力
    if (!systemsResult.success) {
      console.error('Systems fetch error:', systemsResult.error);
    }
    if (!tagsResult.success) {
      console.error('Tags fetch error:', tagsResult.error);
    }
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
