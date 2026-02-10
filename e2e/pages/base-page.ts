import type { Page } from '@playwright/test';

/**
 * Page Objectの基底クラス
 */
export abstract class BasePage {
  constructor(readonly page: Page) {}

  /** ページのURLに遷移して読み込みを待つ */
  protected async navigate(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
