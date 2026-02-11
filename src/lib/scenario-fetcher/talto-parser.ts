import { sanitizePositiveInt, sanitizeText } from './sanitizer';

import { err } from '@/types/result';

import type { ParsedScenario, ScenarioParser } from './types';

/**
 * TALTO API のレスポンス型（必要なフィールドのみ）
 */
type TaltoApiResponse = {
  project: {
    name: string;
    author: string;
    players_min: number | null;
    players_max: number | null;
    playing_hour_min: number | null;
    playing_hour_max: number | null;
  };
};

/**
 * TALTO API のベース URL
 */
const TALTO_API_BASE =
  'https://us-central1-talto-trpg.cloudfunctions.net/api/v1';

/**
 * TALTO の URL からプロジェクト ID を抽出する
 */
export const extractTaltoProjectId = (url: string): string | null => {
  const match = url.match(/talto\.cc\/projects\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
};

/**
 * TALTO API からシナリオ情報を取得するフェッチャー
 */
export const fetchTaltoProject = async (
  projectId: string,
): Promise<TaltoApiResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${TALTO_API_BASE}/projects/${projectId}/forDetailPage`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error(`TALTO API error: ${response.status}`);
    }

    // レスポンスサイズの上限チェック（5MB）
    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > 5 * 1024 * 1024) {
      throw new Error('TALTO API レスポンスが大きすぎます');
    }

    return (await response.json()) as TaltoApiResponse;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * TALTO API レスポンスを ParsedScenario に変換するパーサー
 * HTMLパースは不要（構造化 JSON API を使用）
 */
export const taltoParser: ScenarioParser = {
  parse: (_html, _url) => {
    // TALTO は API ベースのため、このメソッドは使用しない
    // parseTaltoFromApi を直接使用すること
    return err(
      new Error('TALTOのパースには parseTaltoFromApi() を使用してください'),
    );
  },
};

/**
 * TALTO API レスポンスから ParsedScenario を生成する
 */
export const parseTaltoFromApi = (
  data: TaltoApiResponse,
  url: string,
): ParsedScenario => {
  const { project } = data;

  // プレイ時間: TALTO は時間単位で返すので秒に変換
  const minPlaytimeSeconds =
    project.playing_hour_min !== null
      ? sanitizePositiveInt(project.playing_hour_min * 3600)
      : null;
  const maxPlaytimeSeconds =
    project.playing_hour_max !== null
      ? sanitizePositiveInt(project.playing_hour_max * 3600)
      : null;

  return {
    title: { value: sanitizeText(project.name), confidence: 'high' },
    author: project.author
      ? { value: sanitizeText(project.author), confidence: 'high' }
      : null,
    minPlayer:
      project.players_min !== null
        ? {
            value:
              sanitizePositiveInt(project.players_min) ?? project.players_min,
            confidence: 'high',
          }
        : null,
    maxPlayer:
      project.players_max !== null
        ? {
            value:
              sanitizePositiveInt(project.players_max) ?? project.players_max,
            confidence: 'high',
          }
        : null,
    minPlaytime:
      minPlaytimeSeconds !== null
        ? { value: minPlaytimeSeconds, confidence: 'high' }
        : null,
    maxPlaytime:
      maxPlaytimeSeconds !== null
        ? { value: maxPlaytimeSeconds, confidence: 'high' }
        : null,
    sourceType: 'talto',
    sourceUrl: url,
  };
};
