import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * 申請管理ページのPage Object
 *
 * ステータス絞り込みはタブから Select（ArkUI）へリデザイン済み。
 */
export class ApplicationsPage extends BasePage {
  /** ステータスフィルターの Select トリガー */
  readonly filterTrigger: Locator;

  constructor(page: Page) {
    super(page);
    this.filterTrigger = page.getByRole('combobox', {
      name: 'ステータスでフィルター',
    });
  }

  /** 申請管理ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}/applications`);
  }

  /** フィルター Select を開く */
  async openFilter() {
    await this.filterTrigger.click();
  }

  /** ラベルからフィルターの選択肢ロケータを取得 */
  filterOption(label: string): Locator {
    return this.page
      .locator('[data-scope="select"][data-part="item"]')
      .filter({ hasText: label });
  }

  /** フィルターを選択（trigger を開いて option をクリック） */
  async selectFilter(label: string) {
    await this.filterTrigger.click();
    await this.filterOption(label).click();
  }
}
