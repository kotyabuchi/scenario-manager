import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { User } from './interface';

/**
 * ユーザーIDでユーザーを取得する
 */
export const getUserById = async (
  userId: string,
): Promise<Result<User | null>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    return ok(data ? (camelCaseKeys(data) as User) : null);
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
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    return ok(data ? (camelCaseKeys(data) as User) : null);
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error('ユーザーの取得に失敗しました'),
    );
  }
};
