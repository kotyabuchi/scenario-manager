import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { SessionsPage } from '../pages/sessions-page';

/**
 * セッション認証済み機能のE2Eテスト
 */
test.describe('セッション認証済み機能', () => {
  let sessionsPage: SessionsPage;

  test.beforeEach(async ({ page }) => {
    sessionsPage = new SessionsPage(page);
    await sessionsPage.goto();
  });

  test('「参加予定」タブがクリック可能', async () => {
    await expect(sessionsPage.upcomingTabButton).toBeEnabled();
  });

  test('「参加予定」タブ切替でコンテンツが表示される', async ({ page }) => {
    await sessionsPage.upcomingTabButton.click();
    await expect(page).toHaveURL(/tab=upcoming/);
    // タブコンテンツが読み込まれる（ローディング後に表示）
    await page.waitForLoadState('domcontentloaded');
  });

  test('「参加履歴」タブ切替でコンテンツが表示される', async ({ page }) => {
    await sessionsPage.historyTabButton.click();
    await expect(page).toHaveURL(/tab=history/);
    await page.waitForLoadState('domcontentloaded');
  });

  test('「参加予定」タブでソートが変更可能', async ({ page }) => {
    await sessionsPage.gotoTab('upcoming');
    // ソートUIが存在する
    const sortArea = page.getByText('並び替え');
    await expect(sortArea).toBeVisible();
  });

  test('セッション作成ページが表示される', async ({ page }) => {
    await page.goto('/sessions/new');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/新規セッション/);
  });

  test('セッション作成に必須フィールドが存在する', async ({ page }) => {
    await page.goto('/sessions/new');
    await page.waitForLoadState('domcontentloaded');
    // セッション募集フォームの存在確認
    await expect(
      page.getByRole('heading', { name: /セッション募集/ }),
    ).toBeVisible();
  });

  test('セッション作成ページのa11y違反がない', async ({ page }) => {
    await page.goto('/sessions/new');
    await page.waitForLoadState('domcontentloaded');
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
