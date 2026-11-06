import { isNil } from 'ramda';

import {
  getScenarioDetail,
  getScenarioReviews,
  getScenarioSessions,
  getScenarioVideoLinks,
  getUserByAuthUserId,
  getUserScenarioPreference,
} from './adapter';

import { createClient } from '@/lib/supabase/server';

import type {
  ReviewWithUser,
  ScenarioDetail,
  SessionWithKeeper,
  VideoLinkWithSession,
} from './interface';

export type ScenarioDetailViewModel = {
  scenario: ScenarioDetail;
  reviews: ReviewWithUser[];
  reviewTotalCount: number;
  sessions: SessionWithKeeper[];
  videos: VideoLinkWithSession[];
  currentUserId?: string;
  isFavorite: boolean;
  isPlayed: boolean;
  isLoggedIn: boolean;
};

/** 単独ページとインターセプト詳細で同じ表示データを組み立てる。 */
export const getScenarioDetailViewModel = async (
  id: string,
): Promise<ScenarioDetailViewModel | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let currentUserId: string | undefined;
  if (authUser) {
    const userResult = await getUserByAuthUserId(authUser.id);
    if (userResult.success && userResult.data) {
      currentUserId = userResult.data.userId;
    }
  }

  // Cloudflare Workers 環境での安定性を保つため、DB への読み取りは順次実行する。
  const scenarioResult = await getScenarioDetail(id);
  if (!scenarioResult.success || isNil(scenarioResult.data)) return null;

  const reviewsResult = await getScenarioReviews(id, 'newest', 10, 0);
  const sessionsResult = await getScenarioSessions(id, 10);
  const videosResult = await getScenarioVideoLinks(id, 20);

  let isFavorite = false;
  let isPlayed = false;
  if (!isNil(currentUserId)) {
    const prefResult = await getUserScenarioPreference(id, currentUserId);
    if (prefResult.success && prefResult.data) {
      isFavorite = prefResult.data.isLike;
      isPlayed = prefResult.data.isPlayed;
    }
  }

  return {
    scenario: scenarioResult.data,
    reviews: reviewsResult.success ? reviewsResult.data.reviews : [],
    reviewTotalCount: reviewsResult.success ? reviewsResult.data.totalCount : 0,
    sessions: sessionsResult.success ? sessionsResult.data : [],
    videos: videosResult.success ? videosResult.data : [],
    ...(currentUserId ? { currentUserId } : {}),
    isFavorite,
    isPlayed,
    isLoggedIn: !isNil(currentUserId),
  };
};
