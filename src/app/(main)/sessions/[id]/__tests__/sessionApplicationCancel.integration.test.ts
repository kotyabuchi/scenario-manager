import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';
import { describe, expect, test } from 'vitest';

import { cancelApplicationAction } from '../actions';
import { getApplications } from '../applications/adapter';
import { cancelApplicationSchema } from '../schema';

import { completeIntegrationCheck } from '@/__tests__/helpers/integrationEvidence';
import { withApplicationIntegrationFixture } from '@/__tests__/helpers/integrationFixture';
import { withIntegrationRequest } from '@/__tests__/helpers/integrationRequest';

const TARGET =
  'action:src/app/(main)/sessions/[id]/actions.ts#cancelApplicationAction';
const denied = [
  { variant: 'anonymous', message: 'ログインが必要です' },
  { variant: 'outsider', message: 'このセッションに参加していません' },
  {
    variant: 'confirmed-player',
    message: '承認済みの申請は取り消せません。辞退してください',
  },
] as const;

// wire境界では型付きフォームを経由しない値もActionに到達する。
const cancelWithWireInput = async (
  sessionId: string,
  input: unknown,
): Promise<unknown> => {
  const result: unknown = await Reflect.apply(
    cancelApplicationAction,
    undefined,
    [sessionId, input],
  );
  return result;
};

describe.sequential('参加申請取消Actionの利用者JWT境界', () => {
  test(
    '本人のPENDINGだけを削除し、別の主催者リクエストでも消失する',
    {
      meta: {
        ledger: {
          caseId: 'session-application-cancel',
          variant: 'applicant',
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
          const result = await withIntegrationRequest(
            actors.applicant,
            journal.ownerTag,
            () => cancelApplicationAction(sessionId, {}),
          );
          expect(result.success).toBe(true);

          const saved = await snapshot('applicant');
          const remaining = initial.participants.filter(
            (row) => row.user_id !== applicantId,
          );
          expect(saved).toEqual({
            session: initial.session,
            participants: remaining,
          });
          const listed = await withIntegrationRequest(
            actors['creator-only'],
            journal.ownerTag,
            () => getApplications(sessionId),
          );
          expect(listed.success).toBe(true);
          if (!listed.success)
            throw new Error('主催者の申請一覧を再取得できません');
          expect(listed.data.map(({ userId }) => userId).sort()).toEqual(
            remaining.map((row) => row.user_id).sort(),
          );
          await journal.removed({
            kind: 'session_participants',
            sessionId,
            userId: applicantId,
          });
          expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(
            `/sessions/${sessionId}`,
          );
          completeIntegrationCheck(evidence, TARGET, 'persist');
          completeIntegrationCheck(evidence, TARGET, 'authorization');
        },
        { pendingApplicant: true },
      );
    },
  );

  for (const { variant, message } of denied) {
    test(
      `${variant}の取消を拒否し、他人のPENDINGを保持する`,
      {
        meta: {
          ledger: {
            caseId: 'session-application-cancel-deny',
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
            const { sessionId, applicantId } = session;
            const result = await withIntegrationRequest(
              actors[variant],
              journal.ownerTag,
              () =>
                variant === 'outsider'
                  ? cancelWithWireInput(sessionId, { userId: applicantId })
                  : cancelApplicationAction(sessionId, {}),
            );
            expect(result).toMatchObject({
              success: false,
              error: { message },
            });
            expect(await snapshot()).toEqual(initial);
            expect(revalidatePath).not.toHaveBeenCalled();
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
          { pendingApplicant: true },
        );
      },
    );
  }

  test(
    '非objectの取消入力を拒否し、本人のPENDINGを保持する',
    {
      meta: {
        ledger: {
          caseId: 'session-application-cancel-invalid',
          variant: 'non-object',
          binding: 'main',
        },
      },
    },
    async (context) => {
      await withApplicationIntegrationFixture(
        context,
        [{ role: 'operator', kind: 'applicant' }],
        async ({ actors, session, journal, initial, snapshot }, evidence) => {
          const input = null;
          const parsed = cancelApplicationSchema.safeParse(input);
          const issue = parsed.success ? undefined : parsed.error.issues[0];
          if (isNil(issue)) throw new Error('取消の不正入力fixtureが無効です');
          const result = await withIntegrationRequest(
            actors.applicant,
            journal.ownerTag,
            () => cancelWithWireInput(session.sessionId, input),
          );
          expect(result).toMatchObject({
            success: false,
            error: { message: issue.message },
          });
          expect(await snapshot('applicant')).toEqual(initial);
          expect(revalidatePath).not.toHaveBeenCalled();
          completeIntegrationCheck(evidence, TARGET, 'validation');
        },
        { pendingApplicant: true },
      );
    },
  );
});
