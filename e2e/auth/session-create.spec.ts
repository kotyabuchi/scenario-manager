import { expect, test } from '@playwright/test';

import { cleanupE2ESessions, generateE2ESessionName } from '../helpers/cleanup';
import { SessionNewPage } from '../pages/session-new-page';

/**
 * セッション作成のE2Eテスト（認証必須・DB書き込みあり）
 */
test.describe('セッション作成', () => {
  let sessionNewPage: SessionNewPage;

  test.beforeEach(async ({ page }) => {
    sessionNewPage = new SessionNewPage(page);
    await sessionNewPage.goto();
  });

  test.afterAll(async () => {
    await cleanupE2ESessions();
  });

  test('セッション名が空で送信するとバリデーションエラー', async ({ page }) => {
    await sessionNewPage.sessionDescriptionTextarea.fill('テスト募集文');
    await sessionNewPage.submit();
    await expect(
      page.getByText('セッション名を入力してください'),
    ).toBeVisible();
  });

  test('募集文が空で送信するとバリデーションエラー', async ({ page }) => {
    await sessionNewPage.sessionNameInput.fill('テストセッション');
    await sessionNewPage.submit();
    await expect(page.getByText('募集文を入力してください')).toBeVisible();
  });

  test('最小入力で作成するとリダイレクトされる', async ({ page }) => {
    const name = generateE2ESessionName('作成テスト');
    await sessionNewPage.fillMinimum(name, 'E2Eテスト用の募集文です');
    await sessionNewPage.submit();
    await expect(page).toHaveURL(/\/sessions\//);
  });

  test('作成後にセッション詳細ページが表示される', async ({ page }) => {
    const name = generateE2ESessionName('詳細確認テスト');
    await sessionNewPage.fillMinimum(name, 'E2Eテスト用の募集文（詳細確認）');
    await sessionNewPage.submit();
    await expect(page).toHaveURL(/\/sessions\//);
    await expect(
      page.getByRole('heading', { name: /セッション詳細/ }),
    ).toBeVisible();
  });
});
