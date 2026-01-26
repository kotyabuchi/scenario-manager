import { eq } from 'drizzle-orm';
import { isNil } from 'ramda';

import { getDb } from '@/db';
import {
  ParticipantStatuses,
  ParticipantTypes,
  SessionPhases,
} from '@/db/enum';
import { gameSessions, sessionParticipants, users } from '@/db/schema';
import { err, ok, type Result } from '@/types/result';

import type { CreateSessionInput } from './schema';

/**
 * セッション作成結果の型
 */
export type CreateSessionResult = {
  gameSessionId: string;
  sessionName: string;
  sessionPhase: string;
  scenarioId: string | null;
  scheduledAt: Date | null;
  recruitedPlayerCount: number | null;
  tools: string | null;
  isBeginnerFriendly: boolean;
  visibility: string;
};

/**
 * セッション詳細の型（参加者・シナリオ情報含む）
 */
export type SessionWithRelations = {
  gameSessionId: string;
  sessionName: string;
  sessionDescription: string;
  sessionPhase: string;
  scenarioId: string | null;
  scheduledAt: Date | null;
  recruitedPlayerCount: number | null;
  tools: string | null;
  isBeginnerFriendly: boolean;
  visibility: string;
  scenario: {
    scenarioId: string;
    scenarioName: string;
  } | null;
  participants: Array<{
    userId: string;
    participantType: string;
    participantStatus: string;
    applicationMessage: string | null;
  }>;
};

/**
 * エラーメッセージ定数
 */
const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'ユーザーが見つかりません',
  SESSION_NOT_FOUND: 'セッションが見つかりません',
  CREATE_FAILED: 'セッションの作成に失敗しました',
  NO_PERMISSION: 'この操作を行う権限がありません',
} as const;

/**
 * セッションを作成する
 *
 * @param input - セッション作成入力
 * @param userId - 作成者のユーザーID
 * @returns 作成されたセッション情報
 *
 * 要件: requirements-session-flow.md Section 3
 * - US-S101: シナリオ未定でも募集可能
 * - US-S102: 日程未定でも募集可能
 * - US-S103: 人数未定でも募集可能
 */
export const createSession = async (
  input: CreateSessionInput,
  userId: string,
): Promise<Result<CreateSessionResult>> => {
  const db = getDb();

  try {
    // ユーザーの存在確認
    const user = await db.query.users.findFirst({
      where: eq(users.userId, userId),
    });

    if (isNil(user)) {
      return err(new Error(ERROR_MESSAGES.USER_NOT_FOUND));
    }

    // セッションを作成
    const [createdSession] = await db
      .insert(gameSessions)
      .values({
        sessionName: input.sessionName,
        sessionDescription: input.sessionDescription,
        scenarioId: input.scenarioId ?? null,
        keeperId: userId,
        sessionPhase: SessionPhases.RECRUITING.value,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        recruitedPlayerCount: input.recruitedPlayerCount ?? null,
        tools: input.tools ?? null,
        isBeginnerFriendly: input.isBeginnerFriendly,
        visibility: input.visibility,
      })
      .returning();

    if (isNil(createdSession)) {
      return err(new Error(ERROR_MESSAGES.CREATE_FAILED));
    }

    // 作成者をKEEPERとして参加者に追加（確定済み状態）
    await db.insert(sessionParticipants).values({
      sessionId: createdSession.gameSessionId,
      userId: userId,
      participantType: ParticipantTypes.KEEPER.value,
      participantStatus: ParticipantStatuses.CONFIRMED.value,
      appliedAt: new Date(),
      approvedAt: new Date(),
    });

    return ok({
      gameSessionId: createdSession.gameSessionId,
      sessionName: createdSession.sessionName,
      sessionPhase: createdSession.sessionPhase,
      scenarioId: createdSession.scenarioId,
      scheduledAt: createdSession.scheduledAt,
      recruitedPlayerCount: createdSession.recruitedPlayerCount,
      tools: createdSession.tools,
      isBeginnerFriendly: createdSession.isBeginnerFriendly,
      visibility: createdSession.visibility,
    });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error(ERROR_MESSAGES.CREATE_FAILED),
    );
  }
};

/**
 * セッションをIDで取得する
 *
 * @param sessionId - セッションID
 * @returns セッション情報（参加者・シナリオ情報含む）、存在しない場合はnull
 */
export const getSessionById = async (
  sessionId: string,
): Promise<Result<SessionWithRelations | null>> => {
  const db = getDb();

  try {
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.gameSessionId, sessionId),
      with: {
        scenario: {
          columns: {
            scenarioId: true,
            name: true,
          },
        },
        participants: {
          columns: {
            userId: true,
            participantType: true,
            participantStatus: true,
            applicationMessage: true,
          },
        },
      },
    });

    if (isNil(session)) {
      return ok(null);
    }

    return ok({
      gameSessionId: session.gameSessionId,
      sessionName: session.sessionName,
      sessionDescription: session.sessionDescription,
      sessionPhase: session.sessionPhase,
      scenarioId: session.scenarioId,
      scheduledAt: session.scheduledAt,
      recruitedPlayerCount: session.recruitedPlayerCount,
      tools: session.tools,
      isBeginnerFriendly: session.isBeginnerFriendly,
      visibility: session.visibility,
      scenario: session.scenario
        ? {
            scenarioId: session.scenario.scenarioId,
            scenarioName: session.scenario.name,
          }
        : null,
      participants: session.participants.map((p) => ({
        userId: p.userId,
        participantType: p.participantType,
        participantStatus: p.participantStatus,
        applicationMessage: p.applicationMessage,
      })),
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
