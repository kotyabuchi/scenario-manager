import { redirect } from 'next/navigation';

import { getAllSystems, getAllTags } from '../adapter';
import { ImportPageContent } from './_components';
import { importSearchParamsCache } from './searchParams';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader';
import { createClient } from '@/lib/supabase/server';

import type { SearchParams as NuqsSearchParams } from 'nuqs/server';

export const metadata = {
  title: 'シナリオをインポート',
  description: 'URLからシナリオ情報を取り込みます',
};

type PageProps = {
  searchParams: Promise<NuqsSearchParams>;
};

export default async function ScenarioImportPage({ searchParams }: PageProps) {
  // URLクエリパラメータをパース
  const { url: initialUrl } = await importSearchParamsCache.parse(searchParams);

  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/');
  }

  // システムとタグを取得
  const [systemsResult, tagsResult] = await Promise.all([
    getAllSystems(),
    getAllTags(),
  ]);

  if (!systemsResult.success || !tagsResult.success) {
    throw new Error('データの取得に失敗しました');
  }

  const systems = systemsResult.data;
  const tags = tagsResult.data;

  return (
    <div className={styles.pageContainer}>
      <PageHeader backHref="/scenarios" title="URLからシナリオをインポート" />

      {/* メインコンテンツ */}
      <div className={styles.mainContent}>
        <ImportPageContent
          systems={systems}
          tags={tags}
          initialUrl={initialUrl ?? undefined}
        />
      </div>
    </div>
  );
}
