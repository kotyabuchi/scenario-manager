import { expect, test } from '@playwright/test';

/**
 * 認証済みナビゲーションのE2Eテスト
 */
test.describe('認証済みナビゲーション', () => {
  const profileControl = (page: import('@playwright/test').Page) =>
    page
      .getByRole('link', { name: /プロフィール/ })
      .or(page.getByRole('button', { name: 'プロフィール' }))
      .filter({ visible: true });

  test('プロフィールアバターが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await expect(profileControl(page)).toBeVisible();
  });

  test('アバタークリックでプロフィールに遷移する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await profileControl(page).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('ログインボタンの代わりにアバターが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    // ログインボタンが非表示
    await expect(
      page.getByRole('button', { name: 'ログイン' }),
    ).not.toBeVisible();
    // PCのサイドメニューまたはモバイルのヘッダーにプロフィール導線がある
    await expect(profileControl(page)).toBeVisible();
  });
});
