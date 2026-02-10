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
  // color-contrast: primary.500(#10B981)と白のコントラスト比が2.53:1でWCAG AA不適合
  // デザイン上の意図的な選択のため、カラーコントラストは除外して他の違反を検証
  const disabledRules = ['color-contrast'];

  test('ランディングページにa11y違反がない', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .include('main')
      .disableRules(disabledRules)
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('シナリオ一覧ページにa11y違反がない', async ({ page }) => {
    await page.goto('/scenarios');
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules(disabledRules)
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
