import { redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { FeedbackContent } from './_components/FeedbackContent';
import { NewFeedbackButton } from './_components/NewFeedbackButton';
import { searchFeedbacks } from './adapter';
import { searchParamsCache, toSearchParams } from './searchParams';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader/PageHeader';
import { getAppLogger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

import type { Route } from 'next';
import type { SearchParams as NuqsSearchParams } from 'nuqs/server';
import type { FeedbackSearchParams } from './interface';

export const metadata = {
  title: 'みんなのフィードバック',
  description: 'フィードバック一覧',
};

type PageProps = {
  searchParams: Promise<NuqsSearchParams>;
};

export default async function FeedbackPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/');
  }

  // アプリ内ユーザーIDを取得
  const { data: dbUser } = await supabase
    .from('users')
    .select('user_id')
    .eq('discord_id', authUser.id)
    .maybeSingle();

  const parsed = await searchParamsCache.parse(searchParams);
  const params = toSearchParams(parsed);
  const sort = parsed.sort;

  const feedbackSearchParams: FeedbackSearchParams = { ...params };
  const userId = dbUser?.user_id;
  if (!isNil(userId)) {
    feedbackSearchParams.userId = userId;
  }

  const result = await searchFeedbacks(
    feedbackSearchParams,
    sort,
    20,
    0,
    userId,
  );

  if (!result.success) {
    getAppLogger(['app', 'feedback'])
      .error`Feedback fetch error: ${result.error}`;
  }

  const initialResult = result.success
    ? result.data
    : { feedbacks: [], totalCount: 0 };

  return (
    <>
      <PageHeader
        backHref={'/home' as Route}
        title="フィードバック"
        actions={<NewFeedbackButton />}
      />
      <div className={styles.pageContainer}>
        <FeedbackContent initialResult={initialResult} />
      </div>
    </>
  );
}
