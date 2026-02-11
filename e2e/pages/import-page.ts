import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * インポートページのPage Object
 */
export class ImportPage extends BasePage {
  // Step 1: URL入力
  readonly urlInput: Locator;
  readonly submitButton: Locator;
  readonly manualInputLink: Locator;
  readonly supportedSitesText: Locator;

  // エラー表示
  readonly urlError: Locator;

  // Step 2: フォーム
  readonly sourceBanner: Locator;
  readonly nameInput: Locator;
  readonly authorInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly backButton: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1: URL入力ステップ
    this.urlInput = page.locator('#url');
    this.submitButton = page.getByRole('button', { name: '取り込む' });
    this.manualInputLink = page.getByRole('link', { name: /手動で入力/ });
    this.supportedSitesText = page.getByText('対応サイト: Booth, TALTO');

    // エラー表示（Server Action からのバリデーションエラー）
    this.urlError = page.locator('#url ~ [role="alert"]');

    // Step 2: フォームステップ
    this.sourceBanner = page.getByText(/インポート元:/);
    this.nameInput = page.locator('#name');
    this.authorInput = page.locator('#author');
    this.descriptionTextarea = page.locator('#description');
    this.backButton = page.getByRole('button', { name: '戻る' });
    this.registerButton = page.getByRole('button', { name: '登録する' });
  }

  /** インポートページに遷移 */
  async goto() {
    await this.navigate('/scenarios/import');
  }

  /** URLを入力して送信 */
  async submitUrl(url: string) {
    await this.urlInput.fill(url);
    await this.submitButton.click();
  }

  /** フォームステップ（Step 2）の表示を待機（外部サービスの応答を含むため長めのタイムアウト） */
  async waitForFormStep() {
    await this.sourceBanner.waitFor({ state: 'visible', timeout: 30_000 });
  }
}
