import { Notepad } from '@phosphor-icons/react/ssr';

import * as styles from '../../../styles';

type GMNotesSectionProps = {
  memo: string | null;
};

export const GMNotesSection = ({ memo }: GMNotesSectionProps) => {
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
        {/* GMのみ閲覧可バッジ */}
        <span className={styles.memo_badge}>GMのみ閲覧可</span>
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
