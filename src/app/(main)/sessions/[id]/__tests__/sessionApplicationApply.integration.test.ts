import { revalidatePath } from 'next/cache';
import { describe, expect, test } from 'vitest';

import { applyToSessionAction } from '../actions';

import { completeIntegrationCheck } from '@/__tests__/helpers/integrationEvidence';
import { withApplicationIntegrationFixture } from '@/__tests__/helpers/integrationFixture';
import { withIntegrationRequest } from '@/__tests__/helpers/integrationRequest';

const TARGET =
  'action:src/app/(main)/sessions/[id]/actions.ts#applyToSessionAction';
const MESSAGE = '申'.repeat(200);
const allowed = [
  { variant: 'applicant', kind: 'applicant' },
  { variant: 'outsider-self', kind: 'outsider' },
] as const;
const denied = [
  { variant: 'anonymous', message: 'ログインが必要です' },
  { variant: 'confirmed-player', message: 'すでに申請済みです' },
] as const;

describe.sequential('参加申請Actionの利用者JWT境界', () => {
  for (const { variant, kind } of allowed) {
    test(
      `${variant}が本人名義でだけ申請し、再取得できる`,
      {
        meta: {
          ledger: {
            caseId: 'session-application-apply',
            variant,
            binding: 'main',
          },
        },
      },
      async (context) => {
        await withApplicationIntegrationFixture(
          context,
          [{ role: 'operator', kind }],
          async ({ actors, session, journal, initial, snapshot }, evidence) => {
            const { sessionId, applicantId, outsiderId } = session;
            const userId = kind === 'applicant' ? applicantId : outsiderId;
            const resource = {
              kind: 'session_participants',
              sessionId,
              userId,
            } as const;
            await journal.reserve(resource);

            // 第三者の申告IDがあっても、認証した本人にだけ申請を作る。
            const input = {
              participantType: 'PLAYER' as const,
              applicationMessage: MESSAGE,
              ...(kind === 'outsider' ? { userId: applicantId } : {}),
            };
            const result = await withIntegrationRequest(
              actors[kind],
              journal.ownerTag,
              () => applyToSessionAction(sessionId, input),
            );
            expect(result.success).toBe(true);

            const saved = await snapshot(kind);
            expect(saved.session).toEqual(initial.session);
            const ownRows = saved.participants.filter(
              (row) => row.user_id === userId,
            );
            expect(ownRows).toEqual([
              expect.objectContaining({
                session_id: sessionId,
                user_id: userId,
                participant_type: 'PLAYER',
                participant_status: 'PENDING',
                application_message: MESSAGE,
                applied_at: expect.any(String),
              }),
            ]);
            expect(
              Number.isFinite(Date.parse(ownRows[0]?.applied_at ?? '')),
            ).toBe(true);
            await journal.record(resource);
            expect(
              saved.participants.filter((row) => row.user_id !== userId),
            ).toEqual(initial.participants);
            expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(
              `/sessions/${sessionId}`,
            );
            completeIntegrationCheck(evidence, TARGET, 'persist');
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
        );
      },
    );
  }

  for (const { variant, message } of denied) {
    test(
      `${variant}の申請を拒否し、参加行と親状態を保持する`,
      {
        meta: {
          ledger: {
            caseId: 'session-application-apply-deny',
            variant,
            binding: 'main',
          },
        },
      },
      async (context) => {
        await withApplicationIntegrationFixture(
          context,
          [{ role: 'operator', kind: variant }],
          async ({ actors, session, journal, initial, snapshot }, evidence) => {
            const result = await withIntegrationRequest(
              actors[variant],
              journal.ownerTag,
              () =>
                applyToSessionAction(session.sessionId, {
                  participantType: 'PLAYER',
                  applicationMessage: MESSAGE,
                }),
            );
            expect(result).toMatchObject({
              success: false,
              error: { message },
            });
            expect(await snapshot()).toEqual(initial);
            expect(revalidatePath).not.toHaveBeenCalled();
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
        );
      },
    );
  }

  test(
    '201文字の申請を拒否し、本人の行を作成しない',
    {
      meta: {
        ledger: {
          caseId: 'session-application-apply-invalid',
          variant: 'message-too-long',
          binding: 'main',
        },
      },
    },
    async (context) => {
      await withApplicationIntegrationFixture(
        context,
        [{ role: 'operator', kind: 'applicant' }],
        async ({ actors, session, journal, initial, snapshot }, evidence) => {
          const { sessionId, applicantId } = session;
          // 誤って作成された本人行も、既存の所有cleanupで回収する。
          await journal.reserve({
            kind: 'session_participants',
            sessionId,
            userId: applicantId,
          });
          const result = await withIntegrationRequest(
            actors.applicant,
            journal.ownerTag,
            () =>
              applyToSessionAction(sessionId, {
                participantType: 'PLAYER',
                applicationMessage: `${MESSAGE}申`,
              }),
          );
          expect(result).toMatchObject({
            success: false,
            error: { message: '一言メッセージは200文字以内で入力してください' },
          });
          expect(await snapshot('applicant')).toEqual(initial);
          expect(revalidatePath).not.toHaveBeenCalled();
          completeIntegrationCheck(evidence, TARGET, 'validation');
        },
      );
    },
  );
});
