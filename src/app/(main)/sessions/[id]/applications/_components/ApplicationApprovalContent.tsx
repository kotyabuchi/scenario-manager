'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { isNil } from 'ramda';

import * as styles from '../styles';
import { ApplicationCard } from './ApplicationCard';
import { FilterBar } from './FilterBar';

import { Badge } from '@/components/elements/badge';
import { Pagination } from '@/components/elements/pagination';
import { Progress } from '@/components/elements/progress';

import type { ApplicationWithUser } from '../adapter';

/** 1ページあたりの表示件数（2列 x 3行） */
const ITEMS_PER_PAGE = 6;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('newest');
  const [filterValue, setFilterValue] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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
   * 楽観的更新後の承認済みカウント（ヘッダー統計表示用）
   */
  const optimisticConfirmedCount = applications.filter((app) => {
    const effectiveStatus =
      optimisticStatuses.get(app.userId) ?? app.participantStatus;
    return effectiveStatus === 'CONFIRMED';
  }).length;

  /**
   * フィルタリング・ソート・検索を適用した申請一覧
   */
  const filteredApplications = applications
    .filter((app) => {
      if (filterValue === 'all') return true;
      const effectiveStatus =
        optimisticStatuses.get(app.userId) ?? app.participantStatus;
      return filterValue === 'pending'
        ? effectiveStatus === 'PENDING'
        : effectiveStatus === 'CONFIRMED';
    })
    .filter((app) => {
      if (searchQuery === '') return true;
      const query = searchQuery.toLowerCase();
      const name = app.user.userName.toLowerCase();
      const nick = (app.user.nickname ?? '').toLowerCase();
      return name.includes(query) || nick.includes(query);
    })
    .toSorted((a, b) => {
      if (sortValue === 'name') {
        return a.user.userName.localeCompare(b.user.userName, 'ja');
      }
      const aTime = a.appliedAt ?? '';
      const bTime = b.appliedAt ?? '';
      return sortValue === 'newest'
        ? bTime.localeCompare(aTime)
        : aTime.localeCompare(bTime);
    });

  /**
   * ページネーション計算
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredApplications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

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
            {!isNil(maxPlayer) && maxPlayer > 0 && (
              <span className={styles.approval_statsMax}>/ {maxPlayer}名</span>
            )}
          </div>
          {!isNil(maxPlayer) && maxPlayer > 0 && (
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

      {/* フィルターバー */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        sortValue={sortValue}
        onSortChange={(v) => {
          setSortValue(v);
          setCurrentPage(1);
        }}
        filterValue={filterValue}
        onFilterChange={(v) => {
          setFilterValue(v);
          setCurrentPage(1);
        }}
      />

      {/* 申請カードグリッド */}
      {filteredApplications.length === 0 ? (
        <p className={styles.approval_empty}>
          {searchQuery
            ? '検索条件に一致する申請はありません'
            : filterValue !== 'all'
              ? `${filterValue === 'pending' ? '承認待ち' : '承認済み'}の申請はありません`
              : '申請はまだありません'}
        </p>
      ) : (
        <>
          <div className={styles.approval_grid}>
            {pageItems.map((application) => (
              <ApplicationCard
                key={application.userId}
                application={application}
                sessionId={sessionId}
                optimisticStatus={optimisticStatuses.get(application.userId)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.approval_pagination}>
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
};
