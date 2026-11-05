import { expect } from '@playwright/test';

import { test } from '../fixtures/test';
import {
  buildScheduleBlocks,
  expectDetailSchedule,
  expectPersistedSchedule,
  readScheduleSnapshot,
} from '../helpers/schedule-confirmation';
import { ScheduleConfirmPage } from '../pages/schedule-confirm-page';

test.use({ timezoneId: 'Asia/Tokyo' });

for (const variant of ['creator-only', 'keeper-only'] as const) {
  test(
    `${variant}が複数枠を確定して全置換し、別参加者が再表示する`,
    {
      tag: [
        '@case:schedule-confirm-persist',
        `@variant:${variant}`,
        '@binding:main',
      ],
    },
    async ({ sessionFixture, actors, asActor }) => {
      const { sessionId } = sessionFixture;
      const operator = actors[variant];
      const observer = actors['confirmed-player'];
      const operatorContext = await asActor(variant);
      const observerContext = await asActor('confirmed-player');
      const operatorPage = await operatorContext.newPage();
      const observerPage = await observerContext.newPage();
      const confirm = new ScheduleConfirmPage(operatorPage);
      const initial = await readScheduleSnapshot(operator.client, sessionId);
      expect(initial.session).toMatchObject({
        created_by_id: sessionFixture.creatorId,
        keeper_id: sessionFixture.keeperId,
        session_phase: 'PREPARATION',
        schedule_phase: 'ADJUSTING',
      });
      expect(initial.blocks).toEqual([]);

      const first = buildScheduleBlocks(
        sessionFixture.timeBlock.startAt,
        [0, 1],
      );
      const replacement = buildScheduleBlocks(
        sessionFixture.timeBlock.startAt,
        [2, 3],
      );
      let previousIds: string[] = [];
      for (const blocks of [first, replacement]) {
        await confirm.goto(sessionId);
        await expect(confirm.pageTitle).toBeVisible();
        if (previousIds.length > 0) {
          await confirm.expectCandidates(first);
          await confirm.removeAllTimeBlocks();
        }
        for (const block of blocks) await confirm.addTimeBlock(block);
        await confirm.expectCandidates(blocks);
        await confirm.confirm();
        await expect(confirm.successMessage).toBeVisible();
        await operatorPage.reload();
        await confirm.expectCandidates(blocks);

        const saved = await expectPersistedSchedule(
          operator.client,
          sessionId,
          blocks,
          operator.identity.appUserId,
        );
        expect(await readScheduleSnapshot(observer.client, sessionId)).toEqual(
          saved,
        );
        expect(
          saved.blocks.some((block) =>
            previousIds.includes(block.game_schedule_time_block_id),
          ),
        ).toBe(false);
        previousIds = saved.blocks.map(
          (block) => block.game_schedule_time_block_id,
        );
        await expectDetailSchedule(operatorPage, sessionId, blocks);
        await expectDetailSchedule(observerPage, sessionId, blocks);
      }
    },
  );
}
