import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * プロフィール設定ページのPage Object
 */
export class ProfilePage extends BasePage {
  readonly userNameInput: Locator;
  readonly nicknameInput: Locator;
  readonly bioTextarea: Locator;
  readonly publicProfileLink: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.userNameInput = page.locator('#userName');
    this.nicknameInput = page.locator('#nickname');
    this.bioTextarea = page.locator('#bio');
    this.publicProfileLink = page.getByRole('link', {
      name: '公開プロフィールを見る',
    });
    this.submitButton = page.getByRole('button', { name: '更新する' });
  }

  async goto() {
    await this.navigate('/profile');
  }
}
