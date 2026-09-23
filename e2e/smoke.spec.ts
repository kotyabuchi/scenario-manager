import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ScenariosPage } from './pages/scenarios-page';

/**
 * 全公開ページのスモークテスト
 * 各ページが正常にレンダリングされ、主要要素が表示されることを確認する
 */
test.describe('スモークテスト', () => {
  test('ランディングページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/シナプレ管理くん/);
    await expect(page.locator('footer')).toHaveCount(0);
  });

  test('サービスについてのページに権利表記を表示する', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'サービスについて' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { name: '権利表記' })).toBeVisible();
    await expect(page.getByText(/© 2026.*シナプレ管理くん/)).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(0);
  });

  test('シナリオ一覧ページが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page).toHaveTitle(/シナリオ検索/);
  });
});

test.describe('アクセシビリティ', () => {
  // color-contrast: primary.500(#10B981)と白のコントラスト比が2.53:1でWCAG AA不適合
  // デザイン上の意図的な選択のため、カラーコントラストは除外して他の違反を検証
  const disabledRules = ['color-contrast'];

  const a11yScope = (page: import('@playwright/test').Page) =>
    new AxeBuilder({ page })
      .include('header')
      .include('main')
      .disableRules(disabledRules);

  test('ランディングページにa11y違反がない', async ({ page }) => {
    await page.goto('/');
    const results = await a11yScope(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('シナリオ一覧ページにa11y違反がない', async ({ page }) => {
    await page.goto('/scenarios');
    const results = await a11yScope(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('セッション一覧ページにa11y違反がない', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('domcontentloaded');
    const results = await a11yScope(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('シナリオ詳細ページにa11y違反がない', async ({ page }) => {
    // シナリオ一覧から最初のカードをクリックして詳細に遷移
    const scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);
    await page.waitForLoadState('domcontentloaded');
    const results = await a11yScope(page).analyze();
    expect(results.violations).toEqual([]);
  });
});
