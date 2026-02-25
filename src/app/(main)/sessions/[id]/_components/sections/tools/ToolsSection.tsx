import * as styles from '../../../styles';

import type { SessionLink, UserRole } from '../../../../interface';

type ToolsSectionProps = {
  links: SessionLink[];
  userRole: UserRole;
  sessionId: string;
};

export const ToolsSection = ({
  links: _links,
  userRole: _userRole,
  sessionId: _sessionId,
}: ToolsSectionProps) => {
  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h2>会場・ツール</h2>
        </div>
      </div>

      <div className={styles.tools_list}>
        <p className={styles.tools_empty}>この機能は現在準備中です</p>
      </div>
    </section>
  );
};

export type { ToolsSectionProps };
