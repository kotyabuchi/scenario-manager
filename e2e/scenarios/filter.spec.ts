import { expect, test } from '@playwright/test';

import { ScenariosPage } from '../pages/scenarios-page';

/** PC/SP共通のインラインフィルターを実画面で確認する。 */
test.describe('シナリオの検索条件', () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }) => {
    scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
  });

  test('検索入力と確定ボタンを表示する', async () => {
    await expect(scenariosPage.searchInput).toBeVisible();
    await expect(scenariosPage.searchButton).toBeVisible();
  });

  test('詳細フィルターを開閉できる', async () => {
    await expect(scenariosPage.detailedFilterButton).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await scenariosPage.detailedFilterButton.click();
    await expect(scenariosPage.detailedFilterButton).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(
      scenariosPage.filters.getByText('システム', { exact: true }),
    ).toBeVisible();
    await expect(
      scenariosPage.filters.getByText('タグ', { exact: true }),
    ).toBeVisible();
    await scenariosPage.detailedFilterButton.click();
    await expect(scenariosPage.detailedFilterButton).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('入力したキーワードをクリアできる', async ({ page }) => {
    await scenariosPage.searchInput.fill('存在しないシナリオ_E2E_12345');
    await expect(scenariosPage.clearFiltersButton).toBeVisible();
    await scenariosPage.searchButton.click();
    await expect(page).toHaveURL(/q=/);

    await scenariosPage.clearFiltersButton.click();
    await expect(scenariosPage.searchInput).toHaveValue('');
    await scenariosPage.searchButton.click();
    await expect(page).not.toHaveURL(/q=/);
  });
});
