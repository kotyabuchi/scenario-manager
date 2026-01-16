import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { ProfileCard, ProfileEditForm } from './_components';
import { getUserByDiscordId } from './adapter';

import { createClient } from '@/lib/supabase/server';
import { css } from '@/styled-system/css';

export const metadata = {
  title: 'マイページ',
  description: 'プロフィール設定',
};

const MyProfilePage = async () => {
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
};

const styles = {
  container: css({
    maxW: '800px',
    mx: 'auto',
    px: '4',
    py: '8',
  }),
  title: css({
    fontSize: '2xl',
    fontWeight: 'bold',
    color: 'gray.900',
    mb: '6',
  }),
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  }),
  section: css({}),
};

export default MyProfilePage;
