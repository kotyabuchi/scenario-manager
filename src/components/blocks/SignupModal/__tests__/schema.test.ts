import { describe, expect, it } from 'vitest';

import { signupFormSchema, signupStep2Schema } from '../schema';

describe('signupFormSchema（Step1 バリデーション）', () => {
  // SCH1-01: 有効なユーザー名＋表示名でパース成功
  describe('正常系', () => {
    it('有効なユーザー名と表示名でパース成功', () => {
      const data = { userName: 'taro_trpg', nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // ユーザー名バリデーション
  describe('ユーザー名', () => {
    // SCH1-02: ユーザー名が空でエラー
    it('空文字の場合エラー「ユーザー名を入力してください」', () => {
      const data = { userName: '', nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザー名を入力してください',
        );
      }
    });

    // SCH1-03: ユーザー名が2文字でエラー（境界値）
    it('2文字の場合エラー「ユーザー名は3文字以上で入力してください」', () => {
      const data = { userName: 'ab', nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザー名は3文字以上で入力してください',
        );
      }
    });

    // SCH1-04: ユーザー名が3文字で成功（境界値）
    it('3文字の場合成功', () => {
      const data = { userName: 'abc', nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // SCH1-05: ユーザー名が20文字で成功（境界値）
    it('20文字の場合成功', () => {
      const data = { userName: 'a'.repeat(20), nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // SCH1-06: ユーザー名が21文字でエラー（境界値）
    it('21文字の場合エラー「ユーザー名は20文字以内で入力してください」', () => {
      const data = { userName: 'a'.repeat(21), nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザー名は20文字以内で入力してください',
        );
      }
    });

    // SCH1-07: ユーザー名に特殊文字でエラー
    it('特殊文字を含む場合エラー「ユーザー名は英数字とアンダースコアのみ使用できます」', () => {
      const data = { userName: 'taro@#$', nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ユーザー名は英数字とアンダースコアのみ使用できます',
        );
      }
    });

    // SCH1-08: 英数字＋アンダースコアで成功
    it('英数字とアンダースコアのみで成功', () => {
      const data = { userName: 'Taro_123', nickname: '太郎' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // 表示名バリデーション
  describe('表示名', () => {
    // SCH1-09: 表示名が空でエラー
    it('空文字の場合エラー「表示名を入力してください」', () => {
      const data = { userName: 'taro', nickname: '' };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nicknameIssue = result.error.issues.find(
          (i) => i.path[0] === 'nickname',
        );
        expect(nicknameIssue?.message).toBe('表示名を入力してください');
      }
    });

    // SCH1-10: 表示名が50文字で成功（境界値）
    it('50文字の場合成功', () => {
      const data = { userName: 'taro', nickname: 'あ'.repeat(50) };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // SCH1-11: 表示名が51文字でエラー（境界値）
    it('51文字の場合エラー「表示名は50文字以内で入力してください」', () => {
      const data = { userName: 'taro', nickname: 'あ'.repeat(51) };
      const result = signupFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nicknameIssue = result.error.issues.find(
          (i) => i.path[0] === 'nickname',
        );
        expect(nicknameIssue?.message).toBe(
          '表示名は50文字以内で入力してください',
        );
      }
    });
  });

  // SCH1-12: エラーメッセージが日本語で正しい
  describe('エラーメッセージ', () => {
    it('すべてのエラーメッセージが日本語', () => {
      // 空のユーザー名
      const r1 = signupFormSchema.safeParse({ userName: '', nickname: '' });
      if (!r1.success) {
        for (const issue of r1.error.issues) {
          expect(issue.message).toMatch(/[ぁ-ん|ァ-ヶ|亜-熙]/);
        }
      }
    });
  });
});

describe('signupStep2Schema（Step2 バリデーション）', () => {
  // SCH2-01: 全項目空で成功（任意項目のため）
  it('全項目空でパース成功', () => {
    const data = {};
    const result = signupStep2Schema.safeParse(data);
    expect(result.success).toBe(true);
  });

  describe('自己紹介', () => {
    // SCH2-02: 自己紹介が500文字で成功（境界値）
    it('500文字で成功', () => {
      const data = { bio: 'a'.repeat(500) };
      const result = signupStep2Schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // SCH2-03: 自己紹介が501文字でエラー（境界値）
    it('501文字でエラー「自己紹介は500文字以内で入力してください」', () => {
      const data = { bio: 'a'.repeat(501) };
      const result = signupStep2Schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '自己紹介は500文字以内で入力してください',
        );
      }
    });
  });

  describe('好きなシナリオ', () => {
    // SCH2-04: 好きなシナリオが500文字で成功（境界値）
    it('500文字で成功', () => {
      const data = { favoriteScenarios: 'a'.repeat(500) };
      const result = signupStep2Schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // SCH2-05: 好きなシナリオが501文字でエラー（境界値）
    it('501文字でエラー「500文字以内で入力してください」', () => {
      const data = { favoriteScenarios: 'a'.repeat(501) };
      const result = signupStep2Schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '500文字以内で入力してください',
        );
      }
    });
  });
});
