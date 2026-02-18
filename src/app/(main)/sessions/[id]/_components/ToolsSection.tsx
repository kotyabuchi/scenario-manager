import {
  CalendarPlus,
  DiscordLogo,
  GameController,
  Link as LinkIcon,
} from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import type { SessionLink, UserRole } from '../../interface';

type ToolsSectionProps = {
  links: SessionLink[];
  userRole: UserRole;
  sessionId: string;
};

/**
 * リンクタイプに応じたアイコンとスタイルクラスを返す
 */
const getLinkDisplay = (
  linkType: string,
): {
  icon: React.ReactNode;
  linkClassName: string;
  defaultLabel: string;
} => {
  switch (linkType) {
    case 'DISCORD':
      return {
        icon: <DiscordLogo size={16} weight="fill" />,
        linkClassName: styles.tools_linkPrimary,
        defaultLabel: 'Discordサーバー',
      };
    case 'CCFOLIA':
      return {
        icon: <GameController size={16} />,
        linkClassName: styles.tools_linkSecondary,
        defaultLabel: 'ココフォリア',
      };
    default:
      return {
        icon: <LinkIcon size={16} />,
        linkClassName: styles.tools_linkSecondary,
        defaultLabel: 'リンク',
      };
  }
};

export const ToolsSection = ({
  links,
  userRole: _userRole,
  sessionId: _sessionId,
}: ToolsSectionProps) => {
  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.accentBar} />
          <h2>会場・ツール</h2>
        </div>
      </div>

      <div className={styles.tools_list}>
        {links.length > 0 ? (
          <>
            {/* リンク一覧 */}
            {links.map((link) => {
              const display = getLinkDisplay(link.linkType);
              return (
                <a
                  key={link.linkId}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.tools_linkButton} ${display.linkClassName}`}
                  aria-label={`${link.label ?? display.defaultLabel}（新しいタブで開く）`}
                >
                  {display.icon}
                  <span>{link.label ?? display.defaultLabel}</span>
                </a>
              );
            })}

            {/* カレンダー追加ボタン（リンクがある場合のみ表示） */}
            <button
              type="button"
              className={styles.tools_calendarLink}
              disabled
              aria-describedby="calendar-add-disabled-reason"
            >
              <CalendarPlus size={16} />
              <span>カレンダーに追加</span>
            </button>
            <p id="calendar-add-disabled-reason" className="sr-only">
              この機能は現在準備中です
            </p>
          </>
        ) : (
          <p className={styles.tools_empty}>リンクが登録されていません</p>
        )}
      </div>
    </section>
  );
};

export type { ToolsSectionProps };
