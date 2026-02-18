import { notFound, redirect } from 'next/navigation';

import { getCurrentUserId } from '../../../adapter';
import { getScheduleCandidates } from '../adapter';
import { ScheduleResponseContent } from './_components/ScheduleResponseContent';

import { ParticipantStatuses } from '@/db/enum';
import { createDbClient } from '@/lib/supabase/server';

import type { Route } from 'next';

export const metadata = {
  title: '日程回答',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScheduleRespondPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  // 認証チェック
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) redirect('/login' as Route);

  // セッション存在チェック
  const dbClient = await createDbClient();
  const { data: session } = await dbClient
    .from('game_sessions')
    .select('game_session_id, session_name')
    .eq('game_session_id', id)
    .maybeSingle();
  if (!session) notFound();

  // セッション参加者チェック（APPROVED参加者のみ回答可能）
  const { data: participant } = await dbClient
    .from('session_participants')
    .select('user_id, participant_status')
    .eq('session_id', id)
    .eq('user_id', currentUserId)
    .maybeSingle();

  if (
    !participant ||
    participant.participant_status !== ParticipantStatuses.CONFIRMED.value
  ) {
    redirect(`/sessions/${id}`);
  }

  // 日程候補を取得
  const candidatesResult = await getScheduleCandidates(id);
  const candidates = candidatesResult.success ? candidatesResult.data : [];

  return (
    <ScheduleResponseContent
      sessionId={id}
      sessionName={session.session_name}
      candidates={candidates}
      currentUserId={currentUserId}
    />
  );
}
