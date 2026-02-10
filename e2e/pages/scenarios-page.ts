import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * シナリオ一覧ページのPage Object
 */
export class ScenariosPage extends BasePage {
  readonly searchInput: Locator;
  readonly scenarioCards: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    super(page);
    // PC版とSP版で同じplaceholderの入力が2つあるため、可視の要素のみ対象
    this.searchInput = page.locator(
      'input[placeholder="シナリオを検索..."]:visible',
    );
    // ULID形式のIDは01で始まるため、/scenarios/new等を除外できる
    this.scenarioCards = page.locator('a[href^="/scenarios/0"]');
    this.emptyMessage = page.getByText(
      '条件に一致するシナリオが見つかりませんでした',
    );
  }

  /** シナリオ一覧ページに遷移 */
  async goto() {
    await this.navigate('/scenarios');
  }

  /** キーワードで検索を実行 */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
  }

  /** 指定インデックスのシナリオカードをクリック */
  async clickScenarioCard(index = 0) {
    await this.scenarioCards.nth(index).click();
  }

  /** シナリオカードの数を取得 */
  async getCardCount(): Promise<number> {
    return this.scenarioCards.count();
  }
}
