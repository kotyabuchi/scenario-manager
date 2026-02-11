import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * ホームダッシュボードのPage Object
 */
export class HomePage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly upcomingSessionsHeading: Locator;
  readonly newScenariosHeading: Locator;
  readonly viewAllSessionsLink: Locator;

  constructor(page: Page) {
    super(page);

    this.welcomeMessage = page.getByText(/ようこそ/);
    this.upcomingSessionsHeading = page.getByRole('heading', {
      name: '参加予定のセッション',
    });
    this.newScenariosHeading = page.getByRole('heading', {
      name: '新着シナリオ',
    });
    this.viewAllSessionsLink = page.getByRole('link', {
      name: 'すべて見る',
    });
  }

  async goto() {
    await this.navigate('/home');
  }
}
