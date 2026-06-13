import * as styles from './styles';

export default function ApplicationsLoading() {
  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.loading_skeleton} ${styles.loading_header}`} />
      <div className={styles.mainContent}>
        <div
          className={`${styles.loading_skeleton} ${styles.loading_subtitle}`}
        />
        <div
          className={`${styles.loading_skeleton} ${styles.loading_filterBar}`}
        />
        <div className={styles.approval_grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.loading_cardSkeleton}>
              <div
                className={`${styles.loading_skeleton} ${styles.loading_line}`}
              />
              <div
                className={`${styles.loading_skeleton} ${styles.loading_lineShort}`}
              />
            </div>
          ))}
        </div>
        <div
          className={`${styles.loading_skeleton} ${styles.loading_pagination}`}
        />
      </div>
    </div>
  );
}
