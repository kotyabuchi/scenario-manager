'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { isNil } from 'ramda';

import * as styles from '../styles';
import { ApplicationCard } from './ApplicationCard';

import { Badge } from '@/components/elements/badge';
import { Progress } from '@/components/elements/progress';

import type { ApplicationWithUser } from '../adapter';

/** フィルタータブの種類 */
type FilterTab = 'all' | 'pending' | 'confirmed';

/** タブ一覧（キーボードナビゲーション用） */
const FILTER_TABS: FilterTab[] = ['all', 'pending', 'confirmed'];

type ApplicationApprovalContentProps = {
  sessionId: string;
  sessionName: string;
  maxPlayer: number | null;
  applications: ApplicationWithUser[];
};

/** 楽観的更新のアクション */
type OptimisticAction =
  | { type: 'APPROVE'; userId: string }
  | { type: 'REJECT'; userId: string };

/**
 * 申請承認コンテンツ（Client Component）
 * 楽観的更新・フィルタータブを管理する
 */
export const ApplicationApprovalContent = ({
  sessionId,
  sessionName,
  maxPlayer,
  applications,
}: ApplicationApprovalContentProps) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [, startTransition] = useTransition();

  /**
   * 楽観的更新: userId → 'CONFIRMED' | 'REJECTED' のマップを管理
   */
  const [optimisticStatuses, updateOptimisticStatuses] = useOptimistic<
    Map<string, string>,
    OptimisticAction
  >(new Map(), (current, action) => {
    const next = new Map(current);
    if (action.type === 'APPROVE') {
      next.set(action.userId, 'CONFIRMED');
    } else {
      next.delete(action.userId);
    }
    return next;
  });

  /**
   * 楽観的更新のステータス変更ハンドラ（ApplicationCard に渡す）
   */
  const handleStatusChange = (
    userId: string,
    newStatus: 'CONFIRMED' | 'REJECTED',
  ) => {
    startTransition(() => {
      updateOptimisticStatuses(
        newStatus === 'CONFIRMED'
          ? { type: 'APPROVE', userId }
          : { type: 'REJECT', userId },
      );
    });
  };

  /**
   * フィルタリング後の申請一覧
   */
  const filteredApplications = applications.filter((app) => {
    const effectiveStatus =
      optimisticStatuses.get(app.userId) ?? app.participantStatus;
    if (activeTab === 'pending') return effectiveStatus === 'PENDING';
    if (activeTab === 'confirmed') return effectiveStatus === 'CONFIRMED';
    return true;
  });

  /**
   * 楽観的更新後の各タブのカウント
   */
  const optimisticPendingCount = applications.filter((app) => {
    const effectiveStatus =
      optimisticStatuses.get(app.userId) ?? app.participantStatus;
    return effectiveStatus === 'PENDING';
  }).length;

  const optimisticConfirmedCount = applications.filter((app) => {
    const effectiveStatus =
      optimisticStatuses.get(app.userId) ?? app.participantStatus;
    return effectiveStatus === 'CONFIRMED';
  }).length;

  /**
   * 空状態メッセージ
   */
  /** ARIA Authoring Practices: タブの矢印キーナビゲーション */
  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = -1;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % FILTER_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + FILTER_TABS.length) % FILTER_TABS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = FILTER_TABS.length - 1;
    }

    const nextTabValue = FILTER_TABS[nextIndex];
    if (nextIndex >= 0 && nextTabValue) {
      e.preventDefault();
      const nextTab = document.getElementById(`tab-${nextTabValue}`);
      nextTab?.focus();
      setActiveTab(nextTabValue);
    }
  };

  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'pending':
        return '承認待ちの申請はありません';
      case 'confirmed':
        return '承認済みの申請はありません';
      default:
        return '申請はまだありません';
    }
  };

  return (
    <main>
      {/* ページヘッダー */}
      <div className={styles.approval_header}>
        <div className={styles.approval_headerLeft}>
          <h1 className={styles.approval_title}>参加申請承認</h1>
          <div className={styles.approval_sessionInfo}>
            <p className={styles.approval_sessionName}>
              セッション: <strong>{sessionName}</strong>
            </p>
            <Badge variant="success">募集中</Badge>
          </div>
        </div>

        {/* 統計エリア */}
        <div className={styles.approval_statsArea}>
          <span className={styles.approval_statsLabel}>現在の参加予定者数</span>
          <div className={styles.approval_statsValue}>
            <span className={styles.approval_statsNumber}>
              {optimisticConfirmedCount}
            </span>
            {!isNil(maxPlayer) && (
              <span className={styles.approval_statsMax}>/ {maxPlayer}名</span>
            )}
          </div>
          {!isNil(maxPlayer) && (
            <Progress
              value={optimisticConfirmedCount}
              max={maxPlayer}
              showValue={false}
              label="参加予定者数"
              className={styles.approval_progressBar}
            />
          )}
        </div>
      </div>

      {/* フィルタータブ */}
      <div>
        <div className={styles.approval_filterTabs} role="tablist">
          <button
            type="button"
            role="tab"
            id="tab-all"
            aria-selected={activeTab === 'all'}
            aria-controls="tabpanel-applications"
            tabIndex={activeTab === 'all' ? 0 : -1}
            className={
              activeTab === 'all'
                ? styles.approval_filterTabActive
                : styles.approval_filterTab
            }
            onClick={() => setActiveTab('all')}
            onKeyDown={(e) => handleTabKeyDown(e, 0)}
          >
            すべて
            <span className={styles.approval_filterTabCount}>
              {applications.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-pending"
            aria-selected={activeTab === 'pending'}
            aria-controls="tabpanel-applications"
            tabIndex={activeTab === 'pending' ? 0 : -1}
            className={
              activeTab === 'pending'
                ? styles.approval_filterTabActive
                : styles.approval_filterTab
            }
            onClick={() => setActiveTab('pending')}
            onKeyDown={(e) => handleTabKeyDown(e, 1)}
          >
            承認待ち
            <span className={styles.approval_filterTabCount}>
              {optimisticPendingCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-confirmed"
            aria-selected={activeTab === 'confirmed'}
            aria-controls="tabpanel-applications"
            tabIndex={activeTab === 'confirmed' ? 0 : -1}
            className={
              activeTab === 'confirmed'
                ? styles.approval_filterTabActive
                : styles.approval_filterTab
            }
            onClick={() => setActiveTab('confirmed')}
            onKeyDown={(e) => handleTabKeyDown(e, 2)}
          >
            承認済み
            <span className={styles.approval_filterTabCount}>
              {optimisticConfirmedCount}
            </span>
          </button>
        </div>
      </div>

      {/* 申請カードグリッド */}
      <div
        role="tabpanel"
        id="tabpanel-applications"
        aria-labelledby={`tab-${activeTab}`}
      >
        {filteredApplications.length === 0 ? (
          <p className={styles.approval_empty}>{getEmptyMessage()}</p>
        ) : (
          <div className={styles.approval_grid}>
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.userId}
                application={application}
                sessionId={sessionId}
                optimisticStatus={optimisticStatuses.get(application.userId)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
