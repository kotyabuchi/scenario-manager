import { expect, test } from '@playwright/test';

import { ScenarioDetailPage } from '../pages/scenario-detail-page';
import { ScenariosPage } from '../pages/scenarios-page';

/**
 * シナリオ詳細ページのE2Eテスト
 */
test.describe('シナリオ詳細', () => {
  let scenariosPage: ScenariosPage;
  let detailPage: ScenarioDetailPage;

  test.beforeEach(async ({ page }) => {
    scenariosPage = new ScenariosPage(page);
    detailPage = new ScenarioDetailPage(page);
    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);
  });

  test('一覧からシナリオ詳細に遷移して情報が表示される', async ({ page }) => {
    await expect(page).toHaveURL(/\/scenarios\/[A-Za-z0-9]+(?:\?.*)?$/);
    await expect(detailPage.title).toBeVisible();
  });

  test('シナリオの基本情報が表示される', async () => {
    await expect(detailPage.title).not.toBeEmpty();
    await expect(detailPage.playerCount).toBeVisible();
  });

  test('プレイ時間が表示される', async () => {
    await expect(detailPage.playTime).toBeVisible();
  });

  test('閉じる・戻るで一覧に戻る', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile-chrome') {
      await detailPage.backControl.click();
    } else {
      await detailPage.closeControl.click();
    }
    await expect(page).toHaveURL(/\/scenarios(?:\?.*)?$/);
    await expect(scenariosPage.listPane).toBeVisible();
  });

  test('関連セッションセクションが表示される', async () => {
    await expect(detailPage.sessionHeading).toBeVisible();
  });

  test('プレイ動画セクションが表示される', async () => {
    await expect(detailPage.videoHeading).toBeVisible();
  });

  test('レビューセクションが表示される', async () => {
    await expect(detailPage.reviewHeading).toBeVisible();
  });

  test('目次は単独ページだけに表示する', async ({ page }, testInfo) => {
    const toc = page.getByRole('navigation', { name: '目次' });
    if (testInfo.project.name === 'mobile-chrome') {
      await expect(detailPage.tocTrigger).toBeVisible();
      await detailPage.tocTrigger.click();
      await expect(toc).toBeVisible();
    } else {
      await expect(toc).toHaveCount(0);
    }
  });
});
