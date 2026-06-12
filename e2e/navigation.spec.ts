import { expect, test } from '@playwright/test';

/**
 * グローバルナビゲーションのE2Eテスト
 * デスクトップでは左サイドバー（AppSidebar）がナビゲーションを担う
 */
test.describe('グローバルナビゲーション（デスクトップ: サイドバー）', () => {
  // AppSidebar はmd以上でのみ表示される
  test.beforeEach(async ({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop only');
  });

  // AppSidebarのaside要素にスコープ（シナリオ検索のasideと区別）
  const sidebar = (page: import('@playwright/test').Page) =>
    page.locator('aside[aria-label="グローバルナビゲーション"]');
  const sidebarNav = (page: import('@playwright/test').Page) =>
    sidebar(page).locator('nav');

  test('サイドバーロゴがリンクとして存在する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const logo = sidebar(page).getByRole('link', { name: 'シナプレ管理くん' });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/home');
  });

  test('「シナリオ」ナビリンクが /scenarios に遷移する', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('domcontentloaded');
    await sidebarNav(page).getByRole('link', { name: 'シナリオ' }).click();
    await expect(page).toHaveURL(/\/scenarios/);
  });

  test('「セッション」ナビリンクが /sessions に遷移する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await sidebarNav(page).getByRole('link', { name: 'セッション' }).click();
    await expect(page).toHaveURL(/\/sessions/);
  });

  test('未認証時にサイドバーにログインボタンが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      sidebar(page).getByRole('button', { name: 'ログイン' }),
    ).toBeVisible();
  });

  test('アクティブなナビリンクが aria-current を持つ', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const activeLink = sidebarNav(page).locator('a[aria-current="page"]');
    await expect(activeLink).toHaveCount(1);
    await expect(activeLink).toHaveAttribute('aria-label', 'シナリオ');
  });

  test('折りたたみトグルでサイドバーの状態が切り替わる', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const aside = sidebar(page);
    await expect(aside).toHaveAttribute('data-collapsed', 'auto');
    await aside.getByRole('button', { name: 'サイドバーを開閉' }).click();
    await expect(aside).toHaveAttribute('data-collapsed', /true|false/);
  });
});

test.describe('グローバルナビゲーション（モバイル: トップバー）', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile only');
  });

  test('トップバーロゴがリンクとして存在する', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    const logo = page
      .locator('header')
      .getByRole('link', { name: 'シナプレ管理くん' });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/home');
  });

  test('未認証時にログインボタンが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('header').getByRole('button', { name: 'ログイン' }),
    ).toBeVisible();
  });
});
