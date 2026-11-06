import { revalidatePath } from 'next/cache';
import { describe, expect, test, vi } from 'vitest';

import { confirmScheduleTimeBlocksAction } from '../actions';

import { completeIntegrationCheck } from '@/__tests__/helpers/integrationEvidence';
import {
  expectIntegrationSchedule,
  integrationTimeBlocks,
  seedIntegrationSchedule,
  withIntegrationFixture,
} from '@/__tests__/helpers/integrationFixture';
import { withIntegrationRequest } from '@/__tests__/helpers/integrationRequest';

import type { AvailabilityTimeBlockInput } from '../../availability/interface';

const TARGET =
  'action:src/app/(main)/sessions/[id]/schedule/confirm/actions.ts#confirmScheduleTimeBlocksAction';

describe.sequential('日程確定Actionの利用者JWT境界', () => {
  for (const variant of ['creator-only', 'keeper-only'] as const) {
    test(
      `${variant}のcookieから本人を解決して複数枠を保存する`,
      {
        meta: {
          ledger: { caseId: 'schedule-action-allow', variant, binding: 'main' },
        },
      },
      async (context) => {
        await withIntegrationFixture(
          context,
          [{ role: 'operator', kind: variant }],
          async (fixture, evidence) => {
            const { sessionId } = fixture.session;
            const blocks = integrationTimeBlocks(fixture.session.timeBlock);
            const result = await withIntegrationRequest(
              fixture.actors[variant],
              fixture.journal.ownerTag,
              () =>
                confirmScheduleTimeBlocksAction(sessionId, {
                  timeBlocks: blocks,
                }),
            );
            expect(result.success).toBe(true);
            if (!result.success) throw new Error('正常Actionが拒否されました');
            expect(result.data).toHaveLength(blocks.length);
            const saved = await fixture.snapshot();
            expectIntegrationSchedule(
              saved,
              blocks,
              fixture.actors[variant].identity.appUserId,
            );
            expect(
              result.data.map((block) => ({
                id: block.gameScheduleTimeBlockId,
                startAt: new Date(block.startAt).toISOString(),
                endAt: new Date(block.endAt).toISOString(),
                order: block.blockOrder,
                createdBy: block.createdBy,
              })),
            ).toEqual(
              saved.blocks.map((block) => ({
                id: block.game_schedule_time_block_id,
                startAt: new Date(block.start_at).toISOString(),
                endAt: new Date(block.end_at).toISOString(),
                order: block.block_order,
                createdBy: block.created_by,
              })),
            );
            expect(vi.mocked(revalidatePath)).toHaveBeenCalledTimes(2);
            expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
              `/sessions/${sessionId}`,
            );
            expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
              `/sessions/${sessionId}/schedule/confirm`,
            );
            completeIntegrationCheck(evidence, TARGET, 'persist');
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
        );
      },
    );
  }

  for (const variant of [
    'anonymous',
    'outsider',
    'phase-recruiting',
  ] as const) {
    test(
      `${variant}の拒否と旧保存値の保持`,
      {
        meta: {
          ledger: { caseId: 'schedule-action-deny', variant, binding: 'main' },
        },
      },
      async (context) => {
        const kind = variant === 'phase-recruiting' ? 'creator-only' : variant;
        await withIntegrationFixture(
          context,
          [{ role: 'operator', kind }],
          async (fixture, evidence) => {
            const before = await seedIntegrationSchedule(fixture);
            const result = await withIntegrationRequest(
              fixture.actors[kind],
              fixture.journal.ownerTag,
              () =>
                confirmScheduleTimeBlocksAction(fixture.session.sessionId, {
                  timeBlocks: integrationTimeBlocks(
                    fixture.session.timeBlock,
                    [2, 3],
                  ),
                }),
            );
            expect(result.success).toBe(false);
            if (result.success) throw new Error('不許可Actionが成功しました');
            expect(result.error.message).toBe(
              variant === 'anonymous'
                ? 'ログインが必要です'
                : variant === 'outsider'
                  ? 'この操作を行う権限がありません'
                  : '準備中フェーズでのみ日程を確定できます',
            );
            expect(await fixture.snapshot()).toEqual(before);
            expect(vi.mocked(revalidatePath)).not.toHaveBeenCalled();
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
          {
            phase:
              variant === 'phase-recruiting' ? 'RECRUITING' : 'PREPARATION',
          },
        );
      },
    );
  }

  for (const variant of ['empty', 'reversed', 'off-grid', 'overlap'] as const) {
    test(
      `${variant}入力を拒否して旧保存値を保持する`,
      {
        meta: {
          ledger: {
            caseId: 'schedule-action-invalid',
            variant,
            binding: 'main',
          },
        },
      },
      async (context) => {
        await withIntegrationFixture(
          context,
          [{ role: 'operator', kind: 'creator-only' }],
          async (fixture, evidence) => {
            const before = await seedIntegrationSchedule(fixture);
            const block = fixture.session.timeBlock;
            const invalid: AvailabilityTimeBlockInput[] =
              variant === 'empty'
                ? []
                : variant === 'reversed'
                  ? [{ startAt: block.endAt, endAt: block.startAt }]
                  : variant === 'off-grid'
                    ? [
                        {
                          ...block,
                          startAt: new Date(
                            Date.parse(block.startAt) + 15 * 60_000,
                          ).toISOString(),
                        },
                      ]
                    : [
                        block,
                        {
                          ...block,
                          startAt: new Date(
                            Date.parse(block.startAt) + 30 * 60_000,
                          ).toISOString(),
                        },
                      ];
            const result = await withIntegrationRequest(
              fixture.actors['creator-only'],
              fixture.journal.ownerTag,
              () =>
                confirmScheduleTimeBlocksAction(fixture.session.sessionId, {
                  timeBlocks: invalid,
                }),
            );
            expect(result.success).toBe(false);
            if (result.success) throw new Error('不正入力Actionが成功しました');
            const messages = {
              empty: '最低1つの日程を選択してください',
              reversed: '開始日時は終了日時より前である必要があります',
              'off-grid': '日時は30分単位で指定してください',
              overlap: '確定日程同士が重複しています',
            };
            expect(result.error.message).toBe(messages[variant]);
            expect(await fixture.snapshot()).toEqual(before);
            expect(vi.mocked(revalidatePath)).not.toHaveBeenCalled();
            completeIntegrationCheck(evidence, TARGET, 'validation');
          },
        );
      },
    );
  }
});
