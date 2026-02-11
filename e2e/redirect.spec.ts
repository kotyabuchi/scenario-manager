import { expect, test } from '@playwright/test';

/**
 * 未認証ユーザーの認証リダイレクトテスト
 * 認証なしプロジェクト（chromium / mobile-chrome）で実行
 */
test.describe('認証リダイレクト', () => {
  test('未認証ユーザーは /profile からトップにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/profile');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('未認証ユーザーは /scenarios/new からトップにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/scenarios/new');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('未認証ユーザーは /sessions/new からトップにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/sessions/new');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});
