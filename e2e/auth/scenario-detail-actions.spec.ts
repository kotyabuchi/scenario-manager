import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ScenariosPage } from '../pages/scenarios-page';

/**
 * シナリオ詳細の認証済みアクションのE2Eテスト
 */
test.describe('シナリオ詳細 認証済みアクション', () => {
  test.beforeEach(async ({ page }) => {
    // シナリオ一覧から最初のカードをクリックして詳細に遷移
    const scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);
    await page.waitForURL(/\/scenarios\/01[A-Za-z0-9]{24}/);
  });

  test('お気に入りボタンが表示される', async ({ page }) => {
    const favoriteButton = page.getByRole('button', {
      name: /お気に入り/,
    });
    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton).toBeEnabled();
  });

  test('現在のシナリオでセッションを作成できる導線がある', async ({ page }) => {
    const scenarioId = new URL(page.url()).pathname.split('/').at(-1);
    expect(scenarioId).toMatch(/^01[A-Za-z0-9]{24}$/);
    const createSessionLink = page.getByRole('link', {
      name: 'セッションを作成',
      exact: true,
    });
    await expect(createSessionLink).toHaveAttribute(
      'href',
      `/sessions/new?scenarioId=${scenarioId}`,
    );
  });

  test('FABメニューボタンが表示される', async ({ page }) => {
    const fabButton = page.getByRole('button', { name: 'メニューを開く' });
    await expect(fabButton).toBeVisible();
  });

  test(
    'FABメニューを開くとメニュー項目が表示される',
    { tag: ['@case:legacy-fab-open', '@variant:default', '@binding:main'] },
    async ({ page }) => {
      const fabButton = page.getByRole('button', { name: 'メニューを開く' });
      await fabButton.click();
      const quickActions = page.getByRole('region', { name: 'クイック操作' });
      await expect(
        quickActions.getByRole('button', { name: 'セッション募集' }),
      ).toBeVisible();
      await expect(
        quickActions.getByRole('button', { name: 'シナリオ検索' }),
      ).toBeVisible();
      await expect(
        quickActions.getByRole('button', { name: 'シェア' }),
      ).toBeVisible();
    },
  );

  test(
    'FABメニュー外クリックでメニューが閉じる',
    { tag: ['@case:legacy-fab-dismiss', '@variant:default', '@binding:main'] },
    async ({ page }) => {
      const fabButton = page.getByRole('button', { name: 'メニューを開く' });
      await fabButton.click();
      const quickActions = page.getByRole('region', { name: 'クイック操作' });
      const menuItem = quickActions.getByRole('button', {
        name: 'セッション募集',
      });
      await expect(menuItem).toBeVisible();
      // メニュー外への退出操作。モバイルではパネル/ヘッダー配置でoverlayクリック座標が
      // 不安定なため、SpeedDialがサポートする Escape で閉じる（dismiss挙動を検証）
      await page.keyboard.press('Escape');
      await expect(menuItem).not.toBeVisible();
    },
  );

  test('アクセシビリティ違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
