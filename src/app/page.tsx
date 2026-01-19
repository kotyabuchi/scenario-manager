import { BookOpen, Calendar, Search } from 'lucide-react';
import Link from 'next/link';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

export const metadata = {
  title: 'シナプレ管理くん',
  description: 'TRPGセッションを、もっと快適に。',
};

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      {/* ヒーローセクション */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          TRPGセッションを、
          <br />
          もっと快適に。
        </h1>
        <p className={styles.heroSubtitle}>
          シナリオ検索・セッション管理・思い出の記録を一元化。
          <br />
          シナプレ管理くんで、あなたのTRPGライフをもっと楽しく。
        </p>
        <div className={styles.heroCTA}>
          <Link href="/login">
            <Button size="lg" status="primary" variant="solid">
              はじめる
            </Button>
          </Link>
          <Link href="/scenarios">
            <Button size="lg" status="primary" variant="outline">
              シナリオを探す
            </Button>
          </Link>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>主な機能</h2>
        <div className={styles.featuresList}>
          {/* 機能1: シナリオ検索 */}
          <div className={styles.featureCard_1}>
            <Search className={styles.featureIcon} />
            <h3 className={styles.featureCardTitle}>シナリオ検索</h3>
            <p className={styles.featureCardDescription}>
              システム・人数・時間・タグで条件を指定して、最適なシナリオを発見。未ログインでも利用できます。
            </p>
          </div>

          {/* 機能2: セッション管理 */}
          <div className={styles.featureCard_2}>
            <Calendar className={styles.featureIcon} />
            <h3 className={styles.featureCardTitle}>セッション管理</h3>
            <p className={styles.featureCardDescription}>
              日程調整・参加者管理を簡単に。予定の確認から完了まで、セッション運営をスムーズに。
            </p>
          </div>

          {/* 機能3: 思い出の記録 */}
          <div className={styles.featureCard_3}>
            <BookOpen className={styles.featureIcon} />
            <h3 className={styles.featureCardTitle}>思い出の記録</h3>
            <p className={styles.featureCardDescription}>
              レビュー・動画・プレイ履歴を一元管理。あの楽しかったセッションを振り返りましょう。
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © 2026 シナプレ管理くん. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
