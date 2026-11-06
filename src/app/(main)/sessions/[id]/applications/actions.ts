'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../adapter';
import {
  approveApplication,
  isSessionManager,
  rejectApplication,
} from '../../participantAdapter';

import { getAppLogger } from '@/lib/logger';
import { err, ok, type Result } from '@/types/result';

const logger = getAppLogger(['app', 'sessions']);

/**
 * 参加申請を承認する（GM/作成者のみ）
 */
export const approveApplicationAction = async (
  sessionId: string,
  applicantUserId: string,
): Promise<Result<void>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    const result = await approveApplication(sessionId, applicantUserId, userId);
    if (!result.success) {
      logger.error`参加申請承認エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}/applications`);
    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 参加申請を拒否する（GM/作成者のみ）
 */
export const rejectApplicationAction = async (
  sessionId: string,
  applicantUserId: string,
): Promise<Result<void>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    const result = await rejectApplication(sessionId, applicantUserId, userId);
    if (!result.success) {
      logger.error`参加申請拒否エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}/applications`);
    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
