import { notFound } from 'next/navigation';

import { getCurrentUserId } from '../adapter';
import { SessionDetailContent } from './_components/SessionDetailContent';
import { buildSessionTimeline, getSessionDetail } from './adapter';
import { hasUserAvailabilitySubmission } from './availability/adapter';

import type { Database } from '@/db/types';
import type { UserRole } from '../interface';

export const metadata = {
  title: 'セッション詳細',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const [detailResult, currentUserId] = await Promise.all([
    getSessionDetail(id),
    getCurrentUserId(),
  ]);

  if (!detailResult.success) {
    notFound();
  }

  const session = detailResult.data;
  const timeline = buildSessionTimeline(session);

  // ユーザーのロールと参加ステータスを判定
  let userRole: UserRole = 'guest';
  let participantStatus:
    | Database['public']['Enums']['participant_status']
    | undefined;
  let hasAvailabilitySubmission = false;
  if (currentUserId) {
    const isManager =
      session.keeper?.userId === currentUserId ||
      session.creator.userId === currentUserId;
    if (isManager) {
      userRole = 'manager';
    } else {
      // WITHDRAWN ユーザーは participants から除外済み（adapter.ts で filter）のため
      // ここで見つかるのは PENDING/CONFIRMED のみ。WITHDRAWN ユーザーは guest 扱いとなり再申請可能
      const participant = session.participants.find(
        (p) => p.user.userId === currentUserId,
      );
      if (participant) {
        userRole = 'participant';
        participantStatus = participant.participantStatus;
      }
    }

    const availabilitySubmissionResult = await hasUserAvailabilitySubmission(
      id,
      currentUserId,
    );
    if (availabilitySubmissionResult.success) {
      hasAvailabilitySubmission = availabilitySubmissionResult.data;
    }
  }

  return (
    <SessionDetailContent
      session={session}
      timeline={timeline}
      userRole={userRole}
      currentUserId={currentUserId}
      participantStatus={participantStatus}
      hasAvailabilitySubmission={hasAvailabilitySubmission}
    />
  );
}
