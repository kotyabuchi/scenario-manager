import * as styles from './styles';

export default function ScheduleLoading() {
  return (
    <div className={styles.pageContainer}>
      <div
        className={`${styles.loading_skeleton} ${styles.loading_backLink}`}
      />
      <div className={`${styles.loading_skeleton} ${styles.loading_title}`} />
      <div
        className={`${styles.loading_skeleton} ${styles.loading_subtitle}`}
      />
      <div className={styles.loading_cardSkeleton}>
        <div
          className={`${styles.loading_skeleton} ${styles.loading_sectionTitle}`}
        />
        <div
          className={`${styles.loading_skeleton} ${styles.loading_calendarArea}`}
        />
      </div>
      <div className={styles.loading_cardSkeleton}>
        <div
          className={`${styles.loading_skeleton} ${styles.loading_sectionTitle}`}
        />
        <div className={`${styles.loading_skeleton} ${styles.loading_line}`} />
        <div
          className={`${styles.loading_skeleton} ${styles.loading_lineShort}`}
        />
      </div>
    </div>
  );
}
