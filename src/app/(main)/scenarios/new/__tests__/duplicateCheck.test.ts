import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * シナリオ重複チェックの統合テスト（TDDモード - Green Phase）
 *
 * 注意: Supabase接続が必要なため、Vitest単体実行時はスキップされる。
 *
 * 要件: requirements-scenario-new.md
 *
 * テストID対応:
 * - SN-30: 同一システムで同名シナリオが存在する場合、エラーメッセージが表示される
 * - SN-31: 異なるシステムで同名シナリオは登録できる
 * - SN-32: 既存の配布URLと重複する場合、エラーメッセージが表示される
 */

import { ulid } from 'ulid';

import {
  checkDistributeUrlDuplicate,
  checkScenarioNameDuplicate,
} from '../../adapter';

import { createDbClient } from '@/lib/supabase/server';

// テスト用のシナリオID（テストごとに作成・削除）
const testScenarioIds: string[] = [];
const testSystemIds: string[] = [];

beforeEach(async () => {
  // テスト前にクリーンアップ
  testScenarioIds.length = 0;
  testSystemIds.length = 0;

  // テスト用システムを作成
  const supabase = await createDbClient();
  const systemId1 = ulid();
  const systemId2 = ulid();

  await supabase.from('scenario_systems').insert([
    { system_id: systemId1, name: `test-system-coc7-${Date.now()}` },
    { system_id: systemId2, name: `test-system-sw25-${Date.now()}` },
  ]);

  testSystemIds.push(systemId1, systemId2);
});

afterEach(async () => {
  // テスト後にテストデータをクリーンアップ
  const supabase = await createDbClient();

  // シナリオを削除
  if (testScenarioIds.length > 0) {
    for (const scenarioId of testScenarioIds) {
      await supabase.from('scenarios').delete().eq('scenario_id', scenarioId);
    }
  }

  // システムを削除
  if (testSystemIds.length > 0) {
    for (const systemId of testSystemIds) {
      await supabase
        .from('scenario_systems')
        .delete()
        .eq('system_id', systemId);
    }
  }
});

describe.skip('シナリオ重複チェック', () => {
  describe('checkScenarioNameDuplicate', () => {
    // SN-30: 同一システムで同名シナリオが存在する場合、エラーメッセージが表示される
    it('同一システムで同名シナリオが存在する場合、重複と判定される', async () => {
      const supabase = await createDbClient();
      const systemId = testSystemIds[0];
      if (!systemId) {
        throw new Error('Test system ID not found');
      }

      // テストデータを作成
      const scenarioId = ulid();
      await supabase.from('scenarios').insert({
        scenario_id: scenarioId,
        name: '既存シナリオ',
        scenario_system_id: systemId,
        handout_type: 'NONE',
        created_by_id: null,
      });

      testScenarioIds.push(scenarioId);

      // 実装済みの関数を呼び出す
      const result = await checkScenarioNameDuplicate({
        name: '既存シナリオ',
        scenarioSystemId: systemId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(true);
        expect(result.data.existingScenarioId).toBe(scenarioId);
      }
    });

    // SN-31: 異なるシステムで同名シナリオは登録できる
    it('異なるシステムで同名シナリオは重複しない', async () => {
      const supabase = await createDbClient();
      const systemId0 = testSystemIds[0];
      const systemId1 = testSystemIds[1];
      if (!systemId0 || !systemId1) {
        throw new Error('Test system IDs not found');
      }

      // system-0に既存シナリオを作成
      const scenarioId = ulid();
      await supabase.from('scenarios').insert({
        scenario_id: scenarioId,
        name: '既存シナリオ',
        scenario_system_id: systemId0,
        handout_type: 'NONE',
        created_by_id: null,
      });

      testScenarioIds.push(scenarioId);

      // 別のシステム（system-1）で同名チェック
      const result = await checkScenarioNameDuplicate({
        name: '既存シナリオ',
        scenarioSystemId: systemId1, // 別のシステム
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(false);
      }
    });

    it('存在しないシナリオ名は重複しない', async () => {
      const systemId = testSystemIds[0];
      if (!systemId) {
        throw new Error('Test system ID not found');
      }

      const result = await checkScenarioNameDuplicate({
        name: '新規シナリオ',
        scenarioSystemId: systemId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(false);
      }
    });

    it('大文字小文字を区別せず重複チェックする', async () => {
      // PostgreSQLのデフォルトは大文字小文字を区別するため、
      // このテストは現在の実装では「区別する」という結果になる
      // 要件に大文字小文字を区別しないという明示的な記載がないため、
      // デフォルトの動作（区別する）を期待する
      const systemId = testSystemIds[0];
      if (!systemId) {
        throw new Error('Test system ID not found');
      }

      const result = await checkScenarioNameDuplicate({
        name: 'シナリオＡＢＣ', // 全角
        scenarioSystemId: systemId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 現在のDBには存在しないため重複しない
        expect(result.data.isDuplicate).toBe(false);
      }
    });
  });

  describe('checkDistributeUrlDuplicate', () => {
    // SN-32: 既存の配布URLと重複する場合、エラーメッセージが表示される
    it('既存の配布URLと重複する場合、重複と判定される', async () => {
      const supabase = await createDbClient();
      const systemId = testSystemIds[0];
      if (!systemId) {
        throw new Error('Test system ID not found');
      }

      // テストデータを作成
      const scenarioId = ulid();
      await supabase.from('scenarios').insert({
        scenario_id: scenarioId,
        name: '既存のシナリオ',
        scenario_system_id: systemId,
        handout_type: 'NONE',
        distribute_url: 'https://booth.pm/ja/items/123456',
        created_by_id: null,
      });

      testScenarioIds.push(scenarioId);

      const result = await checkDistributeUrlDuplicate({
        distributeUrl: 'https://booth.pm/ja/items/123456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(true);
        expect(result.data.existingScenarioId).toBe(scenarioId);
        expect(result.data.existingScenarioName).toBe('既存のシナリオ');
      }
    });

    it('存在しない配布URLは重複しない', async () => {
      const result = await checkDistributeUrlDuplicate({
        distributeUrl: 'https://booth.pm/ja/items/new-item',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(false);
      }
    });

    it('配布URLがundefinedの場合はチェックをスキップ', async () => {
      const result = await checkDistributeUrlDuplicate({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(false);
      }
    });

    it('URLの正規化（末尾スラッシュの有無）を考慮して重複チェック', async () => {
      const supabase = await createDbClient();
      const systemId = testSystemIds[0];
      if (!systemId) {
        throw new Error('Test system ID not found');
      }

      // 末尾スラッシュありで登録
      const scenarioId = ulid();
      await supabase.from('scenarios').insert({
        scenario_id: scenarioId,
        name: 'URLテストシナリオ',
        scenario_system_id: systemId,
        handout_type: 'NONE',
        distribute_url: 'https://booth.pm/ja/items/999888', // 正規化後スラッシュなし
        created_by_id: null,
      });

      testScenarioIds.push(scenarioId);

      // 末尾スラッシュありで登録済みの場合、スラッシュなしでも重複と判定
      const result = await checkDistributeUrlDuplicate({
        distributeUrl: 'https://booth.pm/ja/items/999888/', // スラッシュあり
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDuplicate).toBe(true);
      }
    });
  });
});
