import { expect, test } from '@playwright/test';

/**
 * シナリオ新規登録フォーム - インポート誘導バナー E2Eテスト
 *
 * 配布URLフィールドにBOOTH/TALTO URLが入力されたとき、
 * インポートページへの誘導バナーが表示されることを検証する。
 */
test.describe('シナリオ新規登録 - インポート誘導バナー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scenarios/new');
    await page.waitForLoadState('domcontentloaded');
  });

  test('BOOTH URLを入力するとインポート誘導バナーが表示される', async ({
    page,
  }) => {
    const urlInput = page.locator('#distributeUrl');
    await urlInput.fill('https://booth.pm/ja/items/12345');

    // デバウンス300ms + レンダリング余裕
    const banner = page.getByRole('note');
    await expect(banner).toBeVisible({ timeout: 5_000 });
    await expect(banner).toContainText('インポートから登録してください');
  });

  test('TALTO URLを入力するとインポート誘導バナーが表示される', async ({
    page,
  }) => {
    const urlInput = page.locator('#distributeUrl');
    await urlInput.fill('https://talto.cc/projects/abc123');

    const banner = page.getByRole('note');
    await expect(banner).toBeVisible({ timeout: 5_000 });
  });

  test('非対応URLを入力してもバナーは表示されない', async ({ page }) => {
    const urlInput = page.locator('#distributeUrl');
    await urlInput.fill('https://example.com/some-page');

    // デバウンス完了を待ってからチェック
    await page.waitForTimeout(500);

    const banner = page.getByRole('note');
    await expect(banner).not.toBeVisible();
  });

  test('空の状態ではバナーは表示されない', async ({ page }) => {
    const banner = page.getByRole('note');
    await expect(banner).not.toBeVisible();
  });

  test('バナーの「インポートへ移動」リンクが正しいURLに遷移する', async ({
    page,
  }) => {
    const boothUrl = 'https://booth.pm/ja/items/12345';
    const urlInput = page.locator('#distributeUrl');
    await urlInput.fill(boothUrl);

    const banner = page.getByRole('note');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    const importLink = banner.getByRole('link', { name: 'インポートへ移動' });
    await expect(importLink).toBeVisible();
    await importLink.click();

    await expect(page).toHaveURL(
      `/scenarios/import?url=${encodeURIComponent(boothUrl)}`,
    );
  });

  test('BOOTH URLを入力後に削除するとバナーが消える', async ({ page }) => {
    const urlInput = page.locator('#distributeUrl');
    await urlInput.fill('https://booth.pm/ja/items/12345');

    const banner = page.getByRole('note');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    // URLをクリアする
    await urlInput.clear();

    // デバウンス完了を待つ
    await page.waitForTimeout(500);
    await expect(banner).not.toBeVisible();
  });
});
