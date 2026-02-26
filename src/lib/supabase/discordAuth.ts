import type { User } from '@supabase/supabase-js';

type JsonLike = Record<string, unknown>;

/**
 * Supabase Auth の Discord identity から Discord のユーザーID（Snowflake）を抽出する。
 */
export const getDiscordAccountIdFromAuthUser = (
  authUser: User,
): string | null => {
  const discordIdentity = authUser.identities?.find(
    (identity) => identity.provider === 'discord',
  );

  if (!discordIdentity) {
    return null;
  }

  const identityRecord = discordIdentity as unknown as JsonLike;
  const providerId = identityRecord.provider_id;
  if (typeof providerId === 'string' && providerId.length > 0) {
    return providerId;
  }

  const identityData = identityRecord.identity_data as JsonLike | undefined;
  const sub = identityData?.sub;
  if (typeof sub === 'string' && sub.length > 0) {
    return sub;
  }

  return null;
};
