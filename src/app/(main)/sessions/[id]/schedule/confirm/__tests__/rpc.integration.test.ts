import { describe, expect, test } from 'vitest';

import { completeIntegrationCheck } from '@/__tests__/helpers/integrationEvidence';
import {
  expectIntegrationSchedule,
  integrationTimeBlocks,
  scheduleRpcArguments,
  seedIntegrationSchedule,
  withIntegrationFixture,
} from '@/__tests__/helpers/integrationFixture';

const TARGET = 'rpc:replace_confirmed_schedule_time_blocks';

describe.sequential('確定日程RPCの利用者JWTと原子性', () => {
  for (const variant of ['creator-only', 'keeper-only'] as const) {
    test(
      `${variant}のJWTが複数枠を全置換できる`,
      {
        meta: {
          ledger: { caseId: 'schedule-rpc-allow', variant, binding: 'main' },
        },
      },
      async (context) => {
        await withIntegrationFixture(
          context,
          [{ role: 'operator', kind: variant }],
          async (fixture, evidence) => {
            const before = await seedIntegrationSchedule(fixture);
            const operator = fixture.actors[variant];
            const blocks = integrationTimeBlocks(
              fixture.session.timeBlock,
              [2, 3],
            );
            const result = await operator.client.rpc(
              'replace_confirmed_schedule_time_blocks',
              scheduleRpcArguments(
                fixture.session.sessionId,
                operator.identity.appUserId,
                blocks,
              ),
            );
            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(blocks.length);
            const after = await fixture.snapshot();
            expect(
              result.data?.toSorted(
                (left, right) => left.block_order - right.block_order,
              ),
            ).toEqual(after.blocks);
            expect(after.session).toMatchObject({
              created_by_id: fixture.session.creatorId,
              keeper_id: fixture.session.keeperId,
            });
            expect(fixture.session.creatorId).not.toBe(
              fixture.session.keeperId,
            );
            expectIntegrationSchedule(
              after,
              blocks,
              operator.identity.appUserId,
            );
            expect(
              after.blocks.some((block) =>
                before.blocks.some(
                  (old) =>
                    old.game_schedule_time_block_id ===
                    block.game_schedule_time_block_id,
                ),
              ),
            ).toBe(false);
            completeIntegrationCheck(evidence, TARGET, 'persist');
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
        );
      },
    );
  }

  for (const variant of ['anonymous', 'outsider', 'actor-mismatch'] as const) {
    test(
      `${variant}の呼出を拒否し旧状態を保持する`,
      {
        meta: {
          ledger: { caseId: 'schedule-rpc-deny', variant, binding: 'main' },
        },
      },
      async (context) => {
        const operator = variant === 'actor-mismatch' ? 'keeper-only' : variant;
        const claimed = variant === 'outsider' ? 'outsider' : 'creator-only';
        await withIntegrationFixture(
          context,
          [
            { role: 'operator', kind: operator },
            { role: 'claimed-actor', kind: claimed },
          ],
          async (fixture, evidence) => {
            const before = await seedIntegrationSchedule(fixture);
            const result = await fixture.actors[operator].client.rpc(
              'replace_confirmed_schedule_time_blocks',
              scheduleRpcArguments(
                fixture.session.sessionId,
                fixture.actors[claimed].identity.appUserId,
                integrationTimeBlocks(fixture.session.timeBlock, [2, 3]),
              ),
            );
            expect(result.data).toBeNull();
            expect(result.error?.code).toBe('P0001');
            expect(result.error?.message).toBe(
              variant === 'anonymous'
                ? 'Not authenticated'
                : variant === 'outsider'
                  ? 'Not authorized to modify this session schedule'
                  : 'User ID mismatch',
            );
            expect(await fixture.snapshot()).toEqual(before);
            completeIntegrationCheck(evidence, TARGET, 'authorization');
          },
        );
      },
    );
  }

  for (const operator of ['creator-only', 'keeper-only'] as const) {
    const variant =
      operator === 'creator-only'
        ? 'creator-atomic-failure'
        : 'keeper-atomic-failure';
    test(
      `${operator}の混在不正枠で親更新と旧枠削除を全rollbackする`,
      {
        meta: {
          ledger: { caseId: 'schedule-rpc-atomic', variant, binding: 'main' },
        },
      },
      async (context) => {
        await withIntegrationFixture(
          context,
          [{ role: 'operator', kind: operator }],
          async (fixture, evidence) => {
            const before = await seedIntegrationSchedule(fixture);
            const args = scheduleRpcArguments(
              fixture.session.sessionId,
              fixture.actors[operator].identity.appUserId,
              integrationTimeBlocks(fixture.session.timeBlock, [2, 3]),
            );
            const invalid = args.p_time_blocks[1];
            if (!invalid) throw new Error('原子性試験の第2枠がありません');
            invalid.blockOrder = 0;
            const result = await fixture.actors[operator].client.rpc(
              'replace_confirmed_schedule_time_blocks',
              args,
            );
            expect(result.data).toBeNull();
            expect(result.error?.code).toBe('23514');
            expect(result.error?.message).toMatch(/block_order/);
            expect(await fixture.snapshot()).toEqual(before);
            completeIntegrationCheck(evidence, TARGET, 'atomicity');
          },
        );
      },
    );
  }
});
