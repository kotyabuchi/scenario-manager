import { notFound, redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../../adapter';
import { isSessionManager } from '../../../participantAdapter';
import { ConfirmAvailabilityWorkspace } from '../../availability/_components/ConfirmAvailabilityWorkspace';
import { getAvailabilityWorkspaceData } from '../../availability/adapter';
import {
  canConfirmScheduleInCurrentPhase,
  getSchedulingPhases,
} from '../../scheduleFlowGuards';
import { confirmScheduleSlotsAction } from './actions';
import { getScheduleRecommendations } from './adapter';
import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader';

import type { Route } from 'next';
import type { AvailabilitySlotInput } from '../../availability/interface';

export const metadata = {
  title: '日程確定',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScheduleConfirmPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const currentUserId = await getCurrentUserId();
  if (isNil(currentUserId)) {
    redirect('/login' as Route);
  }

  const isManager = await isSessionManager(id, currentUserId);
  if (!isManager) {
    redirect(`/sessions/${id}`);
  }

  const phasesResult = await getSchedulingPhases(id);
  if (!phasesResult.success) {
    notFound();
  }
  if (!canConfirmScheduleInCurrentPhase(phasesResult.data.sessionPhase)) {
    redirect(`/sessions/${id}`);
  }

  const [workspaceResult, recommendationsResult] = await Promise.all([
    getAvailabilityWorkspaceData(id, currentUserId),
    getScheduleRecommendations(id),
  ]);

  if (!workspaceResult.success) {
    notFound();
  }
  if (!recommendationsResult.success) {
    notFound();
  }

  async function confirmSlotsServerAction(slots: AvailabilitySlotInput[]) {
    'use server';
    return confirmScheduleSlotsAction(id, { slots });
  }

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        backHref={`/sessions/${id}` as Route}
        title="日程を確定する"
      />

      <ConfirmAvailabilityWorkspace
        workspaceData={workspaceResult.data}
        recommendationGroups={recommendationsResult.data}
        onConfirmSlots={confirmSlotsServerAction}
      />
    </div>
  );
}
