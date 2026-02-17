'use client';

import { useMemo, useState, useTransition } from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';

import { deleteFeedbackAction } from '../../actions';
import * as styles from './styles';

import { FeedbackModal } from '@/components/blocks/FeedbackModal';
import { Button } from '@/components/elements/button/button';
import { Modal } from '@/components/elements/modal/modal';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';

import type { FeedbackFormValues } from '@/components/blocks/FeedbackModal/schema';

type ActionSectionProps = {
  feedbackId: string;
  isAuthor: boolean;
  status: string;
  feedback: {
    category: string;
    title: string;
    description: string;
  };
};

export const ActionSection = ({
  feedbackId,
  isAuthor,
  status,
  feedback,
}: ActionSectionProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { addMessage } = useSystemMessageActions();

  const editTarget = useMemo(
    () => ({
      feedbackId,
      category: feedback.category as FeedbackFormValues['category'],
      title: feedback.title,
      description: feedback.description,
    }),
    [feedbackId, feedback.category, feedback.title, feedback.description],
  );

  if (!isAuthor) return null;

  const canEdit = status === 'NEW' || status === 'TRIAGED';
  const canDelete = status === 'NEW';

  if (!canEdit && !canDelete) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteFeedbackAction(feedbackId);
      if (result.success) {
        addMessage('success', 'フィードバックを削除しました');
        router.push('/feedback');
      } else {
        setIsDeleteModalOpen(false);
        addMessage(
          'danger',
          '削除に失敗しました。時間をおいて再度お試しください',
        );
      }
    });
  };

  return (
    <div className={styles.actionSection}>
      {canEdit && (
        <>
          <Button
            variant="outline"
            status="primary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            aria-label="このフィードバックを編集"
          >
            <PencilSimple size={16} />
            編集
          </Button>
          <FeedbackModal
            open={isEditModalOpen}
            onOpenChange={(d) => setIsEditModalOpen(d.open)}
            editTarget={editTarget}
          />
        </>
      )}

      {canDelete && (
        <>
          <Button
            status="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            aria-label="このフィードバックを削除"
          >
            <Trash size={16} />
            削除
          </Button>

          <Modal
            open={isDeleteModalOpen}
            onOpenChange={(d) => setIsDeleteModalOpen(d.open)}
            title="フィードバックの削除"
            footer={
              <>
                <Button
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isPending}
                >
                  キャンセル
                </Button>
                <Button
                  status="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={isPending}
                  loadingText="削除中..."
                >
                  削除する
                </Button>
              </>
            }
          >
            <p className={styles.deleteConfirm_message}>
              このフィードバックを削除しますか？関連する投票・コメントもすべて削除されます。この操作は取り消せません。
            </p>
          </Modal>
        </>
      )}
    </div>
  );
};
