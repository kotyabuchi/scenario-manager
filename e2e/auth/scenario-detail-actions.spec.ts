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
    // メニュー項目が表示される
    await expect(page.getByText('セッション作成')).toBeVisible();
    await expect(page.getByText('プレイ済み登録')).toBeVisible();
    await expect(page.getByText('シェア')).toBeVisible();
  });

  test('FABメニュー外クリックでメニューが閉じる', async ({ page }) => {
    const fabButton = page.getByRole('button', { name: 'メニューを開く' });
    await fabButton.dispatchEvent('click');
    await expect(page.getByText('セッション作成')).toBeVisible();
    // メニュー外をクリック（FABから離れた場所）
    await page.locator('article').click({ position: { x: 10, y: 10 } });
    await expect(page.getByText('セッション作成')).not.toBeVisible();
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
