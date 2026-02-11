import { boothParser } from './booth-parser';
import {
  extractTaltoProjectId,
  fetchTaltoProject,
  parseTaltoFromApi,
} from './talto-parser';
import { validateScenarioUrl } from './url-validator';

import { err, ok, type Result } from '@/types/result';

import type { ParsedScenario } from './types';

export type { ParsedField, ParsedScenario } from './types';

/**
 * 外部サイトの URL からシナリオ情報を取得・解析する
 *
 * 1. URL をホワイトリストで検証（SSRF対策）
 * 2. サイト種別に応じてデータを取得・解析
 * 3. 事実情報のみを返す（概要文・画像は含まない）
 */
export const fetchAndParseScenario = async (
  inputUrl: string,
): Promise<Result<ParsedScenario>> => {
  // URL 検証
  const urlResult = validateScenarioUrl(inputUrl);
  if (!urlResult.success) {
    return err(urlResult.error);
  }

  const { url, domain } = urlResult.data;

  try {
    if (domain === 'talto.cc') {
      return await parseTalto(url);
    }

    if (domain === 'booth.pm') {
      return await parseBooth(url);
    }

    return err(new Error(`未対応のサイトです: ${domain}`));
  } catch (e) {
    return err(
      e instanceof Error
        ? e
        : new Error(
            '解析に失敗しました。URLを確認するか、手動で入力してください',
          ),
    );
  }
};

/**
 * TALTO: JSON API を使用してシナリオ情報を取得
 */
const parseTalto = async (url: URL): Promise<Result<ParsedScenario>> => {
  const projectId = extractTaltoProjectId(url.href);
  if (!projectId) {
    return err(new Error('TALTOのシナリオURLの形式が正しくありません'));
  }

  const data = await fetchTaltoProject(projectId);
  return ok(parseTaltoFromApi(data, url.href));
};

/**
 * Booth: HTML をフェッチして cheerio でパース
 */
const parseBooth = async (url: URL): Promise<Result<ParsedScenario>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ScenarioManager/1.0',
        Accept: 'text/html',
      },
    });

    if (!response.ok) {
      return err(new Error(`ページの取得に失敗しました（${response.status}）`));
    }

    // レスポンスサイズの上限チェック（5MB）
    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > 5 * 1024 * 1024) {
      return err(new Error('ページサイズが大きすぎます'));
    }

    const html = await response.text();
    return boothParser.parse(html, url.href);
  } finally {
    clearTimeout(timeoutId);
  }
};
