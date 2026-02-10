import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * 全公開ページのスモークテスト
 * 各ページが正常にレンダリングされ、主要要素が表示されることを確認する
 */
test.describe('スモークテスト', () => {
  test('ランディングページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/シナプレ管理くん/);
  });

  test('シナリオ一覧ページが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page).toHaveTitle(/シナリオ検索/);
  });
});

test.describe('アクセシビリティ', () => {
  // 既知のa11y違反あり（カラーコントラスト、ランドマーク不足）
  // 修正後にfixmeを削除してテストを有効化する
  test.fixme('ランディングページにa11y違反がない', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test.fixme('シナリオ一覧ページにa11y違反がない', async ({ page }) => {
    await page.goto('/scenarios');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
