import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isErr, isOk } from '@/types/result';

import type { Result } from '@/types/result';
import type { UserNameAvailability } from '../adapter';

// TODO: Green フェーズで実際の実装に差し替え
// import { checkUserNameAvailability } from '../adapter'

// スタブ（Supabaseモック前提）
const checkUserNameAvailability =
  vi.fn<(userName: string) => Promise<Result<UserNameAvailability>>>();

describe('checkUserNameAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CHK-01: 未使用のユーザー名は available: true を返す
  it('未使用のユーザー名は available: true を返す', async () => {
    checkUserNameAvailability.mockResolvedValue({
      success: true,
      data: { available: true },
    });

    const result = await checkUserNameAvailability('unique_name');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data.available).toBe(true);
    }
  });

  // CHK-02: 使用済みのユーザー名は available: false を返す
  it('使用済みのユーザー名は available: false を返す', async () => {
    checkUserNameAvailability.mockResolvedValue({
      success: true,
      data: { available: false },
    });

    const result = await checkUserNameAvailability('existing_user');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data.available).toBe(false);
    }
  });

  // CHK-03: DB接続エラー時はResult.errを返す
  it('DB接続エラー時はResult.errを返す', async () => {
    checkUserNameAvailability.mockResolvedValue({
      success: false,
      error: new Error('DB接続エラー'),
    });

    const result = await checkUserNameAvailability('any_name');

    expect(isErr(result)).toBe(true);
  });

  // CHK-04: 空文字はバリデーションエラー
  it('空文字はバリデーションエラーを返す', async () => {
    checkUserNameAvailability.mockResolvedValue({
      success: false,
      error: new Error('ユーザー名を入力してください'),
    });

    const result = await checkUserNameAvailability('');

    expect(isErr(result)).toBe(true);
  });
});
