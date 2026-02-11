import type { Result } from '@/types/result';

/**
 * パーサーが返すフィールドの信頼度
 * - high: 構造化データから確実に取得（readOnly で表示）
 * - low: テキスト解析で推定（編集可能、初期値として使用）
 */
type Confidence = 'high' | 'low';

/**
 * パーサーが返す個別フィールド
 * 値 + 信頼度のペア。null は抽出失敗を表す。
 */
type ParsedField<T> = {
  value: T;
  confidence: Confidence;
} | null;

/**
 * パーサーの解析結果
 */
type ParsedScenario = {
  title: ParsedField<string>;
  author: ParsedField<string>;
  minPlayer: ParsedField<number>;
  maxPlayer: ParsedField<number>;
  /** 秒単位に正規化済み */
  minPlaytime: ParsedField<number>;
  /** 秒単位に正規化済み */
  maxPlaytime: ParsedField<number>;
  sourceType: 'booth' | 'talto';
  sourceUrl: string;
};

/**
 * サイト別パーサーのインターフェース
 */
type ScenarioParser = {
  parse: (html: string, url: string) => Result<ParsedScenario>;
};

export type { Confidence, ParsedField, ParsedScenario, ScenarioParser };
