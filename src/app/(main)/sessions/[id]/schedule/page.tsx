import { notFound, redirect } from 'next/navigation';

import { getCurrentUserId } from '../../adapter';
import { isSessionManager } from '../../participantAdapter';
import { ScheduleContent } from './_components/ScheduleContent';
import { getScheduleCandidates } from './adapter';

import { createDbClient } from '@/lib/supabase/server';

import type { Route } from 'next';

export const metadata = {
  title: '日程候補選択',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SchedulePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // 認証チェック
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    redirect('/login' as Route);
  }

  // セッション管理者チェック（共有関数を使用）
  const isManager = await isSessionManager(id, currentUserId);
  if (!isManager) {
    redirect(`/sessions/${id}`);
  }

  // セッション名と日程候補を並列取得
  const dbClient = await createDbClient();
  const [sessionResult, candidatesResult] = await Promise.all([
    dbClient
      .from('game_sessions')
      .select('session_name')
      .eq('game_session_id', id)
      .maybeSingle(),
    getScheduleCandidates(id),
  ]);

  if (!sessionResult.data) {
    notFound();
  }

  const session = sessionResult.data;
  const candidates = candidatesResult.success ? candidatesResult.data : [];

  return (
    <ScheduleContent
      sessionId={id}
      sessionName={session.session_name}
      existingCandidates={candidates}
    />
  );
}
