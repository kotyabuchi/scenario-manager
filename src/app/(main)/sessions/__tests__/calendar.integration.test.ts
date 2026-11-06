import { ulid } from 'ulid';
import { describe, expect, test } from 'vitest';

import { getCalendarSessions } from '../adapter';

import { completeIntegrationCheck } from '@/__tests__/helpers/integrationEvidence';
import {
  expectIntegrationSchedule,
  integrationTimeBlocks,
  seedIntegrationSchedule,
  withIntegrationFixture,
} from '@/__tests__/helpers/integrationFixture';
import { withIntegrationRequest } from '@/__tests__/helpers/integrationRequest';

const TARGET =
  'function:src/app/(main)/sessions/adapter.ts#getCalendarSessions';
const YEAR = 2030;
const MONTH = 6;
const START_AT = '2030-06-15T09:00:00Z';

describe.sequential('カレンダーの利用者JWT境界', () => {
  test(
    '存在しないユーザーIDで空配列を返す',
    {
      meta: {
        ledger: {
          caseId: 'schedule-calendar-missing-user',
          variant: 'creator-only',
          binding: 'main',
        },
      },
    },
    async (context) => {
      await withIntegrationFixture(
        context,
        [{ role: 'operator', kind: 'creator-only' }],
        async (fixture, evidence) => {
          const actor = fixture.actors['creator-only'];
          const missingId = ulid();
          const missing = await actor.client
            .from('users')
            .select('user_id')
            .eq('user_id', missingId)
            .maybeSingle();
          expect(missing.error).toBeNull();
          expect(missing.data).toBeNull();
          const result = await withIntegrationRequest(
            actor,
            fixture.journal.ownerTag,
            () => getCalendarSessions(missingId, YEAR, MONTH),
          );
          expect(result.success).toBe(true);
          if (!result.success)
            throw new Error('カレンダー取得が拒否されました');
          expect(result.data).toEqual({
            sessions: [],
            unscheduledSessions: [],
          });
          completeIntegrationCheck(evidence, TARGET, 'response');
        },
        { startAt: START_AT },
      );
    },
  );

  for (const [caseId, title] of [
    [
      'schedule-calendar-user-sessions',
      '存在するユーザーでカレンダーデータを取得できる',
    ],
    ['schedule-calendar-summary', 'カレンダーセッションに必要な情報が含まれる'],
  ] as const) {
    test(
      title,
      {
        meta: {
          ledger: { caseId, variant: 'creator-only', binding: 'main' },
        },
      },
      async (context) => {
        await withIntegrationFixture(
          context,
          [{ role: 'operator', kind: 'creator-only' }],
          async (fixture, evidence) => {
            const actor = fixture.actors['creator-only'];
            const saved = await seedIntegrationSchedule(fixture);
            expectIntegrationSchedule(
              saved,
              integrationTimeBlocks(fixture.session.timeBlock),
              actor.identity.appUserId,
            );
            const result = await withIntegrationRequest(
              actor,
              fixture.journal.ownerTag,
              () => getCalendarSessions(actor.identity.appUserId, YEAR, MONTH),
            );
            expect(result.success).toBe(true);
            if (!result.success)
              throw new Error('カレンダー取得が拒否されました');
            expect(
              result.data.sessions.map((session) => session.gameSessionId),
            ).toEqual([fixture.session.sessionId]);
            expect(result.data).toEqual({
              sessions: [
                {
                  gameSessionId: fixture.session.sessionId,
                  sessionName: `E2E session ${fixture.session.sessionId}`,
                  sessionPhase: 'PREPARATION',
                  scenarioName: `E2E scenario ${fixture.session.scenarioId}`,
                  scheduleDate: saved.session.schedule_date,
                  myRole: 'SPECTATOR',
                },
              ],
              unscheduledSessions: [],
            });
            completeIntegrationCheck(evidence, TARGET, 'response');
          },
          { startAt: START_AT },
        );
      },
    );
  }

  test(
    '日程未確定セッションが別配列で返される',
    {
      meta: {
        ledger: {
          caseId: 'schedule-calendar-unconfirmed',
          variant: 'creator-only',
          binding: 'main',
        },
      },
    },
    async (context) => {
      await withIntegrationFixture(
        context,
        [{ role: 'operator', kind: 'creator-only' }],
        async (fixture, evidence) => {
          const actor = fixture.actors['creator-only'];
          const before = await fixture.snapshot();
          expect(before.session.session_phase).toBe('PREPARATION');
          expect(before.session.schedule_phase).toBe('ADJUSTING');
          expect(before.session.schedule_date).toBeNull();
          expect(before.blocks).toEqual([]);
          const result = await withIntegrationRequest(
            actor,
            fixture.journal.ownerTag,
            () => getCalendarSessions(actor.identity.appUserId, YEAR, MONTH),
          );
          expect(result.success).toBe(true);
          if (!result.success)
            throw new Error('カレンダー取得が拒否されました');
          expect(
            result.data.unscheduledSessions.map(
              (session) => session.gameSessionId,
            ),
          ).toEqual([fixture.session.sessionId]);
          expect(result.data).toEqual({
            sessions: [],
            unscheduledSessions: [
              {
                gameSessionId: fixture.session.sessionId,
                sessionName: `E2E session ${fixture.session.sessionId}`,
                sessionPhase: 'PREPARATION',
                scenarioName: `E2E scenario ${fixture.session.scenarioId}`,
                scheduleDate: null,
                myRole: 'SPECTATOR',
              },
            ],
          });
          completeIntegrationCheck(evidence, TARGET, 'response');
        },
        { startAt: START_AT },
      );
    },
  );
});
