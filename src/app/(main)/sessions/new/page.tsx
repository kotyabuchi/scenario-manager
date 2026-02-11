import { redirect } from 'next/navigation';

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

  return (
    <div className={styles.pageContainer}>
      <PageHeader backHref="/sessions" title="セッション募集" />

      <SessionFormContainer />
    </div>
  );
}
