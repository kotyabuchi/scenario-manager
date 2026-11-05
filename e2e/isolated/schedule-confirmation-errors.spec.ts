import { expect } from '@playwright/test';

import { test } from '../fixtures/test';
import {
  buildScheduleBlocks,
  expectPersistedSchedule,
  readScheduleSnapshot,
  toScheduleInput,
} from '../helpers/schedule-confirmation';
import { ScheduleConfirmPage } from '../pages/schedule-confirm-page';

test.use({ timezoneId: 'Asia/Tokyo' });

test(
  '空欄・終了が開始以前・重複の追加を拒否し、候補と保存前の状態を保つ',
  {
    tag: [
      '@case:schedule-confirm-invalid-input',
      '@variant:creator-only',
      '@binding:main',
    ],
  },
  async ({ sessionFixture, actors, asActor }) => {
    const operator = actors['creator-only'];
    const { sessionId } = sessionFixture;
    const context = await asActor('creator-only');
    const page = await context.newPage();
    const confirm = new ScheduleConfirmPage(page);
    const before = await readScheduleSnapshot(operator.client, sessionId);
    expect(before.session).toMatchObject({
      created_by_id: operator.identity.appUserId,
      session_phase: 'PREPARATION',
      schedule_phase: 'ADJUSTING',
      schedule_date: null,
    });
    expect(before.blocks).toEqual([]);

    const blocks = buildScheduleBlocks(sessionFixture.timeBlock.startAt, [0]);
    const block = blocks[0];
    if (!block) throw new Error('候補fixtureがありません。');
    await confirm.goto(sessionId);
    await confirm.addTimeBlock(block);
    await confirm.expectCandidates(blocks);
    expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
      before,
    );

    const start = toScheduleInput(block.startAt);
    const end = toScheduleInput(block.endAt);
    for (const input of [
      { start: '', end, error: '開始・終了日時を入力してください' },
      { start, end: start, error: '終了日時は開始日時より後にしてください' },
      {
        start: end,
        end: start,
        error: '終了日時は開始日時より後にしてください',
      },
      { start, end, error: '既存の確定候補と時間が重複しています' },
    ]) {
      // blurによる30分丸めを含む通常操作で、editor自身の入力拒否を確認する。
      await confirm.startInput.fill(input.start);
      await confirm.endInput.fill(input.end);
      await confirm.addButton.click();
      await expect(confirm.editor.getByRole('alert')).toHaveText(input.error);
      await confirm.expectCandidates(blocks);
      await confirm.pageTitle.scrollIntoViewIfNeeded();
      await expect(confirm.confirmButton).toBeEnabled();
      expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
        before,
      );
    }

    await page.reload();
    await confirm.expectCandidates([]);
    expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
      before,
    );
  },
);

test(
  '21枠の確定を実Actionが拒否し、編集候補と旧確定枠の全値を保つ',
  {
    tag: [
      '@case:schedule-confirm-rejected-preserves',
      '@variant:creator-only',
      '@binding:main',
    ],
  },
  async ({ sessionFixture, actors, asActor }) => {
    const operator = actors['creator-only'];
    const { sessionId } = sessionFixture;
    const context = await asActor('creator-only');
    const page = await context.newPage();
    const confirm = new ScheduleConfirmPage(page);
    const original = buildScheduleBlocks(
      sessionFixture.timeBlock.startAt,
      [0, 1],
    );

    await confirm.goto(sessionId);
    for (const block of original) await confirm.addTimeBlock(block);
    await confirm.expectCandidates(original);
    await confirm.confirm();
    await expect(confirm.successMessage).toBeVisible();
    const before = await expectPersistedSchedule(
      operator.client,
      sessionId,
      original,
      operator.identity.appUserId,
    );
    await page.reload();
    await confirm.expectCandidates(original);

    const additional = buildScheduleBlocks(
      sessionFixture.timeBlock.startAt,
      Array.from({ length: 19 }, (_, index) => index + original.length),
    );
    const draft = [...original, ...additional];
    for (const block of additional) await confirm.addTimeBlock(block);
    await confirm.expectCandidates(draft);
    expect(draft).toHaveLength(21);
    expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
      before,
    );

    // ActionのZod上限を実リクエストで拒否する。RPC途中失敗の証拠にはしない。
    await confirm.confirm();
    await expect(
      confirm.editor
        .locator('..')
        .getByText('確定日程は20件以内にしてください', { exact: true }),
    ).toBeVisible();
    await confirm.expectCandidates(draft);
    await expect(confirm.confirmButton).toBeEnabled();
    await expect(confirm.startInput).toBeEnabled();
    await expect(confirm.endInput).toBeEnabled();
    await expect(confirm.addButton).toBeEnabled();
    await expect(confirm.successMessage).toHaveCount(0);
    expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
      before,
    );

    const lastBlock = draft.at(-1);
    if (!lastBlock) throw new Error('追加候補がありません。');
    await confirm.candidateRows
      .nth(draft.length - 1)
      .getByRole('button', { name: '削除', exact: true })
      .click();
    await confirm.expectCandidates(draft.slice(0, -1));
    await confirm.addTimeBlock(lastBlock);
    await confirm.expectCandidates(draft);
    expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
      before,
    );

    await page.reload();
    await confirm.expectCandidates(original);
    expect(await readScheduleSnapshot(operator.client, sessionId)).toEqual(
      before,
    );
  },
);
