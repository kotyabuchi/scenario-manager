import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * 申請管理ページのPage Object
 */
export class ApplicationsPage extends BasePage {
  // タブ
  readonly tabAll: Locator;
  readonly tabPending: Locator;
  readonly tabConfirmed: Locator;

  // タブパネル
  readonly tabPanel: Locator;

  constructor(page: Page) {
    super(page);

    // タブ
    this.tabAll = page.locator('#tab-all');
    this.tabPending = page.locator('#tab-pending');
    this.tabConfirmed = page.locator('#tab-confirmed');

    // タブパネル
    this.tabPanel = page.locator('#tabpanel-applications');
  }

  /** 申請管理ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}/applications`);
  }
}
