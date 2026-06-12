import { expect, test } from '@playwright/test';

/**
 * 認証済みナビゲーションのE2Eテスト
 * デスクトップ: サイドバー下部のユーザーメニュー / モバイル: トップバーのアバター
 */
test.describe('認証済みナビゲーション（デスクトップ）', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-auth', 'Desktop only');
  });

  const sidebar = (page: import('@playwright/test').Page) =>
    page.locator('aside[aria-label="グローバルナビゲーション"]');

  test('サイドバーにユーザーメニューが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      sidebar(page).getByRole('button', { name: 'ユーザーメニュー' }),
    ).toBeVisible();
  });

  test('ユーザーメニューからマイページに遷移できる', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    await sidebar(page)
      .getByRole('button', { name: 'ユーザーメニュー' })
      .click();
    await page.getByRole('menuitem', { name: 'マイページ' }).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('ログインボタンの代わりにシナリオ登録CTAが表示される', async ({
    page,
  }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('domcontentloaded');
    // ログインボタンが存在しない
    await expect(
      sidebar(page).getByRole('button', { name: 'ログイン' }),
    ).toHaveCount(0);
    // シナリオ登録CTAが表示
    await expect(
      sidebar(page).getByRole('button', { name: 'シナリオを登録' }),
    ).toBeVisible();
  });
});

test.describe('認証済みナビゲーション（モバイル）', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome-auth', 'Mobile only');
  });

  test('トップバーにプロフィールアバターが表示される', async ({ page }) => {
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
      page.locator('header').getByRole('button', { name: 'ログイン' }),
    ).toHaveCount(0);
    // アバターが表示
    await expect(
      page.locator('header button[aria-label="プロフィール"]'),
    ).toBeVisible();
  });
});
