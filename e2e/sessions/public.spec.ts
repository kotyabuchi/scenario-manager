import { expect, test } from '@playwright/test';

import { SessionsPage } from '../pages/sessions-page';

/**
 * セッション公開卓のE2Eテスト
 */
test.describe('セッション公開卓', () => {
  let sessionsPage: SessionsPage;

  test.beforeEach(async ({ page }) => {
    sessionsPage = new SessionsPage(page);
    await sessionsPage.goto();
  });

  test('セッション一覧ページが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/セッション/);
  });

  test('デフォルトで「公開卓を探す」タブがアクティブ', async () => {
    // 公開卓タブのコンテンツ（件数表示）がデフォルトで表示される
    await expect(sessionsPage.resultCount).toBeVisible();
    // 公開卓タブボタンが表示されている
    await expect(sessionsPage.publicTabButton).toBeVisible();
  });

  test('セッションカードまたは空メッセージが表示される', async ({ page }) => {
    // 件数表示を待ってからカードの有無を確認
    await expect(sessionsPage.resultCount).toBeVisible();
    const countText = await sessionsPage.resultCount.textContent();
    const isZero = countText?.startsWith('0件');

    if (isZero) {
      await expect(
        page.getByText('条件に一致するセッションが見つかりませんでした'),
      ).toBeVisible();
    } else {
      await expect(sessionsPage.sessionCards.first()).toBeVisible();
    }
  });

  test('検索結果の件数が表示される', async () => {
    await expect(sessionsPage.resultCount).toBeVisible();
  });

  test('ソートを変更するとURLに反映される', async ({ page }) => {
    await sessionsPage.selectSort('新着順');
    await expect(page).toHaveURL(/publicSort=created_desc/);
  });
});
