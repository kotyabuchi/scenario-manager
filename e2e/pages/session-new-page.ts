import { expect } from '@playwright/test';

import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * セッション作成ページのPage Object
 */
export class SessionNewPage extends BasePage {
  readonly sessionNameInput: Locator;
  readonly sessionDescriptionTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.sessionNameInput = page.locator('#sessionName');
    this.sessionDescriptionTextarea = page.locator('#sessionDescription');
    this.submitButton = page.getByRole('button', { name: 'セッションを作成' });
  }

  async goto() {
    await this.navigate('/sessions/new');
  }

  /** 必須フィールドのみ入力する */
  async fillMinimum(name: string, description: string) {
    await this.sessionNameInput.fill(name);
    await this.sessionDescriptionTextarea.fill(description);
  }

  /** 詳細への遷移か入力エラーを待ち、作成画面の new をIDとして読まない。 */
  async submit() {
    await this.submitButton.click();
    await expect
      .poll(
        async () => {
          const pathname = new URL(this.page.url()).pathname;
          const hasNavigated = /^\/sessions\/[0-9A-HJKMNP-TV-Z]{26}$/.test(
            pathname,
          );
          if (hasNavigated) return true;
          return this.page
            .locator('form')
            .getByRole('alert')
            .first()
            .isVisible();
        },
        { message: '作成後の詳細画面かフォームの入力エラーが表示される' },
      )
      .toBe(true);
  }
}
