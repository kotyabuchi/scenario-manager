import { expect, test } from '@playwright/test';

/**
 * サンプルE2Eテスト
 * このファイルはテンプレートとして参照してください
 */
test.describe('サンプルテスト', () => {
  test('ホームページが表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルを確認
    await expect(page).toHaveTitle(/scenario-manager/i);
  });
});
