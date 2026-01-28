// TODO: TDD Green フェーズで実装する
import type { Result } from '@/types/result';

export type UserNameAvailability = {
  available: boolean;
};

export const checkUserNameAvailability = async (
  _userName: string,
): Promise<Result<UserNameAvailability>> => {
  return { success: true, data: { available: false } };
};
