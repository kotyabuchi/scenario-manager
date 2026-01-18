'use server';

import { revalidatePath } from 'next/cache';

import { toggleFavorite, togglePlayed } from './adapter';

/**
 * お気に入り状態をトグルする
 */
export const toggleFavoriteAction = async (
  scenarioId: string,
  userId: string,
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> => {
  const result = await toggleFavorite(scenarioId, userId);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(`/scenarios/${scenarioId}`);
  return { success: true, isFavorite: result.data };
};

/**
 * プレイ済み状態をトグルする
 */
export const togglePlayedAction = async (
  scenarioId: string,
  userId: string,
): Promise<{ success: boolean; isPlayed?: boolean; error?: string }> => {
  const result = await togglePlayed(scenarioId, userId);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  revalidatePath(`/scenarios/${scenarioId}`);
  return { success: true, isPlayed: result.data };
};
