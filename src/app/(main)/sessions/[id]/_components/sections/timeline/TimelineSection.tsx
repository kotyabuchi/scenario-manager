import { Check, CheckCircle, Clock, UserPlus } from '@phosphor-icons/react/ssr';

import * as styles from '../../../styles';

import type { TimelineEvent } from '../../../../interface';

type TimelineSectionProps = {
  events: TimelineEvent[];
};

/**
 * 日付文字列を日本語フォーマットに変換する
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * イベントタイプに応じたアイコンとスタイルクラスを返す
 */
const getEventDisplay = (
  type: TimelineEvent['type'],
): { iconClassName: string; icon: React.ReactNode } => {
  switch (type) {
    case 'completed':
    case 'date_confirmed':
      return {
        iconClassName: styles.timeline_iconGreen,
        icon: <CheckCircle size={16} weight="fill" />,
      };
    case 'applied':
      return {
        iconClassName: styles.timeline_iconBlue,
        icon: <UserPlus size={16} weight="fill" />,
      };
    case 'approved':
      return {
        iconClassName: styles.timeline_iconGreen,
        icon: <Check size={16} weight="bold" />,
      };
    default:
      return {
        iconClassName: styles.timeline_iconDefault,
        icon: <Clock size={16} weight="fill" />,
      };
  }
};

export const TimelineSection = ({ events }: TimelineSectionProps) => {
  // 新しい順に並べ直す
  const sortedEvents = [...events].reverse();

  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h2>タイムライン</h2>
        </div>
      </div>

      {/* イベントリスト */}
      {sortedEvents.length > 0 ? (
        <ol className={styles.timeline_list}>
          {sortedEvents.map((event, index) => {
            const display = getEventDisplay(event.type);

            return (
              <li
                key={`${event.type}-${event.date}-${index}`}
                className={styles.timeline_item}
              >
                <div className={display.iconClassName}>{display.icon}</div>

                {/* イベント内容 */}
                <div className={styles.timeline_content}>
                  <p className={styles.timeline_date}>
                    {formatDate(event.date)}
                  </p>
                  <p className={styles.timeline_description}>
                    {event.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={styles.timeline_empty}>まだイベントはありません</p>
      )}
    </section>
  );
};

export type { TimelineSectionProps };
