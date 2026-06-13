'use client';

import { useState } from 'react';
import {
  ArrowSquareOut,
  DiscordLogo,
  GameController,
  Link as LinkIcon,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { IconButton } from '@/components/elements/icon-button/icon-button';
import { SessionLinkTypes } from '@/db/enum';

import type { SessionLink } from '../../../interface';

type LinkItemProps = {
  link: SessionLink;
  isManager: boolean;
  onEdit: (link: SessionLink) => void;
  onDelete: (linkId: string) => void;
  isPending: boolean;
};

/** linkType に応じたアイコンを返す */
const getLinkTypeIcon = (linkType: string) => {
  switch (linkType) {
    case 'DISCORD':
      return <DiscordLogo size={20} weight="fill" />;
    case 'CCFOLIA':
      return <GameController size={20} weight="fill" />;
    default:
      return <LinkIcon size={20} weight="bold" />;
  }
};

/** linkType を cva の linkType バリアントにマッピングする */
const getLinkTypeVariant = (
  linkType: string,
): 'discord' | 'ccfolia' | 'other' => {
  switch (linkType) {
    case 'DISCORD':
      return 'discord';
    case 'CCFOLIA':
      return 'ccfolia';
    default:
      return 'other';
  }
};

/** linkType の日本語ラベルを返す */
const getLinkTypeLabel = (linkType: string): string => {
  const found = Object.values(SessionLinkTypes).find(
    (item) => item.value === linkType,
  );
  return found?.label ?? linkType;
};

export const LinkItem = ({
  link,
  isManager,
  onEdit,
  onDelete,
  isPending,
}: LinkItemProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const displayLabel = link.label ?? getLinkTypeLabel(link.linkType);

  /** 削除確認をキャンセル */
  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  /** 削除を確定 */
  const handleConfirmDelete = () => {
    setIsConfirmingDelete(false);
    onDelete(link.linkId);
  };

  // 削除確認中の表示
  if (isConfirmingDelete) {
    return (
      <div className={styles.deleteConfirm}>
        <p className={styles.deleteConfirm_text}>
          「{displayLabel}」を削除しますか？
        </p>
        <div className={styles.deleteConfirm_actions}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancelDelete}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="sm"
            variant="solid"
            status="danger"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            削除
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.linkItem}>
      {/* アイコン */}
      <div
        className={styles.linkItem_icon({
          linkType: getLinkTypeVariant(link.linkType),
        })}
      >
        {getLinkTypeIcon(link.linkType)}
      </div>

      {/* コンテンツ */}
      <div className={styles.linkItem_content}>
        <span className={styles.linkItem_label}>{displayLabel}</span>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkItem_url}
        >
          {link.url}
          <ArrowSquareOut size={12} />
        </a>
      </div>

      {/* マネージャーのみ: 編集・削除ボタン */}
      {isManager && (
        <div className={styles.linkItem_actions}>
          <IconButton
            type="button"
            size="sm"
            variant="ghost"
            aria-label={`${displayLabel}を編集`}
            onClick={() => onEdit(link)}
            disabled={isPending}
          >
            <PencilSimple size={16} />
          </IconButton>
          <IconButton
            type="button"
            size="sm"
            variant="ghost"
            aria-label={`${displayLabel}を削除`}
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isPending}
          >
            <Trash size={16} />
          </IconButton>
        </div>
      )}
    </div>
  );
};

export type { LinkItemProps };
