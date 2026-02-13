import { notFound } from 'next/navigation';
import { isNil } from 'ramda';

import {
  ReviewSection,
  ScenarioHeader,
  ScenarioInfo,
  SessionSection,
  VideoSection,
} from './_components';
import { toggleFavoriteAction } from './actions';
import {
  getScenarioDetail,
  getScenarioReviews,
  getScenarioSessions,
  getScenarioVideoLinks,
  getUserByDiscordId,
  getUserScenarioPreference,
} from './adapter';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'シナリオ詳細',
  description: 'シナリオの詳細情報',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScenarioDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 認証情報の取得
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Supabaseの認証IDからアプリのユーザーIDを取得
  let currentUserId: string | undefined;
  if (authUser) {
    const userResult = await getUserByDiscordId(authUser.id);
    if (userResult.success && userResult.data) {
      currentUserId = userResult.data.userId;
    }
  }

  // データ取得（Cloudflare Workers環境では順次実行で安定性を確保）
  const scenarioResult = await getScenarioDetail(id);
  const reviewsResult = await getScenarioReviews(id, 'newest', 10, 0);
  const sessionsResult = await getScenarioSessions(id, 10);
  const videosResult = await getScenarioVideoLinks(id, 20);

  if (!scenarioResult.success || isNil(scenarioResult.data)) {
    notFound();
  }

  const scenario = scenarioResult.data;
  const reviews = reviewsResult.success ? reviewsResult.data.reviews : [];
  const reviewTotalCount = reviewsResult.success
    ? reviewsResult.data.totalCount
    : 0;
  const sessions = sessionsResult.success ? sessionsResult.data : [];
  const videos = videosResult.success ? videosResult.data : [];

  // ユーザーの経験情報を取得
  let userPreference = null;
  if (!isNil(currentUserId)) {
    const prefResult = await getUserScenarioPreference(id, currentUserId);
    if (prefResult.success) {
      userPreference = prefResult.data;
    }
  }

  const isFavorite = userPreference?.isLike ?? false;
  const isPlayed = userPreference?.isPlayed ?? false;
  const isLoggedIn = !isNil(currentUserId);

  // お気に入りトグルのServer Action
  const handleToggleFavorite = async () => {
    'use server';
    if (isNil(currentUserId)) return;
    await toggleFavoriteAction(id, currentUserId);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Sub Header（戻るボタン + お気に入り） */}
      <ScenarioHeader
        scenarioName={scenario.name}
        isFavorite={isFavorite}
        isLoggedIn={isLoggedIn}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* メインコンテンツ */}
      <div className={styles.mainContent}>
        {/* ファーストビュー: シナリオ基本情報 */}
        <ScenarioInfo scenario={scenario} />

        <hr className={styles.divider} />

        {/* 関連セッションセクション */}
        <SessionSection scenarioId={id} sessions={sessions} />

        <hr className={styles.divider} />

        {/* プレイ動画セクション */}
        <VideoSection videos={videos} isPlayed={isPlayed} />

        <hr className={styles.divider} />

        {/* レビューセクション */}
        <ReviewSection
          reviews={reviews}
          totalCount={reviewTotalCount}
          {...(currentUserId ? { currentUserId } : {})}
          scenarioId={id}
          isPlayed={isPlayed}
        />
      </div>

      {/* ScenarioFAB は SpeedDialFAB に統合済み */}
      {/* プレイ済み登録・シナリオ編集のページ内UI移設は別タスクで対応 */}
    </div>
  );
}
