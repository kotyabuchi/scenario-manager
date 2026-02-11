import { expect, test } from '@playwright/test';

import { SessionsPage } from '../pages/sessions-page';

/**
 * セッション タブナビゲーションのE2Eテスト
 */
test.describe('セッション タブナビゲーション', () => {
  let sessionsPage: SessionsPage;

  test.beforeEach(async ({ page }) => {
    sessionsPage = new SessionsPage(page);
    await sessionsPage.goto();
  });

  test('「公開卓を探す」タブでURLにtab=publicが含まれる', async ({ page }) => {
    await sessionsPage.publicTabButton.click();
    await expect(page).toHaveURL(/tab=public/);
  });

  test('未認証時「参加予定」タブでLoginPromptが表示される', async () => {
    // disabled ボタンがクリックイベントを吸収するため URL直接遷移で検証
    await sessionsPage.gotoTab('upcoming');
    await expect(sessionsPage.loginPromptText).toBeVisible();
  });

  test('未認証時「参加履歴」タブでLoginPromptが表示される', async () => {
    await sessionsPage.gotoTab('history');
    await expect(sessionsPage.loginPromptText).toBeVisible();
  });

  test('URLパラメータ ?tab=public でタブが復元される', async ({ page }) => {
    await page.goto('/sessions?tab=public');
    await page.waitForLoadState('domcontentloaded');
    // 公開卓タブのコンテンツ（件数表示）が表示される
    await expect(sessionsPage.resultCount).toBeVisible();
  });
});
