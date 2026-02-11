import * as cheerio from 'cheerio';

import { sanitizePositiveInt, sanitizeText } from './sanitizer';

import { err, ok } from '@/types/result';

import type { ParsedField, ScenarioParser } from './types';

/**
 * Booth商品ページのJSON-LD（schema.org/Product）から構造化データを抽出
 */
const extractJsonLd = (
  $: cheerio.CheerioAPI,
): { name: string; brand: string } | null => {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() ?? '');
      if (json['@type'] === 'Product' && json.name) {
        return {
          name: sanitizeText(json.name),
          brand: json.brand?.name ? sanitizeText(json.brand.name) : '',
        };
      }
    } catch {
      // JSON パース失敗は無視して次へ
    }
  }
  return null;
};

/**
 * プレイ人数パターン（商品説明文から抽出）
 * 例: 「1〜4人」「2-5人」「PL1～4人」「1人用」「ソロ」
 */
const PLAYER_COUNT_PATTERNS = [
  // 「PL 1〜4人」「PL1-4人」
  /PL\s*(\d+)\s*[～〜~\-ー]\s*(\d+)\s*人/,
  // 「1〜4人」「2-5人」「2～4人用」（「人分」「人前」等の誤マッチを除外）
  /(\d+)\s*[～〜~\-ー]\s*(\d+)\s*人(?![分前席])/,
  // 「1人用」「1人」（「人分」「人前」等の誤マッチを除外）
  /(\d+)\s*人(?:用)?(?![分前席])/,
  // ソロ
  /ソロ/,
];

/**
 * プレイ時間パターン（商品説明文から抽出）
 * 例: 「1〜2時間」「30分〜1時間」「約3時間」「2h」
 */
const PLAYTIME_PATTERNS = [
  // 「1〜2時間」「1-2時間」
  /(\d+)\s*[～〜~\-ー]\s*(\d+)\s*時間/,
  // 「30分〜1時間」「30分～1時間半」
  /(\d+)\s*分\s*[～〜~\-ー]\s*(\d+)\s*時間/,
  // 「約3時間」「3時間程度」
  /約?\s*(\d+)\s*時間/,
  // 「30〜60分」「30-60分」
  /(\d+)\s*[～〜~\-ー]\s*(\d+)\s*分/,
  // 「約30分」「30分程度」
  /約?\s*(\d+)\s*分/,
];

/**
 * 商品説明文からプレイ人数を抽出する
 */
const extractPlayerCount = (
  text: string,
): { min: ParsedField<number>; max: ParsedField<number> } => {
  for (const pattern of PLAYER_COUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // 「ソロ」パターン
      if (pattern.source === 'ソロ') {
        return {
          min: { value: 1, confidence: 'low' },
          max: { value: 1, confidence: 'low' },
        };
      }
      // 範囲パターン（1〜4人）
      if (match[2]) {
        const min = sanitizePositiveInt(Number(match[1]));
        const max = sanitizePositiveInt(Number(match[2]));
        // TRPGとして妥当な人数範囲（1〜20人）のみ受け入れ
        if (min !== null && max !== null && min >= 1 && max <= 20) {
          return {
            min: { value: min, confidence: 'low' },
            max: { value: max, confidence: 'low' },
          };
        }
      }
      // 単一値パターン（1人用）
      if (match[1]) {
        const count = sanitizePositiveInt(Number(match[1]));
        // TRPGとして妥当な人数範囲（1〜20人）のみ受け入れ
        if (count !== null && count >= 1 && count <= 20) {
          return {
            min: { value: count, confidence: 'low' },
            max: { value: count, confidence: 'low' },
          };
        }
      }
    }
  }
  return { min: null, max: null };
};

/**
 * 商品説明文からプレイ時間を抽出する（秒単位で返す）
 */
const extractPlaytime = (
  text: string,
): { min: ParsedField<number>; max: ParsedField<number> } => {
  for (const pattern of PLAYTIME_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const src = pattern.source;

      // 「1〜2時間」パターン
      if (src.includes('時間') && match[2] && !src.includes('分')) {
        const min = sanitizePositiveInt(Number(match[1]) * 3600);
        const max = sanitizePositiveInt(Number(match[2]) * 3600);
        if (min !== null && max !== null) {
          return {
            min: { value: min, confidence: 'low' },
            max: { value: max, confidence: 'low' },
          };
        }
      }

      // 「30分〜1時間」パターン
      if (src.includes('分') && src.includes('時間')) {
        const min = sanitizePositiveInt(Number(match[1]) * 60);
        const max = sanitizePositiveInt(Number(match[2]) * 3600);
        if (min !== null && max !== null) {
          return {
            min: { value: min, confidence: 'low' },
            max: { value: max, confidence: 'low' },
          };
        }
      }

      // 「約3時間」パターン
      if (src.includes('時間') && !match[2]) {
        const seconds = sanitizePositiveInt(Number(match[1]) * 3600);
        if (seconds !== null) {
          return {
            min: { value: seconds, confidence: 'low' },
            max: { value: seconds, confidence: 'low' },
          };
        }
      }

      // 「30〜60分」パターン
      if (src.includes('分') && !src.includes('時間') && match[2]) {
        const min = sanitizePositiveInt(Number(match[1]) * 60);
        const max = sanitizePositiveInt(Number(match[2]) * 60);
        if (min !== null && max !== null) {
          return {
            min: { value: min, confidence: 'low' },
            max: { value: max, confidence: 'low' },
          };
        }
      }

      // 「約30分」パターン
      if (src.includes('分') && !src.includes('時間') && !match[2]) {
        const seconds = sanitizePositiveInt(Number(match[1]) * 60);
        if (seconds !== null) {
          return {
            min: { value: seconds, confidence: 'low' },
            max: { value: seconds, confidence: 'low' },
          };
        }
      }
    }
  }
  return { min: null, max: null };
};

/**
 * Booth商品ページから事実情報を抽出するパーサー
 * 概要文・画像URLは著作権リスクのため抽出しない
 */
export const boothParser: ScenarioParser = {
  parse: (html, url) => {
    const $ = cheerio.load(html);

    // JSON-LDからタイトルと販売者名を取得
    const jsonLd = extractJsonLd($);
    if (!jsonLd) {
      return err(
        new Error(
          '解析に失敗しました。URLを確認するか、手動で入力してください',
        ),
      );
    }

    // 商品説明文のテキストを取得（プレイ人数・時間の抽出用）
    const descriptionText = $('.js-market-item-detail').text();

    const playerCount = extractPlayerCount(descriptionText);
    const playtime = extractPlaytime(descriptionText);

    return ok({
      title: { value: jsonLd.name, confidence: 'high' },
      author: jsonLd.brand ? { value: jsonLd.brand, confidence: 'high' } : null,
      minPlayer: playerCount.min,
      maxPlayer: playerCount.max,
      minPlaytime: playtime.min,
      maxPlaytime: playtime.max,
      sourceType: 'booth',
      sourceUrl: url,
    });
  },
};
