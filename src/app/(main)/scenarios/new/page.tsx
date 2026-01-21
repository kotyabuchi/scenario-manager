import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAllSystems, getAllTags } from '../adapter';
import { ScenarioForm } from './_components';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'シナリオ登録',
  description: '新しいシナリオを登録します',
};

export default async function ScenarioNewPage() {
  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
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
    <main className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Link href="/scenarios" className={styles.pageBackButton}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.pageTitle}>シナリオ登録</h1>
      </div>

      <ScenarioForm systems={systems} tags={tags} />
    </main>
  );
}
