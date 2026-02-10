import { BookOpen, Calendar, Search, Shield, Star } from 'lucide-react';
import Link from 'next/link';

import { DiscordLoginButton } from './_components/DiscordLoginButton';
import * as styles from './styles';

export const metadata = {
  title: 'シナプレ管理くん',
  description: 'TRPGセッションをもっと快適に。',
};

export default function Home() {
  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Logo */}
          <div className={styles.heroLogo}>
            <div className={styles.heroLogoIcon}>
              <BookOpen size={28} className={styles.iconColor_primary} />
            </div>
            <span className={styles.heroLogoText}>シナプレ管理くん</span>
          </div>

          {/* Catch copy */}
          <h1 className={styles.heroCatch}>TRPGセッションをもっと快適に</h1>
          <p className={styles.heroSub}>
            シナリオ検索・セッション管理・思い出の記録をひとつのアプリで
          </p>

          {/* CTA buttons */}
          <div className={styles.heroCTA}>
            <Link href="/scenarios" className={styles.browseBtn}>
              <Search size={20} className={styles.browseBtnIcon} />
              <span className={styles.browseBtnText}>まずは見てみる</span>
            </Link>
            <DiscordLoginButton
              className={styles.heroCTABtn}
              iconClassName={styles.heroCTABtnIcon}
              textClassName={styles.heroCTABtnText}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>主な機能</h2>
        <section
          className={styles.featuresGrid}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: スクロール可能な領域にキーボードアクセスを提供
          tabIndex={0}
          aria-label="主な機能一覧"
        >
          {/* Feature 1: シナリオ検索 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon_search}>
              <Search size={24} className={styles.iconColor_primary} />
            </div>
            <h3 className={styles.featureTitle}>シナリオ検索</h3>
            <p className={styles.featureDesc}>
              {
                'システム・人数・時間・タグで\n次に遊ぶシナリオを効率的に見つける'
              }
            </p>
          </div>

          {/* Feature 2: セッション管理 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon_calendar}>
              <Calendar size={24} className={styles.iconColor_indigo} />
            </div>
            <h3 className={styles.featureTitle}>セッション管理</h3>
            <p className={styles.featureDesc}>
              {'日程調整・参加者管理の\n煩雑さを解消して快適に計画'}
            </p>
          </div>

          {/* Feature 3: 思い出の記録 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon_star}>
              <Star size={24} className={styles.iconColor_orange} />
            </div>
            <h3 className={styles.featureTitle}>思い出の記録</h3>
            <p className={styles.featureDesc}>
              {'プレイ履歴・動画・レビューを\n一元管理していつでも振り返れる'}
            </p>
          </div>

          {/* Feature 4: ネタバレ保護 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon_shield}>
              <Shield size={24} className={styles.iconColor_red} />
            </div>
            <h3 className={styles.featureTitle}>ネタバレ保護</h3>
            <p className={styles.featureDesc}>
              {'未プレイユーザーへの配慮を\n徹底して安心・安全に利用できる'}
            </p>
          </div>
        </section>
      </section>

      {/* How to Use Section */}
      <section className={styles.howtoSection}>
        <h2 className={styles.howtoTitle}>かんたんな使い方</h2>
        <div className={styles.howtoSteps}>
          {/* Step 1 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>
              <span className={styles.stepNumText}>1</span>
            </div>
            <h3 className={styles.stepTitle}>シナリオを探す</h3>
            <p className={styles.stepDesc}>
              {
                'ログイン不要で\nシナリオを検索・閲覧。\nまずは気軽に見てみましょう。'
              }
            </p>
          </div>

          {/* Step 2 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>
              <span className={styles.stepNumText}>2</span>
            </div>
            <h3 className={styles.stepTitle}>Discordでログイン</h3>
            <p className={styles.stepDesc}>
              {
                'セッションを立てたり\nブックマークしたいときは\nDiscordでログイン。'
              }
            </p>
          </div>

          {/* Step 3 */}
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>
              <span className={styles.stepNumText}>3</span>
            </div>
            <h3 className={styles.stepTitle}>セッションを立てる</h3>
            <p className={styles.stepDesc}>
              {'セッションを作成して\n参加者を募集。\n日程調整も簡単です。'}
            </p>
          </div>
        </div>
      </section>

      {/* Systems Section */}
      <section className={styles.systemsSection}>
        <h2 className={styles.systemsTitle}>対応システム</h2>
        <p className={styles.systemsSub}>
          人気のTRPGシステムに対応。ユーザーが自由に追加できます。
        </p>
        <div className={styles.systemsGrid}>
          <span className={styles.systemBadge_coc}>CoC6版</span>
          <span className={styles.systemBadge_coc}>CoC7版</span>
          <span className={styles.systemBadge_sw}>SW2.5</span>
          <span className={styles.systemBadge_insane}>インセイン</span>
          <span className={styles.systemBadge_shinobigami}>シノビガミ</span>
          <span className={styles.systemBadge_emochloa}>エモクロア</span>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>さあ、はじめよう</h2>
        <p className={styles.ctaSub}>無料で今すぐ始められます</p>
        <DiscordLoginButton
          className={styles.ctaBtn}
          iconClassName={styles.ctaBtnIcon}
          textClassName={styles.ctaBtnText}
        />
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <div className={styles.footerLogoIcon}>
            <BookOpen size={18} className={styles.iconColor_primary} />
          </div>
          <span className={styles.footerLogoText}>シナプレ管理くん</span>
        </div>
        <p className={styles.footerCopy}>
          © 2026 シナプレ管理くん. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
