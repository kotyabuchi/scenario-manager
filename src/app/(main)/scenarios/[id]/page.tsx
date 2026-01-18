import { notFound } from 'next/navigation';
import { isNil } from 'ramda';

import {
  ReviewSection,
  ScenarioFAB,
  ScenarioHeader,
  ScenarioInfo,
  SessionSection,
  VideoSection,
} from './_components';
import { toggleFavoriteAction, togglePlayedAction } from './actions';
import {
  getScenarioDetail,
  getScenarioReviews,
  getScenarioSessions,
  getScenarioVideoLinks,
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
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? undefined;

  // データ取得
  const [scenarioResult, reviewsResult, sessionsResult, videosResult] =
    await Promise.all([
      getScenarioDetail(id),
      getScenarioReviews(id, 'newest', 10, 0),
      getScenarioSessions(id, 10),
      getScenarioVideoLinks(id, 20),
    ]);

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
  const canEdit =
    !isNil(currentUserId) && currentUserId === scenario.createdById;

  // お気に入りトグルのServer Action
  const handleToggleFavorite = async () => {
    'use server';
    if (isNil(currentUserId)) return;
    await toggleFavoriteAction(id, currentUserId);
  };

  // プレイ済みトグルのServer Action
  const handleTogglePlayed = async () => {
    'use server';
    if (isNil(currentUserId)) return;
    await togglePlayedAction(id, currentUserId);
  };

  return (
    <main className={styles.pageContainer}>
      {/* ヘッダー */}
      <ScenarioHeader
        scenarioName={scenario.name}
        {...(currentUserId ? { currentUserId } : {})}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

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

      {/* FAB（お気に入り + メニュー） */}
      {!isNil(currentUserId) && (
        <ScenarioFAB
          scenarioId={id}
          isFavorite={isFavorite}
          isPlayed={isPlayed}
          canEdit={canEdit}
          onToggleFavorite={handleToggleFavorite}
          onTogglePlayed={handleTogglePlayed}
        />
      )}
    </main>
  );
}
