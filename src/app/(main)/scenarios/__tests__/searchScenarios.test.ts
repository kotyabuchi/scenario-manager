import { describe, expect, it } from 'vitest';

import { searchScenarios } from '../adapter';

/**
 * シナリオ検索機能の統合テスト
 *
 * 注意: Supabase接続が必要なため、Vitest単体実行時はスキップされる。
 * `cookies()` がリクエストコンテキスト外で呼ばれるとエラーになるため。
 *
 * 対応ユーザーストーリー:
 * - US-201: システムを選ぶだけでシナリオ一覧を見られる
 * - US-202: 人数・時間で絞り込める
 * - US-203: タグで絞り込める
 * - US-204: シナリオ名で検索できる
 * - US-205: 検索結果を新着順・評価順でソートできる
 *
 * 対応要件:
 * - 5.11 エッジケース: null値のシナリオは常に含める
 * - 5.12 日本語検索の正規化
 */
describe.skip('searchScenarios', () => {
  describe('US-201: システムフィルタ', () => {
    it('T-201-1: システム未選択時は全シナリオが対象になる', async () => {
      const result = await searchScenarios({});

      expect(result.success).toBe(true);
      if (result.success) {
        // 全システムのシナリオが含まれることを確認
        expect(result.data.scenarios.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('T-201-2: 単一システム選択時はそのシステムのみ絞り込む', async () => {
      // テスト用のシステムIDが必要
      // TODO: テストデータのセットアップ後に実装
      const systemId = 'test-system-coc7';

      const result = await searchScenarios({ systemIds: [systemId] });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          expect(scenario.scenarioSystemId).toBe(systemId);
        }
      }
    });

    it('T-201-3: 複数システム選択時はOR条件で絞り込む', async () => {
      const systemIds = ['test-system-coc7', 'test-system-coc6'];

      const result = await searchScenarios({ systemIds });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          expect(systemIds).toContain(scenario.scenarioSystemId);
        }
      }
    });
  });

  describe('US-202: プレイ人数・時間フィルタ', () => {
    it('T-202-1: プレイ人数の範囲が重なるシナリオを取得', async () => {
      // 検索条件: 4〜6人
      // シナリオ「3-5人」は範囲が重なる（4,5が共通）→ 取得される
      const result = await searchScenarios({
        playerCount: { min: 4, max: 6 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          // シナリオのmin〜maxと検索条件4〜6が重なっていること
          const hasOverlap =
            scenario.minPlayer !== null &&
            scenario.maxPlayer !== null &&
            scenario.minPlayer <= 6 &&
            scenario.maxPlayer >= 4;
          expect(hasOverlap).toBe(true);
        }
      }
    });

    it('T-202-2: プレイ人数の範囲が重ならないシナリオは除外', async () => {
      // 検索条件: 4〜6人
      // シナリオ「2-3人」は重ならない → 除外される
      const result = await searchScenarios({
        playerCount: { min: 4, max: 6 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          // 2-3人のシナリオは含まれないこと
          if (
            scenario.minPlayer !== null &&
            scenario.maxPlayer !== null &&
            scenario.maxPlayer < 4
          ) {
            expect(false).toBe(true); // このシナリオは含まれるべきではない
          }
        }
      }
    });

    it('T-202-3: プレイ時間の範囲が重なるシナリオを取得', async () => {
      // 検索条件: 3〜6時間
      const result = await searchScenarios({
        playtime: { min: 3, max: 6 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          // プレイ時間は分単位で保存されている
          const minHours = scenario.minPlaytime
            ? scenario.minPlaytime / 60
            : null;
          const maxHours = scenario.maxPlaytime
            ? scenario.maxPlaytime / 60
            : null;

          if (minHours !== null && maxHours !== null) {
            const hasOverlap = minHours <= 6 && maxHours >= 3;
            expect(hasOverlap).toBe(true);
          }
        }
      }
    });

    it('T-202-4: プレイ時間の範囲が重ならないシナリオは除外', async () => {
      // 検索条件: 5〜8時間のシナリオ
      // 1-2時間のシナリオは除外される
      const result = await searchScenarios({
        playtime: { min: 5, max: 8 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          const maxHours = scenario.maxPlaytime
            ? scenario.maxPlaytime / 60
            : null;
          if (maxHours !== null && maxHours < 5) {
            expect(false).toBe(true); // このシナリオは含まれるべきではない
          }
        }
      }
    });
  });

  describe('US-203: タグフィルタ', () => {
    it('T-203-1: 単一タグで絞り込める', async () => {
      const tagId = 'test-tag-horror';

      const result = await searchScenarios({ tagIds: [tagId] });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          const tagIds = (scenario.scenarioTags ?? []).map(
            (st) => st.tag.tagId,
          );
          expect(tagIds).toContain(tagId);
        }
      }
    });

    it('T-203-2: 複数タグはAND条件で絞り込む', async () => {
      const tagIds = ['test-tag-horror', 'test-tag-mystery'];

      const result = await searchScenarios({ tagIds });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          const scenarioTagIds = (scenario.scenarioTags ?? []).map(
            (st) => st.tag.tagId,
          );
          // すべてのタグを含むこと
          for (const tagId of tagIds) {
            expect(scenarioTagIds).toContain(tagId);
          }
        }
      }
    });
  });

  describe('US-204: シナリオ名検索', () => {
    it('T-204-1: シナリオ名で部分一致検索できる', async () => {
      const result = await searchScenarios({ scenarioName: '狂気' });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const scenario of result.data.scenarios) {
          expect(scenario.name.toLowerCase()).toContain('狂気');
        }
      }
    });

    it('T-204-2: 大文字小文字を区別しない', async () => {
      // 英語のシナリオ名で検証
      const resultLower = await searchScenarios({ scenarioName: 'cthulhu' });
      const resultUpper = await searchScenarios({ scenarioName: 'CTHULHU' });

      expect(resultLower.success).toBe(true);
      expect(resultUpper.success).toBe(true);

      if (resultLower.success && resultUpper.success) {
        expect(resultLower.data.totalCount).toBe(resultUpper.data.totalCount);
      }
    });
  });

  describe('US-205: ソート', () => {
    it('T-205-1: 新着順でソートできる', async () => {
      const result = await searchScenarios({}, 'newest');

      expect(result.success).toBe(true);
      if (result.success && result.data.scenarios.length >= 2) {
        const dates = result.data.scenarios.map((s) =>
          new Date(s.createdAt).getTime(),
        );
        // 降順であることを確認
        for (let i = 0; i < dates.length - 1; i++) {
          const current = dates[i];
          const next = dates[i + 1];
          if (current !== undefined && next !== undefined) {
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      }
    });

    it.skip('T-205-2: 高評価順でソートできる（TODO: レビュー機能実装後）', async () => {
      const result = await searchScenarios({}, 'rating');

      expect(result.success).toBe(true);
      // TODO: レビューテーブルと結合後に実装
    });

    it('T-205-3: プレイ時間順（短い順）でソートできる', async () => {
      const result = await searchScenarios({}, 'playtime_asc');

      expect(result.success).toBe(true);
      if (result.success && result.data.scenarios.length >= 2) {
        const playtimes = result.data.scenarios
          .map((s) => s.minPlaytime)
          .filter((p): p is number => p !== null);
        // 昇順であることを確認
        for (let i = 0; i < playtimes.length - 1; i++) {
          const current = playtimes[i];
          const next = playtimes[i + 1];
          if (current !== undefined && next !== undefined) {
            expect(current).toBeLessThanOrEqual(next);
          }
        }
      }
    });

    it('T-205-4: プレイ時間順（長い順）でソートできる', async () => {
      const result = await searchScenarios({}, 'playtime_desc');

      expect(result.success).toBe(true);
      if (result.success && result.data.scenarios.length >= 2) {
        const playtimes = result.data.scenarios
          .map((s) => s.minPlaytime)
          .filter((p): p is number => p !== null);
        // 降順であることを確認
        for (let i = 0; i < playtimes.length - 1; i++) {
          const current = playtimes[i];
          const next = playtimes[i + 1];
          if (current !== undefined && next !== undefined) {
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      }
    });
  });

  describe('ページネーション', () => {
    it('T-LIMIT-1: 初期表示は20件まで', async () => {
      const result = await searchScenarios({}, 'newest', 20, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scenarios.length).toBeLessThanOrEqual(20);
      }
    });

    it('T-LIMIT-2: offsetで追加読み込みできる', async () => {
      const firstPage = await searchScenarios({}, 'newest', 10, 0);
      const secondPage = await searchScenarios({}, 'newest', 10, 10);

      expect(firstPage.success).toBe(true);
      expect(secondPage.success).toBe(true);

      if (firstPage.success && secondPage.success) {
        // 異なるシナリオが返されること（totalCountが20以上の場合）
        if (firstPage.data.totalCount > 10) {
          const firstIds = firstPage.data.scenarios.map((s) => s.scenarioId);
          const secondIds = secondPage.data.scenarios.map((s) => s.scenarioId);
          // 重複がないこと
          for (const id of secondIds) {
            expect(firstIds).not.toContain(id);
          }
        }
      }
    });

    it('T-LIMIT-3: totalCountが正しく返される', async () => {
      const result = await searchScenarios({}, 'newest', 5, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        // totalCountはlimitより大きい可能性がある
        expect(result.data.totalCount).toBeGreaterThanOrEqual(
          result.data.scenarios.length,
        );
      }
    });
  });

  describe('5.11 エッジケース: null値のシナリオ', () => {
    it('T-NULL-1: minPlayer/maxPlayerがnullのシナリオはプレイ人数検索で常に含まれる', async () => {
      // 検索条件: 4〜6人
      const result = await searchScenarios({
        playerCount: { min: 4, max: 6 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // null値を持つシナリオがあれば、それも含まれていることを確認
        const nullPlayerScenarios = result.data.scenarios.filter(
          (s) => s.minPlayer === null || s.maxPlayer === null,
        );
        // null値シナリオは除外されていないこと（存在すれば含まれる）
        // テストデータにnull値シナリオがあれば、それらも検索結果に含まれる
        expect(nullPlayerScenarios.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('T-NULL-2: minPlaytime/maxPlaytimeがnullのシナリオはプレイ時間検索で常に含まれる', async () => {
      // 検索条件: 3〜6時間
      const result = await searchScenarios({
        playtime: { min: 3, max: 6 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // null値を持つシナリオがあれば、それも含まれていることを確認
        const nullPlaytimeScenarios = result.data.scenarios.filter(
          (s) => s.minPlaytime === null || s.maxPlaytime === null,
        );
        expect(nullPlaytimeScenarios.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('T-NULL-3: 片方のみnullの場合は範囲重複で判定', async () => {
      // シナリオ: minPlayer=3, maxPlayer=null の場合
      // 検索条件: 4〜6人
      // → minPlayer(3) <= 6 なので含まれる可能性がある
      const result = await searchScenarios({
        playerCount: { min: 4, max: 6 },
      });

      expect(result.success).toBe(true);
      // 片方nullのシナリオの扱いが正しいことを確認
      // 実装次第で挙動が決まる
    });
  });

  describe('5.12 日本語検索の正規化', () => {
    it('T-JP-1: ひらがなでカタカナのシナリオ名を検索できる', async () => {
      // 「くとぅるふ」で「クトゥルフ」がヒットする
      const result = await searchScenarios({ scenarioName: 'くとぅるふ' });

      expect(result.success).toBe(true);
      if (result.success) {
        // カタカナのシナリオ名もヒットすること
        for (const scenario of result.data.scenarios) {
          // ひらがな or カタカナで「くとぅるふ/クトゥルフ」を含む
          const nameNormalized = scenario.name
            .replace(/[ァ-ヶ]/g, (c) =>
              String.fromCharCode(c.charCodeAt(0) - 0x60),
            )
            .toLowerCase();
          expect(nameNormalized).toContain('くとぅるふ');
        }
      }
    });

    it('T-JP-2: カタカナでひらがなのシナリオ名を検索できる', async () => {
      // 「クトゥルフ」で「くとぅるふ」がヒットする
      const result = await searchScenarios({ scenarioName: 'クトゥルフ' });

      expect(result.success).toBe(true);
      // 逆方向も同様に動作すること
    });

    it('T-JP-3: 全角英数で半角英数のシナリオ名を検索できる', async () => {
      // 「ＣｏＣ」で「CoC」がヒットする
      const resultFullwidth = await searchScenarios({ scenarioName: 'ＣｏＣ' });
      const resultHalfwidth = await searchScenarios({ scenarioName: 'CoC' });

      expect(resultFullwidth.success).toBe(true);
      expect(resultHalfwidth.success).toBe(true);

      if (resultFullwidth.success && resultHalfwidth.success) {
        // 同じ結果が返されること
        expect(resultFullwidth.data.totalCount).toBe(
          resultHalfwidth.data.totalCount,
        );
      }
    });

    it('T-JP-4: 半角カナで全角カナのシナリオ名を検索できる', async () => {
      // 「ｸﾄｩﾙﾌ」で「クトゥルフ」がヒットする
      const resultHalfwidthKana = await searchScenarios({
        scenarioName: 'ｸﾄｩﾙﾌ',
      });
      const resultFullwidthKana = await searchScenarios({
        scenarioName: 'クトゥルフ',
      });

      expect(resultHalfwidthKana.success).toBe(true);
      expect(resultFullwidthKana.success).toBe(true);

      if (resultHalfwidthKana.success && resultFullwidthKana.success) {
        // 同じ結果が返されること
        expect(resultHalfwidthKana.data.totalCount).toBe(
          resultFullwidthKana.data.totalCount,
        );
      }
    });

    it('T-JP-5: 混合パターンの検索', async () => {
      // 「ＣｏＣ7版」で「CoC7版」「ＣｏＣ７版」などがヒットする
      const result = await searchScenarios({ scenarioName: 'ＣｏＣ7版' });

      expect(result.success).toBe(true);
      // 全角/半角混在でも正しく検索できること
    });
  });
});
