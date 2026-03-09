import * as styles from './styles';

export default function ApplicationsLoading() {
  return (
    <div className={styles.approval_container}>
      <div
        className={`${styles.loading_skeleton} ${styles.loading_breadcrumb}`}
      />
      <div className={`${styles.loading_skeleton} ${styles.loading_title}`} />
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
  );
}
