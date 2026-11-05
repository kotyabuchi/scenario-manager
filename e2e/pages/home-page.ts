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

    this.welcomeMessage = page.getByRole('heading', {
      level: 1,
      name: /^ようこそ、.+さん$/,
    });
    this.upcomingSessionsHeading = page.getByRole('heading', {
      name: '予定されているセッション',
    });
    this.newScenariosHeading = page.getByRole('heading', {
      name: '新着おすすめシナリオ',
    });
    this.viewAllSessionsLink = page.getByRole('link', {
      name: 'すべて見る',
    });
  }

  async goto() {
    await this.navigate('/home');
  }
}
