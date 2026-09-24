import { expect, test } from '@playwright/test';

test.describe('未ログイン操作の認証案内', () => {
  test('参加予定を押すとページを離れずに認証案内を表示する', async ({
    page,
  }) => {
    await page.goto('/sessions');
    await page.getByRole('button', { name: '参加予定' }).click();

    const dialog = page.getByRole('dialog', { name: 'ログイン / 新規登録' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      '参加予定を確認するにはログインが必要です。',
    );
    await expect(page).toHaveURL(/\/sessions(?:\?tab=public)?$/);

    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await expect
        .poll(async () => {
          const box = await dialog.boundingBox();
          return box
            ? Math.abs(box.y + box.height - viewport.height)
            : Infinity;
        })
        .toBeLessThan(2);
    }

    await page.getByRole('button', { name: 'あとで' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('ホームを押すと空白ページへ移動せず認証案内を表示する', async ({
    page,
  }) => {
    await page.goto('/scenarios');
    await page
      .getByRole('link', { name: 'ホーム', exact: true })
      .filter({ visible: true })
      .first()
      .click();

    await expect(
      page.getByRole('dialog', { name: 'ログイン / 新規登録' }),
    ).toContainText('ホームを見るにはログインが必要です。');
    await expect(page).toHaveURL(/\/scenarios$/);
  });
});
