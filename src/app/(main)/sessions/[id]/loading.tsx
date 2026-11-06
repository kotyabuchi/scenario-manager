import * as styles from './styles';

export default function SessionDetailLoading() {
  return (
    <div className={styles.pageContainer} aria-busy="true">
      <span className="sr-only">読み込み中</span>
      {/* タイトル */}
      <div
        className={`${styles.loading_skeleton} ${styles.loading_titleBar}`}
      />
      <div
        className={`${styles.loading_skeleton} ${styles.loading_subtitleBar}`}
      />

      {/* 2カラムグリッド */}
      <div className={styles.pageGrid}>
        <div className={styles.mainColumn}>
          {/* 基本情報カード */}
          <div className={styles.loading_cardSkeleton}>
            <div
              className={`${styles.loading_skeleton} ${styles.loading_line}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_lineShort}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_line}`}
            />
          </div>

          {/* 参加者カード */}
          <div className={styles.loading_cardSkeleton}>
            <div
              className={`${styles.loading_skeleton} ${styles.loading_line}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_lineShort}`}
            />
          </div>
        </div>

        <div className={styles.sidebarColumn}>
          {/* サイドバーカード */}
          <div className={styles.loading_cardSkeleton}>
            <div
              className={`${styles.loading_skeleton} ${styles.loading_line}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_lineShort}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_line}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
