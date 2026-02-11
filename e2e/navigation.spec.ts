import { expect, test } from '@playwright/test';

/**
 * グローバルナビゲーションのE2Eテスト
 */
test.describe('グローバルナビゲーション', () => {
  // ヘッダーのnav要素内にスコープ（ページ本文のリンクと区別）
  const headerNav = (page: import('@playwright/test').Page) =>
    page.locator('header nav');

  test('ヘッダーロゴがリンクとして存在する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    // ロゴはnav外にあるため、「シナプレ管理くん」リンクで特定
    const logo = page.getByRole('link', { name: 'シナプレ管理くん' });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/home');
  });

  test('「シナリオ」ナビリンクが /scenarios に遷移する', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('domcontentloaded');
    await headerNav(page).getByRole('link', { name: 'シナリオ' }).click();
    await expect(page).toHaveURL(/\/scenarios/);
  });

  test('「セッション」ナビリンクが /sessions に遷移する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await headerNav(page).getByRole('link', { name: 'セッション' }).click();
    await expect(page).toHaveURL(/\/sessions/);
  });

  test('未認証時にログインボタンが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('アクティブなナビリンクが aria-current を持つ', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const activeLink = headerNav(page).locator('a[aria-current="page"]');
    await expect(activeLink).toHaveCount(1);
    await expect(activeLink).toContainText('シナリオ');
  });
});
