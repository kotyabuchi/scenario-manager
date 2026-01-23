import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SessionFormContainer } from './_components/SessionFormContainer';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: '新規セッション',
  description: '新しいセッションを作成',
};

export default async function NewSessionPage() {
  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  return (
    <main className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Link href="/sessions" className={styles.pageBackButton}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.pageTitle}>セッション募集</h1>
      </div>

      <SessionFormContainer />
    </main>
  );
}
