import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { users } from '@/db/schema';
import { err, ok, type Result } from '@/types/result';

import type { User } from './interface';

/**
 * ユーザーIDでユーザーを取得する
 */
export const getUserById = async (
  userId: string,
): Promise<Result<User | null>> => {
  const db = getDb();
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.userId, userId),
    });

    return ok(result ?? null);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('ユーザーの取得に失敗しました'),
    );
  }
};

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
    return err(
      e instanceof Error ? e : new Error('ユーザーの取得に失敗しました'),
    );
  }
};
