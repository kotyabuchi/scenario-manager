import { notFound, redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { getFeedbackById } from '../adapter';
import { ActionSection } from './_components/ActionSection';
import { AdminSection } from './_components/AdminSection';
import { CommentSection } from './_components/CommentSection';
import { FeedbackDetailContent } from './_components/FeedbackDetailContent';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader/PageHeader';
import { Roles } from '@/db/enum';
import { createClient } from '@/lib/supabase/server';
import { isValidUlid } from '@/lib/validateUlid';

import type { Route } from 'next';

export const metadata = {
  title: 'フィードバック詳細',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!isValidUlid(id)) {
    notFound();
  }

  // 認証情報の取得
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (isNil(authUser)) {
    redirect('/');
  }

  // Discord ID → アプリ userId 変換
  let currentUserId: string | undefined;
  let userRole: string | undefined;

  const { data: user } = await supabase
    .from('users')
    .select('user_id, role')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  if (!isNil(user)) {
    currentUserId = user.user_id;
    userRole = user.role;
  }

  // フィードバック詳細の取得
  const result = await getFeedbackById(id, currentUserId);

  if (!result.success || isNil(result.data)) {
    notFound();
  }

  const feedback = result.data;
  const isLoggedIn = !isNil(currentUserId);
  const isModerator = userRole === Roles.MODERATOR.value;

  return (
    <>
      <PageHeader backHref={'/feedback' as Route} title="フィードバック詳細" />
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <FeedbackDetailContent feedback={feedback} />

          <ActionSection
            feedbackId={id}
            isAuthor={currentUserId === feedback.userId}
            status={feedback.status}
            feedback={{
              category: feedback.category,
              title: feedback.title,
              description: feedback.description,
            }}
          />

          {isModerator && (
            <AdminSection
              feedbackId={id}
              currentStatus={feedback.status}
              currentPriority={feedback.priority}
              currentAdminNote={feedback.adminNote}
            />
          )}

          <CommentSection
            feedbackId={id}
            comments={feedback.comments}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </>
  );
}
