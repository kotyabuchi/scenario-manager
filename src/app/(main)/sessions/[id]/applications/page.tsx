import { notFound, redirect } from 'next/navigation';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../adapter';
import { isSessionManager } from '../../participantAdapter';
import { ApplicationApprovalContent } from './_components/ApplicationApprovalContent';
import { Breadcrumb } from './_components/Breadcrumb';
import { getApplications, getSessionBasicInfo } from './adapter';
import * as styles from './styles';

import type { Route } from 'next';

export const metadata = {
  title: '参加申請管理',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // 認証チェック
  const currentUserId = await getCurrentUserId();
  if (isNil(currentUserId)) {
    redirect('/login' as Route);
  }

  // 認可チェック（GM/作成者のみアクセス可能）
  const isManager = await isSessionManager(id, currentUserId);
  if (!isManager) {
    redirect(`/sessions/${id}`);
  }

  // データ並列取得
  const [applicationsResult, basicInfoResult] = await Promise.all([
    getApplications(id),
    getSessionBasicInfo(id),
  ]);

  if (!applicationsResult.success) {
    notFound();
  }

  if (!basicInfoResult.success) {
    notFound();
  }

  const applications = applicationsResult.data;
  const { sessionName, maxPlayer } = basicInfoResult.data;

  return (
    <div className={styles.approval_container}>
      <Breadcrumb sessionId={id} sessionName={sessionName} />

      <ApplicationApprovalContent
        sessionId={id}
        sessionName={sessionName}
        maxPlayer={maxPlayer}
        applications={applications}
      />
    </div>
  );
}
