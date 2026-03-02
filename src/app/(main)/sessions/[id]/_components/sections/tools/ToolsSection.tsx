'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Plus } from '@phosphor-icons/react/ssr';

import { deleteLinkAction, upsertLinkAction } from '../../../actions';
import * as pageStyles from '../../../styles';
import { LinkFormDialog } from './LinkFormDialog';
import { LinkItem } from './LinkItem';

import { Button } from '@/components/elements/button/button';

import type { SessionLink, UserRole } from '../../../../interface';
import type { SessionLinkValues } from '../../../schema';

type ToolsSectionProps = {
  links: SessionLink[];
  userRole: UserRole;
  sessionId: string;
};

type OptimisticAction =
  | { type: 'add'; link: SessionLink }
  | { type: 'update'; link: SessionLink }
  | { type: 'delete'; linkId: string };

/** 楽観的更新の reducer */
const optimisticReducer = (
  state: SessionLink[],
  action: OptimisticAction,
): SessionLink[] => {
  switch (action.type) {
    case 'add':
      return [...state, action.link];
    case 'update':
      return state.map((link) =>
        link.linkId === action.link.linkId ? action.link : link,
      );
    case 'delete':
      return state.filter((link) => link.linkId !== action.linkId);
  }
};

export const ToolsSection = ({
  links,
  userRole,
  sessionId,
}: ToolsSectionProps) => {
  const isManager = userRole === 'manager';
  const [isPending, startTransition] = useTransition();
  const [optimisticLinks, dispatchOptimistic] = useOptimistic(
    links,
    optimisticReducer,
  );

  // ダイアログ状態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SessionLink | undefined>(
    undefined,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  /** 追加ボタン押下 */
  const handleOpenAdd = () => {
    setEditingLink(undefined);
    setServerError(null);
    setDialogOpen(true);
  };

  /** 編集ボタン押下 */
  const handleEdit = (link: SessionLink) => {
    setEditingLink(link);
    setServerError(null);
    setDialogOpen(true);
  };

  /** ダイアログ開閉 */
  const handleOpenChange = (details: { open: boolean }) => {
    setDialogOpen(details.open);
    if (!details.open) {
      setServerError(null);
    }
  };

  /** 追加・更新の実行 */
  const handleAddOrUpdate = (data: SessionLinkValues) => {
    setServerError(null);

    const isUpdate = Boolean(data.linkId);

    startTransition(async () => {
      // 楽観的更新用の仮リンク
      const optimisticLink: SessionLink = {
        linkId: data.linkId ?? `temp-${Date.now()}`,
        linkType: data.linkType,
        url: data.url,
        label: data.label ?? null,
        sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isUpdate) {
        dispatchOptimistic({ type: 'update', link: optimisticLink });
      } else {
        dispatchOptimistic({ type: 'add', link: optimisticLink });
      }

      const result = await upsertLinkAction(sessionId, data);

      if (!result.success) {
        setServerError(result.error?.message ?? '保存に失敗しました');
      } else {
        setDialogOpen(false);
      }
    });
  };

  /** 削除の実行 */
  const handleDelete = (linkId: string) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'delete', linkId });

      const result = await deleteLinkAction(linkId, sessionId);

      if (!result.success) {
        // ロールバックは useOptimistic が自動で行う
        setServerError(result.error?.message ?? '削除に失敗しました');
      }
    });
  };

  return (
    <section className={pageStyles.card}>
      {/* ヘッダー */}
      <div className={pageStyles.cardHeader}>
        <div className={pageStyles.cardTitle}>
          <h2>会場・ツール</h2>
        </div>
        {isManager && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            status="primary"
            onClick={handleOpenAdd}
            disabled={isPending}
            prefix={<Plus size={16} />}
            aria-label="リンクを追加"
          >
            追加
          </Button>
        )}
      </div>

      <div className={pageStyles.tools_list}>
        {optimisticLinks.length === 0 ? (
          <p className={pageStyles.tools_empty}>
            リンクはまだ追加されていません
          </p>
        ) : (
          optimisticLinks.map((link) => (
            <LinkItem
              key={link.linkId}
              link={link}
              isManager={isManager}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))
        )}
      </div>

      {/* リンク追加・編集ダイアログ */}
      <LinkFormDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        editingLink={editingLink}
        onSubmit={handleAddOrUpdate}
        isPending={isPending}
        serverError={serverError}
      />
    </section>
  );
};

export type { ToolsSectionProps };
