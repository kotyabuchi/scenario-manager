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
    this.submitButton = page.getByRole('button', { name: '募集を投稿' });
  }

  async goto() {
    await this.navigate('/sessions/new');
  }

  /** 必須フィールドのみ入力する */
  async fillMinimum(name: string, description: string) {
    await this.sessionNameInput.fill(name);
    await this.sessionDescriptionTextarea.fill(description);
  }

  async submit() {
    await this.submitButton.click();
  }
}
