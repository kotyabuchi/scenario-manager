import { notFound } from 'next/navigation';
import { isNil } from 'ramda';

import { getUserByDiscordId, getUserById } from './adapter';
import * as styles from './styles';

import { ProfileCard } from '@/components/blocks/Profile';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';
import type { UserProfilePageProps } from './interface';

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getUserById(id);

  if (!result.success || isNil(result.data)) {
    return {
      title: 'ユーザーが見つかりません',
    };
  }

  return {
    title: `${result.data.nickname}のプロフィール`,
    description: result.data.bio ?? undefined,
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id } = await params;

  // 対象ユーザーを取得
  const result = await getUserById(id);
  if (!result.success || isNil(result.data)) {
    notFound();
  }

  const user = result.data;

  // 現在のログインユーザーを取得（自分のプロフィールかどうかを判定）
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let isOwnProfile = false;
  if (authUser) {
    const currentUserResult = await getUserByDiscordId(authUser.id);
    if (currentUserResult.success && currentUserResult.data) {
      isOwnProfile = currentUserResult.data.userId === user.userId;
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{user.nickname}のプロフィール</h1>

      <div className={styles.content}>
        <section className={styles.section}>
          <ProfileCard user={user} showEditButton={isOwnProfile} />
        </section>

        {/* 将来実装: セッション履歴セクション */}
        {/* 将来実装: 投稿動画セクション */}
        {/* 将来実装: レビュー一覧セクション */}
      </div>
    </div>
  );
}
