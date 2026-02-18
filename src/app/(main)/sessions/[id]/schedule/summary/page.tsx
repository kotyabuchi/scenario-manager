import { notFound, redirect } from 'next/navigation';

import { getCurrentUserId } from '../../../adapter';
import { getScheduleCandidates } from '../adapter';
import { ScheduleSummaryContent } from './_components/ScheduleSummaryContent';

import { createDbClient } from '@/lib/supabase/server';

import type { Route } from 'next';

export const metadata = {
  title: '日程集計・確定',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScheduleSummaryPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  // 認証チェック
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) redirect('/login' as Route);

  // セッション管理者チェック（GM or 作成者）
  const dbClient = await createDbClient();
  const { data: session } = await dbClient
    .from('game_sessions')
    .select('game_session_id, session_name, keeper_id, created_by_id')
    .eq('game_session_id', id)
    .maybeSingle();

  if (!session) notFound();

  const isManager =
    session.keeper_id === currentUserId ||
    session.created_by_id === currentUserId;

  if (!isManager) redirect(`/sessions/${id}`);

  // 候補のサマリーを取得
  const summaryResult = await getScheduleCandidates(id);
  const candidates = summaryResult.success ? summaryResult.data : [];

  return (
    <ScheduleSummaryContent
      sessionId={id}
      sessionName={session.session_name}
      candidates={candidates}
    />
  );
}
