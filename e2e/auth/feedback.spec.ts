import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { FeedbackPage } from '../pages/feedback-page';

/**
 * フィードバック一覧ページのE2Eテスト（認証必須）
 */
test.describe('フィードバック一覧', () => {
  let feedbackPage: FeedbackPage;

  test.beforeEach(async ({ page }) => {
    feedbackPage = new FeedbackPage(page);
    await feedbackPage.goto();
  });

  test('ページヘッダーが表示される', async () => {
    await expect(feedbackPage.heading).toBeVisible();
  });

  test('検索入力が表示される', async () => {
    await expect(feedbackPage.searchInput).toBeVisible();
  });

  test('新規投稿ボタンが表示される', async () => {
    await expect(feedbackPage.newPostButton).toBeVisible();
  });

  test('フィードバック件数が表示される', async () => {
    await expect(feedbackPage.resultCount).toBeVisible();
  });

  test('フィードバックカードが表示される', async () => {
    // データがある場合のみ
    const count = await feedbackPage.feedbackCards.count();
    if (count > 0) {
      await expect(feedbackPage.feedbackCards.first()).toBeVisible();
    }
  });

  test('カードをクリックすると詳細ページに遷移する', async ({ page }) => {
    const count = await feedbackPage.feedbackCards.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await feedbackPage.clickCard(0);
    await expect(page).toHaveURL(/\/feedback\/.+/);
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
