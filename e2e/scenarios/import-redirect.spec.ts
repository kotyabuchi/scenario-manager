import { expect, test } from '@playwright/test';

/**
 * 未認証ユーザーのリダイレクトテスト
 * 認証なしプロジェクト（chromium / mobile-chrome）で実行
 */
test.describe('未認証リダイレクト', () => {
  test('未認証ユーザーはインポートページからトップにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/scenarios/import');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});
