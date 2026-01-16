import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { ProfileCard, ProfileEditForm } from './_components';
import { getUserByDiscordId } from './adapter';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'マイページ',
  description: 'プロフィール設定',
};

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const result = await getUserByDiscordId(authUser.id);
  if (!result.success || isNil(result.data)) {
    redirect('/signup');
  }

  const user = result.data;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>マイページ</h1>

      <div className={styles.content}>
        <section className={styles.section}>
          <ProfileCard user={user} />
        </section>

        <section className={styles.section}>
          <ProfileEditForm user={user} />
        </section>
      </div>
    </main>
  );
}
