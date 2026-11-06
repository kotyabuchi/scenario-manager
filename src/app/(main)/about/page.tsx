import Link from 'next/link';

import * as styles from './styles';

const START_YEAR = 2026;

export const metadata = {
  title: 'サービスについて',
  description: 'シナプレ管理くんの概要と権利表記',
};

export default function AboutPage() {
  const currentYear = new Date().getFullYear();
  const years =
    currentYear <= START_YEAR
      ? `${START_YEAR}`
      : `${START_YEAR}-${currentYear}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>サービスについて</h1>
        <p className={styles.description}>
          シナプレ管理くんは、TRPGのシナリオ検索とセッション管理をまとめるWebアプリです。
        </p>
      </header>

      <section className={styles.section} aria-labelledby="copyright-heading">
        <h2 id="copyright-heading" className={styles.sectionTitle}>
          権利表記
        </h2>
        <p className={styles.copyright}>
          © {years} シナプレ管理くん. All rights reserved.
        </p>
      </section>

      <Link href="/scenarios" className={styles.scenarioLink}>
        シナリオを探す
      </Link>
    </div>
  );
}
