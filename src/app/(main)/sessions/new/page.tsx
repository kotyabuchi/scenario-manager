import { redirect } from 'next/navigation';

import { getAllSystems } from '../../scenarios/adapter';
import { SessionFormContainer } from './_components/SessionFormContainer';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader';
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
    redirect('/');
  }

  // システム一覧を取得
  const systemsResult = await getAllSystems();
  const systems = systemsResult.success
    ? systemsResult.data.map((s) => ({ systemId: s.systemId, name: s.name }))
    : [];

  return (
    <div className={styles.pageContainer}>
      <PageHeader backHref="/sessions" title="セッションを作成" />

      <div className={styles.mainContent}>
        <SessionFormContainer systems={systems} />
      </div>
    </div>
  );
}
