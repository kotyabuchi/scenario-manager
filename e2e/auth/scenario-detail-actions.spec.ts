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
    await page.waitForLoadState('domcontentloaded');
  });

  test('お気に入りボタンが表示される', async ({ page }) => {
    const favoriteButton = page.getByRole('button', {
      name: /お気に入り/,
    });
    await expect(favoriteButton).toBeVisible();
  });

  test('FABメニューボタンが表示される', async ({ page }) => {
    const fabButton = page.getByRole('button', { name: 'メニューを開く' });
    await expect(fabButton).toBeVisible();
  });

  test('FABメニューを開くとメニュー項目が表示される', async ({ page }) => {
    const fabButton = page.getByRole('button', { name: 'メニューを開く' });
    // FABは右下fixed要素で、開発時のagentationツールバーと重なるためdispatchEventを使用
    await fabButton.dispatchEvent('click');
    // メニュー項目が表示される（menuitemロールで限定）
    await expect(
      page.getByRole('menuitem', { name: 'セッション募集' }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'シナリオ検索' }),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'シェア' })).toBeVisible();
  });

  test('FABメニュー外クリックでメニューが閉じる', async ({ page }) => {
    const fabButton = page.getByRole('button', { name: 'メニューを開く' });
    await fabButton.dispatchEvent('click');
    const menuItem = page.getByRole('menuitem', { name: 'セッション募集' });
    await expect(menuItem).toBeVisible();
    // オーバーレイ（メニュー外）の左上隅をクリックして閉じる
    await page
      .getByTestId('speed-dial-overlay')
      .click({ position: { x: 5, y: 5 } });
    await expect(menuItem).not.toBeVisible();
  });

  test('アクセシビリティ違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
