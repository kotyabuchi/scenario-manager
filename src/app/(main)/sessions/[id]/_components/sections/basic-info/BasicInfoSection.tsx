'use client';

import { useOptimistic, useState, useTransition } from 'react';
import {
  CalendarDotsIcon,
  Clock,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  User,
  Users,
  WarningCircle,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';

import { updateScenarioAction } from '../../../actions';
import * as styles from '../../../styles';
import { BasicInfoEditForm } from './BasicInfoEditForm';

import { ScenarioSearchModal } from '@/app/(main)/sessions/new/_components/sections/scenario/ScenarioSearchModal';
import { Button } from '@/components/elements/button/button';
import { Modal } from '@/components/elements/modal';

import type { ScenarioSummary } from '@/app/(main)/sessions/new/interface';
import type { ScenarioSystem, SessionDetail } from '../../../../interface';
import type { SessionBasicInfoValues } from '../../../schema';

type BasicInfoSectionProps = {
  session: SessionDetail;
  showEditButton?: boolean;
  systems?: ScenarioSystem[];
};

/**
 * 日付文字列を日本語フォーマットに変換する
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(date);
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(date);
};

const isSameDay = (a: string, b: string): boolean => {
  const aDate = new Date(a);
  const bDate = new Date(b);
  return (
    aDate.getFullYear() === bDate.getFullYear() &&
    aDate.getMonth() === bDate.getMonth() &&
    aDate.getDate() === bDate.getDate()
  );
};

const formatDateRange = (startAt: string, endAt: string): string => {
  if (isSameDay(startAt, endAt)) {
    return `${formatDate(startAt)}〜${formatTime(endAt)}`;
  }

  return `${formatDate(startAt)}〜${formatDate(endAt)}`;
};

export const BasicInfoSection = ({
  session,
  showEditButton = false,
  systems = [],
}: BasicInfoSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialInfo: SessionBasicInfoValues = {
    sessionName: session.sessionName,
    sessionDescription: session.sessionDescription,
    maxParticipantCount: session.maxParticipantCount,
    isBeginnerFriendly: session.isBeginnerFriendly,
  };

  const [optimisticInfo, setOptimisticInfo] = useOptimistic(initialInfo);

  const canEditScenario =
    showEditButton &&
    !isEditing &&
    (session.sessionPhase === 'RECRUITING' ||
      session.sessionPhase === 'PREPARATION');

  const handleScenarioSelect = (scenario: ScenarioSummary) => {
    setScenarioError(null);
    setIsScenarioModalOpen(false);
    startTransition(async () => {
      const result = await updateScenarioAction(
        session.gameSessionId,
        session.updatedAt,
        scenario.scenarioId,
      );
      if (!result.success) {
        if (result.error.message.includes('競合')) {
          setScenarioError('他の操作と競合しました。ページを更新してください');
        } else {
          setScenarioError(result.error.message);
        }
      }
    });
  };

  const handleScenarioRemove = () => {
    setScenarioError(null);
    setIsRemoveConfirmOpen(false);
    startTransition(async () => {
      const result = await updateScenarioAction(
        session.gameSessionId,
        session.updatedAt,
        null,
      );
      if (!result.success) {
        if (result.error.message.includes('競合')) {
          setScenarioError('他の操作と競合しました。ページを更新してください');
        } else {
          setScenarioError(result.error.message);
        }
      }
    });
  };

  const gmUser = session.keeper ?? session.creator;
  const gmParticipant = session.participants.find(
    (p) => p.userId === gmUser?.userId,
  );
  const gmDisplayName = gmParticipant?.user.nickname ?? gmUser?.userName;
  const gmHandleName = gmParticipant?.user.userName ?? gmUser?.userName;
  const hasConfirmedScheduleTimeBlocks = session.scheduleTimeBlocks.length > 0;

  const handleSaved = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <section className={styles.card}>
      <div className={styles.info_cardDecor} />
      <div className={styles.info_cardInner}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <h2>基本情報</h2>
          </div>
          {showEditButton && !isEditing && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              status="primary"
              className={styles.editButton}
              prefix={<PencilSimple size={16} />}
              aria-label="基本情報を編集"
              onClick={() => setIsEditing(true)}
            >
              編集
            </Button>
          )}
        </div>

        {isEditing ? (
          <BasicInfoEditForm
            sessionId={session.gameSessionId}
            initialValues={optimisticInfo}
            expectedUpdatedAt={session.updatedAt}
            onSaved={handleSaved}
            onCancel={handleCancel}
            onOptimisticUpdate={setOptimisticInfo}
          />
        ) : (
          <>
            {/* シナリオ名 */}
            <div>
              <div className={styles.info_scenarioHeader}>
                <p className={styles.info_scenarioLabel}>シナリオ</p>
                {canEditScenario && (
                  <div className={styles.info_scenarioActions}>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      status="primary"
                      prefix={<MagnifyingGlass size={14} />}
                      disabled={isPending}
                      onClick={() => setIsScenarioModalOpen(true)}
                      aria-label="シナリオを変更"
                    >
                      変更
                    </Button>
                    {session.scenario && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        status="danger"
                        prefix={<Trash size={14} />}
                        disabled={isPending}
                        onClick={() => setIsRemoveConfirmOpen(true)}
                        aria-label="シナリオを解除"
                      >
                        解除
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {session.scenario ? (
                <Link
                  href={`/scenarios/${session.scenario.scenarioId}`}
                  className={styles.info_scenarioName}
                >
                  {session.scenario.name}
                </Link>
              ) : (
                <p className={styles.info_valueText}>シナリオ未設定</p>
              )}
              {session.scenario?.system && (
                <p className={styles.info_scenarioSystemText}>
                  {session.scenario.system.name}
                </p>
              )}
              {scenarioError && (
                <p className={styles.info_scenarioError}>
                  <WarningCircle size={16} /> {scenarioError}
                </p>
              )}
            </div>

            {/* 募集文 */}
            {optimisticInfo.sessionDescription && (
              <>
                <hr className={styles.subtleHr} />
                <p className={styles.basicInfo_description}>
                  {optimisticInfo.sessionDescription}
                </p>
              </>
            )}

            {/* 初心者歓迎バッジ */}
            {optimisticInfo.isBeginnerFriendly && (
              <span className={styles.basicInfo_beginnerBadge}>初心者歓迎</span>
            )}

            {/* 詳細情報 */}
            <hr className={styles.subtleHr} />
            <div className={styles.info_details}>
              <div className={styles.info_detailItem}>
                <span className={styles.info_detailLabel}>
                  <CalendarDotsIcon size={16} />
                  日時
                </span>
                <div className={styles.info_valueText}>
                  {hasConfirmedScheduleTimeBlocks ? (
                    <ul className={styles.info_scheduleTimeBlockList}>
                      {session.scheduleTimeBlocks.map((block) => (
                        <li
                          key={block.gameScheduleTimeBlockId}
                          className={styles.info_scheduleTimeBlockItem}
                        >
                          {formatDateRange(block.startAt, block.endAt)}
                        </li>
                      ))}
                    </ul>
                  ) : session.scheduleDate ? (
                    `${formatDate(session.scheduleDate)}〜`
                  ) : (
                    '日程未確定'
                  )}
                </div>
              </div>

              {session.scenario &&
                (session.scenario.minPlaytime ??
                  session.scenario.maxPlaytime) !== null && (
                  <div className={styles.info_detailItem}>
                    <span className={styles.info_detailLabel}>
                      <Clock size={16} />
                      プレイ時間目安
                    </span>
                    <span className={styles.info_valueText}>
                      {session.scenario.minPlaytime !== null &&
                      session.scenario.maxPlaytime !== null
                        ? `${session.scenario.minPlaytime}〜${session.scenario.maxPlaytime}分`
                        : session.scenario.minPlaytime !== null
                          ? `${session.scenario.minPlaytime}分〜`
                          : `〜${session.scenario.maxPlaytime}分`}
                    </span>
                  </div>
                )}

              {/* 参加上限 */}
              <div className={styles.info_detailItem}>
                <span className={styles.info_detailLabel}>
                  <Users size={16} />
                  参加上限
                </span>
                <span className={styles.info_valueText}>
                  {optimisticInfo.maxParticipantCount === 0
                    ? '制限なし'
                    : `${optimisticInfo.maxParticipantCount}人`}
                </span>
              </div>
            </div>

            {/* GM/作成者情報 */}
            {gmUser && (
              <>
                <hr className={styles.subtleHr} />
                <div className={styles.info_gmBlock}>
                  <p className={styles.info_gmLabel}>ゲームマスター（GM）</p>
                  <div className={styles.info_gm}>
                    <div className={styles.info_gmAvatar}>
                      {gmParticipant?.user.image ? (
                        <Image
                          src={gmParticipant.user.image}
                          alt={`${gmDisplayName ?? 'GM'}のアバター`}
                          width={40}
                          height={40}
                          sizes="40px"
                          className={styles.participants_avatarImage}
                        />
                      ) : (
                        <div className={styles.info_gmAvatarInner}>
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={styles.info_gmName}>{gmDisplayName}</p>
                      {gmHandleName && (
                        <p className={styles.info_gmSubtext}>@{gmHandleName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* シナリオ検索モーダル */}
      <ScenarioSearchModal
        open={isScenarioModalOpen}
        onOpenChange={({ open }) => setIsScenarioModalOpen(open)}
        onSelect={handleScenarioSelect}
        systems={systems}
        invitedMembers={[]}
      />

      {/* シナリオ解除確認ダイアログ */}
      <Modal
        open={isRemoveConfirmOpen}
        onOpenChange={({ open }) => setIsRemoveConfirmOpen(open)}
        title="シナリオを解除"
        size="sm"
        headerVariant="danger"
        headerIcon={<WarningCircle size={20} />}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRemoveConfirmOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="solid"
              status="danger"
              size="sm"
              onClick={handleScenarioRemove}
              disabled={isPending}
            >
              解除する
            </Button>
          </>
        }
      >
        <p>
          「{session.scenario?.name}
          」の紐付けを解除します。この操作は後からやり直すことができます。
        </p>
      </Modal>
    </section>
  );
};

export type { BasicInfoSectionProps };
