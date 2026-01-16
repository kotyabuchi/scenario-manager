import * as styles from '../styles';

export const LoginFallback = () => (
  <div className={styles.container}>
    <div className={styles.card}>
      <h1 className={styles.title}>シナプレ管理くん</h1>
      <p className={styles.subtitle}>TRPGシナリオ・セッション管理</p>
      <div className={styles.loading}>読み込み中...</div>
    </div>
  </div>
);
