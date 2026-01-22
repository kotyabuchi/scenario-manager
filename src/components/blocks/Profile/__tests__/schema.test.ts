import { describe, expect, it } from 'vitest';

import { profileFormSchema } from '../schema';

/**
 * プロフィール編集フォームのZodスキーマバリデーションテスト
 * 要件: requirements-profile.md 4.1 profileFormSchema
 */
describe('profileFormSchema', () => {
  // 有効なデータのベースライン
  const validInput = {
    userName: 'test_user',
    nickname: 'テストユーザー',
    bio: '自己紹介文です',
  };

  describe('正常系', () => {
    // T-PF-001: 有効なuserName（英数字のみ）でバリデーション成功
    it('有効なuserName（英数字のみ）でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'testUser123',
      });

      expect(result.success).toBe(true);
    });

    // T-PF-002: 有効なuserName（アンダースコア含む）でバリデーション成功
    it('有効なuserName（アンダースコア含む）でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'test_user_123',
      });

      expect(result.success).toBe(true);
    });

    // T-PF-003: 有効なnickname（1文字）でバリデーション成功
    it('有効なnickname（1文字）でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        nickname: 'あ',
      });

      expect(result.success).toBe(true);
    });

    // T-PF-004: 有効なnickname（50文字）でバリデーション成功
    it('有効なnickname（50文字）でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        nickname: 'あ'.repeat(50),
      });

      expect(result.success).toBe(true);
    });

    // T-PF-005: bioが空でもバリデーション成功
    it('bioが空でもバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        bio: '',
      });

      expect(result.success).toBe(true);
    });

    // T-PF-006: 有効なbio（500文字）でバリデーション成功
    it('有効なbio（500文字）でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        bio: 'あ'.repeat(500),
      });

      expect(result.success).toBe(true);
    });

    it('userNameが3文字でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'abc',
      });

      expect(result.success).toBe(true);
    });

    it('userNameが30文字でバリデーション成功', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'a'.repeat(30),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('異常系 - userName', () => {
    // T-PF-101: userNameが空でエラー
    it('userNameが空でエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは3文字以上で入力してください',
        );
      }
    });

    // T-PF-102: userNameが2文字でエラー（最小3文字）
    it('userNameが2文字でエラー（最小3文字）', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'ab',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは3文字以上で入力してください',
        );
      }
    });

    // T-PF-103: userNameが31文字でエラー（最大30文字）
    it('userNameが31文字でエラー（最大30文字）', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'a'.repeat(31),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは30文字以内で入力してください',
        );
      }
    });

    // T-PF-104: userNameに日本語が含まれるとエラー
    it('userNameに日本語が含まれるとエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'test日本語',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは英数字とアンダースコアのみ使用できます',
        );
      }
    });

    // T-PF-105: userNameにハイフンが含まれるとエラー
    it('userNameにハイフンが含まれるとエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'test-user',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは英数字とアンダースコアのみ使用できます',
        );
      }
    });

    // T-PF-106: userNameにスペースが含まれるとエラー
    it('userNameにスペースが含まれるとエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'test user',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは英数字とアンダースコアのみ使用できます',
        );
      }
    });

    it('userNameにドットが含まれるとエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: 'test.user',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは英数字とアンダースコアのみ使用できます',
        );
      }
    });

    it('userNameにアットマークが含まれるとエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        userName: '@testuser',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザーIDは英数字とアンダースコアのみ使用できます',
        );
      }
    });
  });

  describe('異常系 - nickname', () => {
    // T-PF-107: nicknameが空でエラー
    it('nicknameが空でエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        nickname: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '表示名を入力してください',
        );
      }
    });

    // T-PF-108: nicknameが51文字でエラー
    it('nicknameが51文字でエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        nickname: 'あ'.repeat(51),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '表示名は50文字以内で入力してください',
        );
      }
    });
  });

  describe('異常系 - bio', () => {
    // T-PF-109: bioが501文字でエラー
    it('bioが501文字でエラー', () => {
      const result = profileFormSchema.safeParse({
        ...validInput,
        bio: 'あ'.repeat(501),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '自己紹介は500文字以内で入力してください',
        );
      }
    });
  });
});
