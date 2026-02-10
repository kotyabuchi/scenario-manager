import { expect, test } from '@playwright/test';

import { ScenariosPage } from '../pages/scenarios-page';

/**
 * フィルター機能のE2Eテスト
 * PC: サイドバーフィルター
 * SP: フィルターボトムシート
 */
test.describe('PC: サイドバーフィルター', () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop only');
    scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
  });

  test('サイドバーが表示される', async () => {
    await expect(scenariosPage.sidebar).toBeVisible();
  });

  test('サイドバーを折りたたむことができる', async () => {
    // aside内に限定し、FilterBottomSheetのオーバーレイ（同じaria-label）と区別
    const closeButton = scenariosPage.sidebar.locator(
      'button[aria-label="フィルターを閉じる"]',
    );
    // 初期状態: 展開（「閉じる」ボタンが見える）
    await expect(closeButton).toBeVisible();

    // クリックして折りたたむ
    await closeButton.click();

    // 折りたたみ後: 「展開」ボタンが見える
    const expandButton = scenariosPage.sidebar.locator(
      'button[aria-label="フィルターを展開"]',
    );
    await expect(expandButton).toBeVisible();

    // 再展開
    await expandButton.click();
    await expect(closeButton).toBeVisible();
  });

  test('サイドバーに検索ボタンがある', async () => {
    await expect(scenariosPage.sidebarSearchButton).toBeVisible();
  });
});

test.describe('SP: フィルターボトムシート', () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile only');
    scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
  });

  test('フィルターボタンが表示される', async () => {
    await expect(scenariosPage.mobileFilterButton).toBeVisible();
  });

  test('フィルターボタンをタップするとボトムシートが開く', async () => {
    await scenariosPage.openMobileFilter();
    await expect(scenariosPage.filterDialog).toBeVisible();
  });

  test('ボトムシートを閉じることができる', async () => {
    await scenariosPage.openMobileFilter();
    await scenariosPage.closeMobileFilter();
    // FilterBottomSheetはtransformで画面外に移動する方式のため、toBeInViewportで判定
    await expect(scenariosPage.filterDialogConfirm).not.toBeInViewport();
  });

  test('「この条件で検索」ボタンでフィルターを適用できる', async () => {
    await scenariosPage.openMobileFilter();
    await scenariosPage.confirmMobileFilter();
    // FilterBottomSheetはtransformで画面外に移動する方式のため、toBeInViewportで判定
    await expect(scenariosPage.filterDialogConfirm).not.toBeInViewport();
    // 結果が表示されている
    await expect(scenariosPage.resultCount).toBeVisible();
  });

  test('「条件をリセット」ボタンが存在する', async () => {
    await scenariosPage.openMobileFilter();
    await expect(scenariosPage.filterDialogReset).toBeVisible();
  });
});
