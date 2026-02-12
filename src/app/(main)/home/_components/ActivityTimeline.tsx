import {
  BookmarkSimple,
  CheckCircle,
  PencilSimple,
  UserPlus,
} from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import { formatRelativeTime } from '@/lib/formatters';

import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import type { ActivityItem, ActivityTimelineProps } from '../interface';

const activityConfig: Record<
  ActivityItem['type'],
  { icon: Icon; iconCircleStyle: string }
> = {
  participant_joined: {
    icon: UserPlus,
    iconCircleStyle: styles.activity_iconCircleBlue,
  },
  scenario_updated: {
    icon: PencilSimple,
    iconCircleStyle: styles.activity_iconCircleAmber,
  },
  session_completed: {
    icon: CheckCircle,
    iconCircleStyle: styles.activity_iconCircleGreen,
  },
  review_created: {
    icon: BookmarkSimple,
    iconCircleStyle: styles.activity_iconCircleDefault,
  },
};

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionAccentBar} />
          最近のアクティビティ
        </h2>
      </div>

      <div className={styles.activity_container}>
        {activities.length === 0 ? (
          <p className={styles.activity_empty}>
            最近のアクティビティはありません
          </p>
        ) : (
          <div className={styles.activity_list}>
            {activities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;
              return (
                <div key={activity.id} className={styles.activity_item}>
                  <div className={config.iconCircleStyle}>
                    <Icon size={16} weight="fill" />
                  </div>
                  <p className={styles.activity_text}>{activity.description}</p>
                  <span className={styles.activity_timestamp}>
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
