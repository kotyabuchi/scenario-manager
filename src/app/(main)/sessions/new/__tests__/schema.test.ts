import { describe, expect, it } from 'vitest';

import { sessionFormSchema } from '../schema';

/**
 * セッション募集フォームスキーマのバリデーションテスト
 * 要件: requirements-session-flow.md Section 3.2
 *
 * バリデーションルール:
 * - sessionName: 1〜100文字（必須）
 * - sessionDescription: 1〜500文字（必須）- 唯一の「必須」項目
 * - scenarioId: ULID形式（任意）
 * - scheduledAt: ISO8601日時文字列（任意）
 * - recruitedPlayerCount: 1〜10の整数（任意）
 * - tools: 最大200文字（任意）
 * - isBeginnerFriendly: boolean（デフォルト: false）
 * - visibility: PUBLIC / FOLLOWERS_ONLY（デフォルト: PUBLIC）
 */
describe('sessionFormSchema', () => {
  describe('sessionName', () => {
    // T-SF-001: 1〜100文字のセッション名が有効
    it('1文字のセッション名が有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'あ',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
    });

    it('100文字のセッション名が有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'a'.repeat(100),
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-002: 空のセッション名でエラー
    it('空のセッション名でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: '',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'セッション名を入力してください',
        );
      }
    });

    // T-SF-003: 101文字以上のセッション名でエラー
    it('101文字以上のセッション名でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'a'.repeat(101),
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'セッション名は100文字以内で入力してください',
        );
      }
    });

    // T-SF-004: セッション名未指定でエラー
    it('セッション名未指定でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sessionDescription', () => {
    // T-SF-005: 1〜500文字の募集文が有効
    it('1文字の募集文が有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'あ',
      });
      expect(result.success).toBe(true);
    });

    it('500文字の募集文が有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    // T-SF-006: 空の募集文でエラー
    it('空の募集文でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '募集文を入力してください',
        );
      }
    });

    // T-SF-007: 501文字以上の募集文でエラー
    it('501文字以上の募集文でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '募集文は500文字以内で入力してください',
        );
      }
    });

    // T-SF-008: 募集文未指定でエラー
    it('募集文未指定でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('scenarioId', () => {
    // T-SF-009: 有効なULIDが受け入れられる
    it('有効なULIDが受け入れられる', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        scenarioId: '01HY5K3XABCDEFGHIJKLMNOPQR',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-010: nullで有効（未定）
    it('nullで有効（未定）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        scenarioId: null,
      });
      expect(result.success).toBe(true);
    });

    // T-SF-011: undefinedで有効（未指定）
    it('undefinedで有効（未指定）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-012: 不正な形式でエラー（文字数不足）
    it('不正な形式でエラー（文字数不足）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        scenarioId: 'invalid-id',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'シナリオIDの形式が正しくありません',
        );
      }
    });
  });

  describe('scheduledAt', () => {
    // T-SF-013: 有効なISO8601日時が受け入れられる
    it('有効なISO8601日時が受け入れられる', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        scheduledAt: '2026-01-25T20:00:00+09:00',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-014: nullで有効（後で調整）
    it('nullで有効（後で調整）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        scheduledAt: null,
      });
      expect(result.success).toBe(true);
    });

    // T-SF-015: undefinedで有効（未指定）
    it('undefinedで有効（未指定）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-016: 不正な日時形式でエラー
    it('不正な日時形式でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        scheduledAt: 'invalid-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('recruitedPlayerCount', () => {
    // T-SF-017: 1〜10の整数が有効
    it('1人が有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        recruitedPlayerCount: 1,
      });
      expect(result.success).toBe(true);
    });

    it('10人が有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        recruitedPlayerCount: 10,
      });
      expect(result.success).toBe(true);
    });

    // T-SF-018: 0人でエラー
    it('0人でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        recruitedPlayerCount: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '募集人数は1人以上で入力してください',
        );
      }
    });

    // T-SF-019: 11人以上でエラー
    it('11人以上でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        recruitedPlayerCount: 11,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '募集人数は10人以下で入力してください',
        );
      }
    });

    // T-SF-020: 小数でエラー
    it('小数でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        recruitedPlayerCount: 3.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '募集人数は整数で入力してください',
        );
      }
    });

    // T-SF-021: nullで有効（未定）
    it('nullで有効（未定）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        recruitedPlayerCount: null,
      });
      expect(result.success).toBe(true);
    });

    // T-SF-022: undefinedで有効（未指定）
    it('undefinedで有効（未指定）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tools', () => {
    // T-SF-023: 有効な使用ツールが受け入れられる
    it('有効な使用ツールが受け入れられる', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        tools: 'Discord + ココフォリア',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-024: 200文字の使用ツールが有効
    it('200文字の使用ツールが有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        tools: 'a'.repeat(200),
      });
      expect(result.success).toBe(true);
    });

    // T-SF-025: 201文字以上でエラー
    it('201文字以上でエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        tools: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '使用ツールは200文字以内で入力してください',
        );
      }
    });

    // T-SF-026: 空文字列で有効
    it('空文字列で有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        tools: '',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-027: nullで有効
    it('nullで有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        tools: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('isBeginnerFriendly', () => {
    // T-SF-028: trueが有効
    it('trueが有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        isBeginnerFriendly: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isBeginnerFriendly).toBe(true);
      }
    });

    // T-SF-029: falseが有効
    it('falseが有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        isBeginnerFriendly: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isBeginnerFriendly).toBe(false);
      }
    });

    // T-SF-030: undefinedでデフォルトfalse
    it('undefinedでデフォルトfalse', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isBeginnerFriendly).toBe(false);
      }
    });
  });

  describe('visibility', () => {
    // T-SF-031: PUBLICが有効
    it('PUBLICが有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        visibility: 'PUBLIC',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-032: FOLLOWERS_ONLYが有効
    it('FOLLOWERS_ONLYが有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        visibility: 'FOLLOWERS_ONLY',
      });
      expect(result.success).toBe(true);
    });

    // T-SF-033: undefinedでデフォルトPUBLIC
    it('undefinedでデフォルトPUBLIC', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe('PUBLIC');
      }
    });

    // T-SF-034: 無効なvisibilityでエラー
    it('無効なvisibilityでエラー', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: 'テスト卓',
        sessionDescription: 'テスト募集文です',
        visibility: 'INVALID',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '公開範囲を選択してください',
        );
      }
    });
  });

  describe('複合バリデーション', () => {
    // T-SF-035: 全項目を指定して有効
    it('全項目を指定して有効', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: '週末CoC7版卓',
        sessionDescription:
          '週末にCoC7版を遊びませんか？初心者歓迎、シナリオは相談で決めましょう！',
        scenarioId: '01HY5K3XABCDEFGHIJKLMNOPQR',
        scheduledAt: '2026-01-25T20:00:00+09:00',
        recruitedPlayerCount: 4,
        tools: 'Discord + ココフォリア',
        isBeginnerFriendly: true,
        visibility: 'PUBLIC',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionName).toBe('週末CoC7版卓');
        expect(result.data.sessionDescription).toBe(
          '週末にCoC7版を遊びませんか？初心者歓迎、シナリオは相談で決めましょう！',
        );
        expect(result.data.scenarioId).toBe('01HY5K3XABCDEFGHIJKLMNOPQR');
        expect(result.data.recruitedPlayerCount).toBe(4);
        expect(result.data.isBeginnerFriendly).toBe(true);
        expect(result.data.visibility).toBe('PUBLIC');
      }
    });

    // T-SF-036: 必須項目のみで有効（柔軟な募集）
    it('必須項目のみで有効（柔軟な募集）', () => {
      const result = sessionFormSchema.safeParse({
        sessionName: '週末に何か遊ぶ卓',
        sessionDescription: '週末に何か遊びませんか？',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // デフォルト値が設定されている
        expect(result.data.isBeginnerFriendly).toBe(false);
        expect(result.data.visibility).toBe('PUBLIC');
        // オプション項目はundefined
        expect(result.data.scenarioId).toBeUndefined();
        expect(result.data.scheduledAt).toBeUndefined();
        expect(result.data.recruitedPlayerCount).toBeUndefined();
      }
    });

    // T-SF-037: 空オブジェクトでエラー
    it('空オブジェクトでエラー', () => {
      const result = sessionFormSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        // 複数のエラーが発生（sessionName, sessionDescription）
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
