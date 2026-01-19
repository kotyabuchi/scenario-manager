import { desc, eq, inArray, or } from 'drizzle-orm';

import { db } from '@/db';
import { gameSessions, scenarios, sessionParticipants } from '@/db/schema';
import { err, ok, type Result } from '@/types/result';

import type { NewScenario, UpcomingSession } from './interface';

/**
 * 参加予定のセッションを取得（最大3件）
 */
export const getUpcomingSessions = async (
  userId: string,
): Promise<Result<UpcomingSession[]>> => {
  try {
    // ユーザーが参加しているセッションIDを取得
    const participantSessions = await db.query.sessionParticipants.findMany({
      where: eq(sessionParticipants.userId, userId),
      columns: {
        sessionId: true,
      },
    });

    if (participantSessions.length === 0) {
      return ok([]);
    }

    const sessionIds = participantSessions.map(
      (p: { sessionId: string }) => p.sessionId,
    );

    // セッション情報を取得（RECRUITING/PREPARATION/IN_PROGRESS）
    const sessions = await db.query.gameSessions.findMany({
      where: or(
        inArray(gameSessions.gameSessionId, sessionIds),
        eq(gameSessions.sessionPhase, 'RECRUITING'),
        eq(gameSessions.sessionPhase, 'PREPARATION'),
        eq(gameSessions.sessionPhase, 'IN_PROGRESS'),
      ),
      with: {
        scenario: {
          with: {
            system: true,
          },
        },
        participants: {
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(gameSessions.createdAt)],
      limit: 3,
    });

    return ok(sessions);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 新着シナリオを取得（最大3件）
 */
export const getNewScenarios = async (): Promise<Result<NewScenario[]>> => {
  try {
    const newScenarios = await db.query.scenarios.findMany({
      with: {
        system: true,
        scenarioTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(scenarios.createdAt)],
      limit: 3,
    });

    return ok(newScenarios as NewScenario[]);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
