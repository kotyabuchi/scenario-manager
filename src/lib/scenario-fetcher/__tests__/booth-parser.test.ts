import { describe, expect, it } from 'vitest';

import { boothParser } from '../booth-parser';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadFixture = (name: string) =>
  readFileSync(resolve(__dirname, '..', '__fixtures__', name), 'utf-8');

describe('boothParser', () => {
  describe('JSON-LD からの情報抽出', () => {
    it('タイトルと作者名を正しく抽出する', () => {
      const html = loadFixture('booth-product-page.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/2274429',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.title).toEqual({
        value: '新クトゥルフ神話TRPG / カタシロ',
        confidence: 'high',
      });
      expect(result.data.author).toEqual({
        value: 'ディズムストア―',
        confidence: 'high',
      });
    });

    it('sourceType と sourceUrl が正しく設定される', () => {
      const html = loadFixture('booth-product-page.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/2274429',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.sourceType).toBe('booth');
      expect(result.data.sourceUrl).toBe('https://booth.pm/ja/items/2274429');
    });
  });

  describe('商品説明文からのプレイ人数抽出', () => {
    it('「1〜2人」の範囲形式を抽出する', () => {
      const html = loadFixture('booth-product-page.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/2274429',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.minPlayer).toEqual({ value: 1, confidence: 'low' });
      expect(result.data.maxPlayer).toEqual({ value: 2, confidence: 'low' });
    });

    it('プレイ人数が記載されていない場合は null', () => {
      const html = loadFixture('booth-no-playtime.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/9999999',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.minPlayer).toBeNull();
      expect(result.data.maxPlayer).toBeNull();
    });
  });

  describe('商品説明文からのプレイ時間抽出', () => {
    it('「2〜3時間」を秒単位で抽出する', () => {
      const html = loadFixture('booth-product-page.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/2274429',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.minPlaytime).toEqual({
        value: 2 * 3600,
        confidence: 'low',
      });
      expect(result.data.maxPlaytime).toEqual({
        value: 3 * 3600,
        confidence: 'low',
      });
    });

    it('プレイ時間が記載されていない場合は null', () => {
      const html = loadFixture('booth-no-playtime.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/9999999',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.minPlaytime).toBeNull();
      expect(result.data.maxPlaytime).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('JSON-LDがないHTMLでエラーを返す', () => {
      const html = '<html><head></head><body>No data</body></html>';
      const result = boothParser.parse(html, 'https://booth.pm/ja/items/1');

      expect(result.success).toBe(false);
    });

    it('概要文・画像URLがパーサー出力に含まれない', () => {
      const html = loadFixture('booth-product-page.html');
      const result = boothParser.parse(
        html,
        'https://booth.pm/ja/items/2274429',
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      // ParsedScenario には description や imageUrl フィールドが存在しない
      const data = result.data as Record<string, unknown>;
      expect(data.description).toBeUndefined();
      expect(data.imageUrl).toBeUndefined();
    });
  });
});
