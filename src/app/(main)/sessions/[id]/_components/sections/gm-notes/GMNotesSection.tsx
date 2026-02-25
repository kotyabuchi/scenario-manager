import { Notepad, PencilSimple } from '@phosphor-icons/react/ssr';

import * as styles from '../../../styles';

import { Button } from '@/components/elements/button/button';

type GMNotesSectionProps = {
  memo: string | null;
  showEditButton?: boolean;
};

export const GMNotesSection = ({
  memo,
  showEditButton = false,
}: GMNotesSectionProps) => {
  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.memo_header}>
        <div className={styles.cardTitle}>
          <Notepad
            size={20}
            weight="fill"
            className={styles.sectionHeaderIconPrimary}
          />
          <h2>GMメモ</h2>
        </div>
        <div className={styles.sessionActions_secondaryGroup}>
          {showEditButton && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              status="primary"
              className={styles.editButton}
              disabled
              prefix={<PencilSimple size={16} />}
              aria-label="GMメモを編集（準備中）"
            >
              編集
            </Button>
          )}
          {/* GMのみ閲覧可バッジ */}
          <span className={styles.memo_badge}>GMのみ閲覧可</span>
        </div>
      </div>
      <hr className={styles.subtleHr} />

      {/* メモ内容 */}
      {/* TODO(human): Phase 2でインライン編集機能を実装予定 */}
      {memo ? (
        <p className={styles.memo_content}>{memo}</p>
      ) : (
        <p className={styles.memo_empty}>メモはありません</p>
      )}
    </section>
  );
};

export type { GMNotesSectionProps };
