import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { NewScenarios } from './_components/NewScenarios';
import { UpcomingSessions } from './_components/UpcomingSessions';
import { getNewScenarios, getUpcomingSessions } from './adapter';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'ホーム',
  description: 'ダッシュボード',
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインの場合はルートページにリダイレクト
  if (!user) {
    return null;
  }

  // データ取得
  const [upcomingSessionsResult, newScenariosResult] = await Promise.all([
    getUpcomingSessions(user.id),
    getNewScenarios(),
  ]);

  const upcomingSessions = upcomingSessionsResult.success
    ? upcomingSessionsResult.data
    : [];
  const newScenarios = newScenariosResult.success
    ? newScenariosResult.data
    : [];

  return (
    <div className={styles.pageContainer}>
      {/* ページヘッダー */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>ホーム</h1>
        <p className={styles.pageSubtitle}>
          ようこそ、{user.user_metadata?.full_name ?? user.email}さん
        </p>
      </div>

      {/* 参加予定のセッション */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>参加予定のセッション</h2>
          <Link href="/sessions?tab=upcoming" className={styles.sectionLink}>
            すべて見る
            <ChevronRight size={16} />
          </Link>
        </div>
        <UpcomingSessions sessions={upcomingSessions} />
      </section>

      {/* 新着シナリオ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>新着シナリオ</h2>
          <Link href="/scenarios" className={styles.sectionLink}>
            すべて見る
            <ChevronRight size={16} />
          </Link>
        </div>
        <NewScenarios scenarios={newScenarios} />
      </section>
    </div>
  );
}
