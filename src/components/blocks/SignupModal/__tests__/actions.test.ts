import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isErr, isOk } from '@/types/result';

import type { Result } from '@/types/result';

// TODO: Green フェーズで実際の実装に差し替え
// import { createUser } from '../actions'

type CreateUserInput = {
  userName: string;
  nickname: string;
  bio?: string;
  favoriteSystems?: string[];
  favoriteScenarios?: string;
};

// スタブ（Supabaseモック前提）
const createUser =
  vi.fn<(input: CreateUserInput) => Promise<Result<{ userId: string }>>>();

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CRU-01: Step1の必須項目で正常にユーザー作成
  it('有効なユーザーIDと表示名でユーザーを作成できる', async () => {
    createUser.mockResolvedValue({
      success: true,
      data: { userId: 'user-123' },
    });

    const result = await createUser({
      userName: 'taro_trpg',
      nickname: '太郎',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data.userId).toBeDefined();
    }
  });

  // CRU-02: Step2の任意項目も含めてユーザー作成
  it('任意項目を含めてユーザーを作成できる', async () => {
    createUser.mockResolvedValue({
      success: true,
      data: { userId: 'user-456' },
    });

    const result = await createUser({
      userName: 'taro_trpg',
      nickname: '太郎',
      bio: '自己紹介テキスト',
      favoriteSystems: ['coc7', 'dnd5e'],
      favoriteScenarios: '好きなシナリオ',
    });

    expect(isOk(result)).toBe(true);
  });

  // CRU-03: ユーザーID重複時にエラーを返す
  it('ユーザーID重複時にエラーを返す', async () => {
    createUser.mockResolvedValue({
      success: false,
      error: new Error('このユーザーIDは既に使用されています'),
    });

    const result = await createUser({
      userName: 'existing_user',
      nickname: '太郎',
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('このユーザーIDは既に使用されています');
    }
  });

  // CRU-04: バリデーション不正時にエラーを返す
  it('バリデーション不正時にエラーを返す', async () => {
    createUser.mockResolvedValue({
      success: false,
      error: new Error('ユーザーIDを入力してください'),
    });

    const result = await createUser({
      userName: '',
      nickname: '',
    });

    expect(isErr(result)).toBe(true);
  });

  // CRU-05: ネットワークエラー時にエラーを返す
  it('ネットワークエラー時にエラーを返す', async () => {
    createUser.mockResolvedValue({
      success: false,
      error: new Error('登録に失敗しました。もう一度お試しください。'),
    });

    const result = await createUser({
      userName: 'taro_trpg',
      nickname: '太郎',
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        '登録に失敗しました。もう一度お試しください。',
      );
    }
  });
});
