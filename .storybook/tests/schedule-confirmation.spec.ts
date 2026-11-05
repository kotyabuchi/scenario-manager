import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'UTC' });

test(
  '確定日程の保存失敗を通知し、旧枠と追加候補を保持して再試行できる',
  {
    tag: ['@case:schedule-save-error', '@variant:save-error', '@binding:main'],
  },
  async ({ page }) => {
    // このStoryのcallbackは常にResult失敗を返す。DBや認可の証拠にはしない。
    await page.goto(
      '/iframe.html?id=sessions-日程調整-availabilityworkspaces--confirm-save-error&viewMode=story',
    );
    const editor = page.getByRole('region', {
      name: '日程を追加',
      exact: true,
    });
    await expect(editor).toBeVisible();
    const selection = editor.locator('..');
    const selectedBlocks = selection.getByRole('listitem');
    const oldBlock = /3\/1 .*12:00 - 15:00/;
    await expect(selectedBlocks).toHaveText([oldBlock]);

    for (const block of [
      { start: '2026-03-02T12:00', end: '2026-03-02T14:00' },
      { start: '2026-03-03T18:00', end: '2026-03-03T20:00' },
    ]) {
      await editor.getByLabel('開始', { exact: true }).fill(block.start);
      await editor.getByLabel('終了', { exact: true }).fill(block.end);
      await editor.getByRole('button', { name: '追加', exact: true }).click();
    }
    const expectedBlocks = [
      oldBlock,
      /3\/2 .*12:00 - 14:00/,
      /3\/3 .*18:00 - 20:00/,
    ];
    await expect(selectedBlocks).toHaveText(expectedBlocks);
    const confirm = page
      .getByRole('button', { name: '日程を確定', exact: true })
      .filter({ visible: true });

    for (const attempt of [1, 2]) {
      await expect(confirm).toBeEnabled();
      await confirm.click();
      await expect(
        selection.getByText(`保存に失敗しました（${attempt}回目）`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(selectedBlocks).toHaveText(expectedBlocks);
      await expect(
        page.getByRole('button', { name: '保存中...', exact: true }),
      ).toHaveCount(0);
      await expect(confirm).toBeEnabled();
      await expect(editor.getByLabel('開始', { exact: true })).toBeEnabled();
      await expect(editor.getByLabel('終了', { exact: true })).toBeEnabled();
      await expect(
        editor.getByRole('button', { name: '追加', exact: true }),
      ).toBeEnabled();
      await expect(
        selection.getByText('確定日程を保存しました。', { exact: true }),
      ).toHaveCount(0);
    }
  },
);
