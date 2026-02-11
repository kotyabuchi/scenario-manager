import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { HomePage } from '../pages/home-page';

/**
 * ホームダッシュボードのE2Eテスト（認証必須）
 */
test.describe('ホームダッシュボード', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('ページが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/ホーム/);
  });

  test('ウェルカムメッセージが表示される', async () => {
    await expect(homePage.welcomeMessage).toBeVisible();
  });

  test('「参加予定のセッション」セクションが表示される', async () => {
    await expect(homePage.upcomingSessionsHeading).toBeVisible();
  });

  test('「新着シナリオ」セクションが表示される', async () => {
    await expect(homePage.newScenariosHeading).toBeVisible();
  });

  test('「すべて見る」リンクがセッション一覧に遷移する', async () => {
    // 最初の「すべて見る」リンクはセッション一覧への遷移
    const link = homePage.viewAllSessionsLink.first();
    await expect(link).toHaveAttribute('href', /\/sessions\?tab=upcoming/);
  });

  test('アクセシビリティ違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
