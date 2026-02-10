import { expect, test } from '@playwright/test';

import { ScenariosPage } from '../pages/scenarios-page';

/**
 * シナリオ検索機能のE2Eテスト
 * 対象要件: requirements-v1.md 5. シナリオ検索
 */
test.describe('シナリオ検索', () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }) => {
    scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
  });

  test('シナリオ一覧ページが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/シナリオ検索/);
  });

  test('シナリオカードが表示される', async () => {
    await expect(scenariosPage.scenarioCards.first()).toBeVisible();
  });

  test('シナリオ名で検索できる', async ({ page }) => {
    await expect(scenariosPage.searchInput).toBeVisible();

    const searchKeyword = '山';

    await scenariosPage.search(searchKeyword);
    await expect(page).toHaveURL(/q=/);
  });

  test('検索結果が0件の場合、空メッセージが表示される', async () => {
    await scenariosPage.search('存在しないシナリオ_E2E_12345');
    await expect(scenariosPage.emptyMessage).toBeVisible();
  });

  test('シナリオカードをクリックすると詳細ページに遷移する', async ({
    page,
  }) => {
    await scenariosPage.clickScenarioCard(0);
    await expect(page).toHaveURL(/\/scenarios\/[A-Za-z0-9]+$/);
  });
});
