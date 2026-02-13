import { sanitizePositiveInt, sanitizeText } from './sanitizer';

import { err, ok } from '@/types/result';

import type { ParsedField, ScenarioParser } from './types';

/**
 * HTML文字列からJSON-LD（schema.org/Product）を抽出
 * cheerio不要: <script type="application/ld+json"> を正規表現で取得
 */
const extractJsonLd = (
  html: string,
): { name: string; brand: string } | null => {
  const scriptRegex =
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.matchAll(scriptRegex);
  for (const match of matches) {
    try {
      const content = match[1];
      if (!content) continue;
      const json = JSON.parse(content);
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
 * HTML文字列から指定クラスを持つ要素のテキスト内容を抽出
 * ネストされた div にも対応
 */
const extractTextByClass = (html: string, className: string): string => {
  const idx = html.indexOf(className);
  if (idx === -1) return '';

  // クラス名を含むタグの終了 '>' を見つける
  const tagEnd = html.indexOf('>', idx);
  if (tagEnd === -1) return '';

  // 対応する </div> を見つける（ネスト対応）
  let depth = 1;
  let pos = tagEnd + 1;
  const contentStart = pos;

  while (pos < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', pos);
    const nextClose = html.indexOf('</div>', pos);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        pos = nextClose;
        break;
      }
      pos = nextClose + 6;
    }
  }

  const content = html.substring(contentStart, pos);
  // HTMLタグ除去 → 空白正規化
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
    // JSON-LDからタイトルと販売者名を取得
    const jsonLd = extractJsonLd(html);
    if (!jsonLd) {
      return err(
        new Error(
          '解析に失敗しました。URLを確認するか、手動で入力してください',
        ),
      );
    }

    // 商品説明文のテキストを取得（プレイ人数・時間の抽出用）
    const descriptionText = extractTextByClass(html, 'js-market-item-detail');

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
