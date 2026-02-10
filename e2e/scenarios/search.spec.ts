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

  test('検索結果の件数が表示される', async () => {
    await expect(scenariosPage.resultCount).toBeVisible();
  });

  test('シナリオ名で検索できる', async ({ page }) => {
    await expect(scenariosPage.searchInput).toBeVisible();

    // シードデータに存在するキーワード（DB初期データに依存）
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

  test('ソートを変更するとURLに反映される', async ({ page }) => {
    await scenariosPage.selectSort('高評価順');
    await expect(page).toHaveURL(/sort=rating/);
  });

  test('もっと見るボタンで追加のシナリオが読み込まれる', async () => {
    // カードの初期表示を待つ
    await scenariosPage.scenarioCards.first().waitFor({ state: 'visible' });

    // 20件以下の場合はもっと見るボタンが存在しない
    const isVisible = await scenariosPage.loadMoreButton.isVisible();
    if (!isVisible) return;

    const initialCount = await scenariosPage.getCardCount();
    await scenariosPage.loadMoreButton.click();

    // APIレスポンス後にカード数が増えることを確認
    await expect(scenariosPage.scenarioCards).not.toHaveCount(initialCount);
  });
});

test.describe('URLパラメータの復元', () => {
  test('ソートパラメータが復元される', async ({ page }) => {
    const scenariosPage = new ScenariosPage(page);
    await page.goto('/scenarios?sort=rating');
    await expect(scenariosPage.sortTrigger).toContainText('高評価順');
  });

  test('検索キーワードが復元される', async ({ page }) => {
    const scenariosPage = new ScenariosPage(page);
    await page.goto('/scenarios?q=テスト');
    await expect(scenariosPage.searchInput).toHaveValue('テスト');
  });
});
