import { expect, test } from '@playwright/test';

/**
 * 認証済みナビゲーションのE2Eテスト
 */
test.describe('認証済みナビゲーション', () => {
  test('プロフィールアバターが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const avatar = page.locator('header button[aria-label="プロフィール"]');
    await expect(avatar).toBeVisible();
  });

  test('アバタークリックでプロフィールに遷移する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const avatar = page.locator('header button[aria-label="プロフィール"]');
    await avatar.click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('ログインボタンの代わりにアバターが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    // ログインボタンが非表示
    await expect(
      page.getByRole('button', { name: 'ログイン' }),
    ).not.toBeVisible();
    // アバターが表示
    await expect(
      page.locator('header button[aria-label="プロフィール"]'),
    ).toBeVisible();
  });
});
