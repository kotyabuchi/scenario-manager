import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { ProfileEditFormWrapper } from './_components';
import { getUserByDiscordId } from './adapter';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'プロフィール設定',
  description: 'プロフィールを編集します',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/');
  }

  const result = await getUserByDiscordId(authUser.id);
  if (!result.success || isNil(result.data)) {
    redirect('/');
  }

  const user = result.data;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>プロフィール設定</h1>
        <Link href={`/users/${user.userId}`} className={styles.viewProfileLink}>
          <ExternalLink size={16} />
          公開プロフィールを見る
        </Link>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <ProfileEditFormWrapper user={user} />
        </section>

        {/* 将来実装: 通知設定セクション */}
        {/* 将来実装: その他設定項目 */}
      </div>
    </div>
  );
}
