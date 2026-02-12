import * as styles from './styles';

export default function HomeLoading() {
  return (
    <div className={styles.pageContainer}>
      {/* ヒーローセクション */}
      <div className={styles.hero_container}>
        <div className={styles.hero_textArea}>
          <div className={styles.loading_flexColumn}>
            <div
              className={`${styles.loading_skeleton} ${styles.loading_heroTitle}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_heroSubtitle}`}
            />
          </div>
        </div>
        <div
          className={`${styles.loading_skeleton} ${styles.loading_heroCard}`}
        />
      </div>

      {/* メインコンテンツグリッド */}
      <div className={styles.pageGrid}>
        <div className={styles.mainColumn}>
          {/* セッション一覧 */}
          <section>
            <div className={styles.sectionHeader}>
              <div className={styles.loading_flexCenter}>
                <div
                  className={`${styles.loading_skeleton} ${styles.loading_accentBar}`}
                />
                <div
                  className={`${styles.loading_skeleton} ${styles.loading_sectionTitleWide}`}
                />
              </div>
            </div>
            <div className={styles.sessions_list}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.sessions_card}>
                  <div className={styles.sessions_leftBlock}>
                    <div
                      className={`${styles.loading_skeleton} ${styles.loading_thumbnail}`}
                    />
                    <div className={styles.loading_flexColumn}>
                      <div
                        className={`${styles.loading_skeleton} ${styles.loading_dateLabel}`}
                      />
                      <div
                        className={`${styles.loading_skeleton} ${styles.loading_sessionName}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* アクティビティ */}
          <section>
            <div className={styles.sectionHeader}>
              <div className={styles.loading_flexCenter}>
                <div
                  className={`${styles.loading_skeleton} ${styles.loading_accentBar}`}
                />
                <div
                  className={`${styles.loading_skeleton} ${styles.loading_sectionTitleMedium}`}
                />
              </div>
            </div>
            <div className={styles.activity_container}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.loading_activityRow}>
                  <div
                    className={`${styles.loading_skeletonRound} ${styles.loading_activityIcon}`}
                  />
                  <div
                    className={`${styles.loading_skeleton} ${styles.loading_activityText}`}
                  />
                  <div
                    className={`${styles.loading_skeleton} ${styles.loading_activityTimestamp}`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 新着シナリオ */}
          <section>
            <div className={styles.sectionHeader}>
              <div className={styles.loading_flexCenter}>
                <div
                  className={`${styles.loading_skeleton} ${styles.loading_accentBar}`}
                />
                <div
                  className={`${styles.loading_skeleton} ${styles.loading_sectionTitleNarrow}`}
                />
              </div>
            </div>
            <div className={styles.scenarioGrid}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`${styles.loading_skeleton} ${styles.loading_scenarioCard}`}
                />
              ))}
            </div>
          </section>
        </div>

        {/* サイドバー */}
        <div className={styles.sidebarColumn}>
          <div className={styles.sidebarCard}>
            <div
              className={`${styles.loading_skeleton} ${styles.loading_sidebarLabel}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_calendarArea}`}
            />
            <hr className={styles.sidebarDivider} />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_noticeLabel}`}
            />
            <div
              className={`${styles.loading_skeleton} ${styles.loading_noticeCard}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
