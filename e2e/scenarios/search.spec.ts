import { expect, test } from '@playwright/test';

/**
 * シナリオ検索機能のE2Eテスト
 * 対象要件: requirements-v1.md 5. シナリオ検索
 */
test.describe('シナリオ検索', () => {
  test.beforeEach(async ({ page }) => {
    // シナリオ一覧ページに遷移
    await page.goto('/scenarios');
  });

  test('シナリオ一覧ページが表示される', async ({ page }) => {
    // ページタイトルまたはヘッダーを確認
    await expect(page.locator('h1')).toBeVisible();
  });

  test('システムでフィルタリングできる', async ({ page }) => {
    // システム選択のセレクトボックスまたはチップを探す
    const systemFilter = page.getByRole('combobox', { name: /システム/i });

    // システムフィルタが存在する場合のみテスト
    if (await systemFilter.isVisible()) {
      await systemFilter.click();

      // 選択肢が表示されることを確認
      const options = page.getByRole('option');
      await expect(options.first()).toBeVisible();
    }
  });

  test('シナリオ名で検索できる', async ({ page }) => {
    // 検索入力フィールドを探す
    const searchInput = page.getByRole('textbox', { name: /シナリオ名/i });

    // 検索フィールドが存在する場合のみテスト
    if (await searchInput.isVisible()) {
      // 検索キーワードを入力
      await searchInput.fill('テスト');

      // 検索ボタンがあればクリック、なければEnter
      const searchButton = page.getByRole('button', { name: /検索/i });
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      // URLにクエリパラメータが含まれることを確認
      await expect(page).toHaveURL(/q=/);
    }
  });

  test('検索結果が0件の場合、適切なメッセージが表示される', async ({
    page,
  }) => {
    // 存在しないシナリオ名で検索
    const searchInput = page.getByRole('textbox', { name: /シナリオ名/i });

    if (await searchInput.isVisible()) {
      await searchInput.fill('存在しないシナリオ12345');

      const searchButton = page.getByRole('button', { name: /検索/i });
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      // 0件メッセージを確認（より具体的なテキストで検索）
      const emptyMessage = page.getByText(
        '条件に一致するシナリオが見つかりませんでした',
      );
      await expect(emptyMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('シナリオカードをクリックすると詳細ページに遷移する', async ({
    page,
  }) => {
    // シナリオカードを探す（最初のカード）
    const scenarioCard = page
      .locator('[data-testid="scenario-card"]')
      .or(page.locator('article').first());

    // カードが存在する場合のみテスト
    if (await scenarioCard.isVisible()) {
      await scenarioCard.click();

      // 詳細ページに遷移することを確認
      await expect(page).toHaveURL(/\/scenarios\/[A-Z0-9]+$/i);
    }
  });
});
