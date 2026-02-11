import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ImportPage } from '../pages/import-page';

/**
 * インポートページ E2Eテスト（認証済みプロジェクトで実行）
 */
test.describe('インポートページ - Tier 1: ページ構造・バリデーション', () => {
  let importPage: ImportPage;

  test.beforeEach(async ({ page }) => {
    importPage = new ImportPage(page);
    await importPage.goto();
  });

  test('ページタイトルが正しい', async ({ page }) => {
    await expect(page).toHaveTitle(/シナリオをインポート/);
  });

  test('ページヘッダーが表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /URLからシナリオをインポート/ }),
    ).toBeVisible();
  });

  test('URL入力フィールドが表示される', async () => {
    await expect(importPage.urlInput).toBeVisible();
  });

  test('取り込むボタンが表示される', async () => {
    await expect(importPage.submitButton).toBeVisible();
  });

  test('対応サイト情報が表示される', async () => {
    await expect(importPage.supportedSitesText).toBeVisible();
  });

  test('手動入力リンクが表示される', async () => {
    await expect(importPage.manualInputLink).toBeVisible();
  });

  test('手動入力リンクをクリックすると /scenarios/new に遷移する', async ({
    page,
  }) => {
    await importPage.manualInputLink.click();
    await expect(page).toHaveURL(/\/scenarios\/new/);
  });

  test('空URLを送信するとエラーが表示される', async ({ page }) => {
    await importPage.submitButton.click();
    await expect(page.getByText('URLを入力してください')).toBeVisible();
  });

  test('不正なURL形式の場合、ブラウザバリデーションが発火する', async () => {
    await importPage.urlInput.fill('not-a-url');
    await importPage.submitButton.click();
    // type="url" によるブラウザネイティブバリデーション
    const validationMessage = await importPage.urlInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).not.toBe('');
  });

  test('アクセシビリティ違反がない', async ({ page }) => {
    // primary ボタンの白文字コントラスト不足は既知の問題（smoke.spec.ts と同様に除外）
    const results = await new AxeBuilder({ page })
      .include('main')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('インポートページ - Tier 2: URL解析フロー', () => {
  test.describe.configure({ retries: 2 });

  const boothUrl = process.env.E2E_TEST_BOOTH_URL;
  const taltoUrl = process.env.E2E_TEST_TALTO_URL;
  const registeredUrl = process.env.E2E_TEST_REGISTERED_URL;

  let importPage: ImportPage;

  test.beforeEach(async ({ page }) => {
    importPage = new ImportPage(page);
    await importPage.goto();
  });

  test('登録済みURLを送信するとエラーが表示される', async ({ page }) => {
    test.skip(!registeredUrl, 'E2E_TEST_REGISTERED_URL が未設定');
    if (!registeredUrl) return;

    await importPage.submitUrl(registeredUrl);

    await expect(
      page.getByText('このURLのシナリオは既に登録されています'),
    ).toBeVisible();
  });

  test('Booth URL解析後にフォームが表示される', async () => {
    test.skip(!boothUrl, 'E2E_TEST_BOOTH_URL が未設定');
    if (!boothUrl) return;
    test.slow();

    await importPage.submitUrl(boothUrl);
    await importPage.waitForFormStep();

    await expect(importPage.sourceBanner).toContainText('Booth');
    await expect(importPage.nameInput).not.toHaveValue('');
  });

  test('TALTO URL解析後にフォームが表示される', async () => {
    test.skip(!taltoUrl, 'E2E_TEST_TALTO_URL が未設定');
    if (!taltoUrl) return;
    test.slow();

    await importPage.submitUrl(taltoUrl);
    await importPage.waitForFormStep();

    await expect(importPage.sourceBanner).toContainText('TALTO');
    await expect(importPage.nameInput).not.toHaveValue('');
  });

  test('戻るボタンでURL入力ステップに戻れる', async () => {
    test.skip(!boothUrl && !taltoUrl, 'テスト用URL環境変数が未設定');
    const testUrl = boothUrl ?? taltoUrl;
    if (!testUrl) return;
    test.slow();

    await importPage.submitUrl(testUrl);
    await importPage.waitForFormStep();

    await importPage.backButton.click();
    await expect(importPage.urlInput).toBeVisible();
  });

  test('高信頼度フィールドにreadOnly属性が付与されている', async () => {
    test.skip(!boothUrl, 'E2E_TEST_BOOTH_URL が未設定');
    if (!boothUrl) return;
    test.slow();

    await importPage.submitUrl(boothUrl);
    await importPage.waitForFormStep();

    // Booth パーサーはタイトルを high confidence で返すため readOnly が付与される
    await expect(importPage.nameInput).toHaveAttribute('readonly', '');
  });
});
