'use client';

import { useOptimistic, useTransition } from 'react';
import { CaretLeft, NotePencil, Star, X } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { isNil } from 'ramda';

import { ReviewSection } from '../ReviewSection';
import { SessionSection } from '../SessionSection';
import { VideoSection } from '../VideoSection';
import { ScenarioDetailHead } from './ScenarioDetailHead';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { buttonLabel } from '@/components/elements/button/styles';

import type {
  ReviewWithUser,
  ScenarioDetail,
  SessionWithKeeper,
  VideoLinkWithSession,
} from '../../interface';

export type ScenarioDetailPanelProps = {
  scenario: ScenarioDetail;
  sessions: SessionWithKeeper[];
  videos: VideoLinkWithSession[];
  reviews: ReviewWithUser[];
  reviewTotalCount: number;
  currentUserId?: string;
  isFavorite?: boolean;
  isPlayed?: boolean;
  isLoggedIn?: boolean;
  onToggleFavorite?: () => Promise<void>;
  /**
   * 表示コンテキスト。
   * - `pane`: 一覧の隣に表示する2ペインの右パネル。一覧へのリンクは「閉じる」
   * - `page`: 直URL・リロード・狭い画面での単独ページ。リンクは「シナリオ一覧に戻る」
   * @default 'pane'
   */
  variant?: 'pane' | 'page';
};

/**
 * ScenarioDetailPanel - シナリオ詳細ペイン（2ペイン右側）
 *
 * セクション縦並び（ScenarioDetailHead / SessionSection / VideoSection /
 * ReviewSection）を束ねる。**タブは使わない**（全セクション常時表示）。
 * 目次（SectionToc）はパネル内には置かない（必要になればページ側で検討）。
 * ヘッダーは構成検討中のため一旦未配置。
 */
export const ScenarioDetailPanel = ({
  scenario,
  sessions,
  videos,
  reviews,
  reviewTotalCount,
  currentUserId,
  isFavorite = false,
  isPlayed = false,
  isLoggedIn = false,
  onToggleFavorite,
  variant = 'pane',
}: ScenarioDetailPanelProps) => {
  const scenarioId = scenario.scenarioId;

  const [, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  const handleToggleFavorite = () => {
    if (isNil(onToggleFavorite)) return;
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite);
      await onToggleFavorite();
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.main}>
        <div className={styles.mainCard}>
          {/* ヘッダーバー: 戻るリンク＋主要アクション（主カード内・モック準拠） */}
          <div className={styles.headerBar}>
            {variant === 'pane' ? (
              // 2ペイン: 広い画面では隣に一覧が見えるので「閉じる」、
              // lg未満は一覧が隠れて単独表示になるため「戻る」をCSSで出し分け
              <>
                <Link
                  href="/scenarios"
                  className={`${styles.headerBar_back} ${styles.headerBar_backWide}`}
                >
                  <X size={16} />
                  <span>閉じる</span>
                </Link>
                <Link
                  href="/scenarios"
                  className={`${styles.headerBar_back} ${styles.headerBar_backNarrow}`}
                >
                  <CaretLeft size={16} />
                  <span>シナリオ一覧に戻る</span>
                </Link>
              </>
            ) : (
              // 単独ページ: 一覧は画面にないので常に「戻る」
              <Link href="/scenarios" className={styles.headerBar_back}>
                <CaretLeft size={16} />
                <span>シナリオ一覧に戻る</span>
              </Link>
            )}
            <div className={styles.headerBar_actions}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={!isLoggedIn}
                aria-pressed={optimisticFavorite}
                prefix={
                  <Star
                    size={16}
                    weight={optimisticFavorite ? 'fill' : 'regular'}
                    className={
                      optimisticFavorite
                        ? styles.headerBar_starActive
                        : undefined
                    }
                  />
                }
              >
                お気に入り
              </Button>
              <Button variant="solid" status="primary" size="sm" asChild>
                <Link
                  href={
                    `/sessions/new?scenarioId=${scenarioId}` as '/sessions/new'
                  }
                >
                  {/* asChild は Button の自動ラベルラップが効かないため、ラベルスタイルを直接適用 */}
                  <NotePencil size={16} />
                  <span className={buttonLabel}>セッションを作成</span>
                </Link>
              </Button>
            </div>
          </div>

          <section id="info" className={styles.sectionAnchor}>
            <ScenarioDetailHead scenario={scenario} />
          </section>

          {!isNil(scenario.description) && (
            <section id="overview" className={styles.sectionAnchor}>
              <h2 className={styles.overview_title}>シナリオ概要</h2>
              <p className={styles.overview_text}>{scenario.description}</p>
            </section>
          )}
        </div>

        <div className={styles.sectionsGrid}>
          <section
            id="sessions"
            className={`${styles.sectionAnchor} ${styles.sectionCard}`}
          >
            <SessionSection scenarioId={scenarioId} sessions={sessions} />
          </section>

          <section
            id="videos"
            className={`${styles.sectionAnchor} ${styles.sectionCard}`}
          >
            <VideoSection videos={videos} isPlayed={isPlayed} />
          </section>

          <section
            id="comments"
            className={`${styles.sectionAnchor} ${styles.sectionCard}`}
          >
            <ReviewSection
              reviews={reviews}
              totalCount={reviewTotalCount}
              {...(currentUserId ? { currentUserId } : {})}
              scenarioId={scenarioId}
              isPlayed={isPlayed}
            />
          </section>
        </div>
      </div>
    </div>
  );
};
