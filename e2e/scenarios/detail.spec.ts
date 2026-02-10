import { expect, test } from '@playwright/test';

import { ScenarioDetailPage } from '../pages/scenario-detail-page';
import { ScenariosPage } from '../pages/scenarios-page';

/**
 * シナリオ詳細ページのE2Eテスト
 */
test.describe('シナリオ詳細', () => {
  test('一覧からシナリオ詳細に遷移して情報が表示される', async ({ page }) => {
    const scenariosPage = new ScenariosPage(page);
    const detailPage = new ScenarioDetailPage(page);

    // 一覧ページから最初のカードをクリック
    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);

    // 詳細ページのURLパターンを確認
    await expect(page).toHaveURL(/\/scenarios\/[A-Za-z0-9]+$/);

    // タイトルが表示される
    await expect(detailPage.title).toBeVisible();
  });

  test('シナリオの基本情報が表示される', async ({ page }) => {
    const scenariosPage = new ScenariosPage(page);
    const detailPage = new ScenarioDetailPage(page);

    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);

    // タイトルと主要情報が表示される
    await expect(detailPage.title).not.toBeEmpty();
    await expect(detailPage.playerCount).toBeVisible();
  });
});
