import { PencilSimple } from '@phosphor-icons/react/ssr';

import * as styles from '../../../styles';

import { Button } from '@/components/elements/button/button';

import type { SessionLink, UserRole } from '../../../../interface';

type ToolsSectionProps = {
  links: SessionLink[];
  userRole: UserRole;
  sessionId: string;
};

export const ToolsSection = ({
  links: _links,
  userRole,
  sessionId: _sessionId,
}: ToolsSectionProps) => {
  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h2>会場・ツール</h2>
        </div>
        {userRole === 'manager' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            status="primary"
            className={styles.editButton}
            disabled
            prefix={<PencilSimple size={16} />}
            aria-label="会場・ツールを編集（準備中）"
          >
            編集
          </Button>
        )}
      </div>

      <div className={styles.tools_list}>
        <p className={styles.tools_empty}>この機能は現在準備中です</p>
      </div>
    </section>
  );
};

export type { ToolsSectionProps };
