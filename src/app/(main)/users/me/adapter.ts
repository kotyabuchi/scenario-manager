import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { err, ok, type Result } from '@/types/result';

import type { UpdateProfileInput, User } from './interface';

/**
 * Discord IDでユーザーを取得する
 */
export const getUserByDiscordId = async (
  discordId: string,
): Promise<Result<User | null>> => {
  const db = getDb();
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.discordId, discordId),
    });

    return ok(result ?? null);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * ユーザープロフィールを更新する
 */
export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput,
): Promise<Result<User>> => {
  const db = getDb();
  try {
    const [updated] = await db
      .update(users)
      .set({
        nickname: input.nickname,
        bio: input.bio ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.userId, userId))
      .returning();

    if (!updated) {
      return err(new Error('ユーザーが見つかりません'));
    }

    return ok(updated);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
