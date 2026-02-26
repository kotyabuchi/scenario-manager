import { notFound, redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../adapter';
import { isSessionManager } from '../../participantAdapter';
import { SubmitAvailabilityWorkspace } from './_components/SubmitAvailabilityWorkspace';
import { saveAvailabilitySlotsAction } from './actions';
import { getAvailabilityWorkspaceData } from './adapter';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader';
import { ParticipantStatuses } from '@/db/enum';
import { createDbClient } from '@/lib/supabase/server';

import type { Route } from 'next';
import type { AvailabilitySlotInput } from './interface';

export const metadata = {
  title: '参加可能時間の提出',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const canViewAvailabilityPage = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const dbClient = await createDbClient();

  const [{ data: participant }, isManager] = await Promise.all([
    dbClient
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('participant_status', ParticipantStatuses.CONFIRMED.value)
      .maybeSingle(),
    isSessionManager(sessionId, userId),
  ]);

  return !isNil(participant) || isManager;
};

export default async function AvailabilityPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const currentUserId = await getCurrentUserId();
  if (isNil(currentUserId)) {
    redirect('/login' as Route);
  }

  const hasPermission = await canViewAvailabilityPage(id, currentUserId);
  if (!hasPermission) {
    redirect(`/sessions/${id}`);
  }

  const workspaceResult = await getAvailabilityWorkspaceData(id, currentUserId);
  if (!workspaceResult.success) {
    notFound();
  }

  async function saveSlotsServerAction(slots: AvailabilitySlotInput[]) {
    'use server';
    return saveAvailabilitySlotsAction(id, { slots });
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        backHref={`/sessions/${id}` as Route}
        title="参加可能時間を提出"
      />

      <SubmitAvailabilityWorkspace
        workspaceData={workspaceResult.data}
        onSaveSlots={saveSlotsServerAction}
      />
    </div>
  );
}
