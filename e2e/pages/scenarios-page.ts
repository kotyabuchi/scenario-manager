import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/** シナリオ一覧の操作と、2ペイン時の一覧領域を表す。 */
export class ScenariosPage extends BasePage {
  readonly listPane: Locator;
  readonly detailPane: Locator;
  readonly filters: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly detailedFilterButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly scenarioCards: Locator;
  readonly emptyMessage: Locator;
  readonly resultCount: Locator;
  readonly sortTrigger: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);

    this.listPane = page.getByRole('region', { name: 'シナリオ一覧' });
    this.detailPane = page.getByRole('region', { name: 'シナリオ詳細' });
    this.filters = this.listPane.getByRole('region', {
      name: 'シナリオ検索フィルター',
    });
    this.searchInput = this.filters.getByRole('searchbox', {
      name: 'フリーワード検索',
    });
    this.searchButton = this.filters.getByRole('button', {
      name: 'この条件で検索',
    });
    this.detailedFilterButton = this.filters.getByRole('button', {
      name: /詳細フィルター/,
    });
    this.clearFiltersButton = this.filters.getByRole('button', {
      name: 'フィルターをクリア',
    });
    // ULIDの先頭は01。/scenarios/newなどの導線を除外する。
    this.scenarioCards = this.listPane.locator('a[href^="/scenarios/01"]');
    this.emptyMessage = this.listPane.getByText(
      '条件に一致するシナリオが見つかりませんでした',
    );
    this.resultCount = this.listPane.getByText(/検索結果：\d+件/);
    this.sortTrigger = this.listPane.locator(
      '[data-scope="select"][data-part="trigger"][aria-label="並び替え"]',
    );
    this.loadMoreButton = this.listPane.getByRole('button', {
      name: 'もっと見る',
    });
  }

  async goto(query = '') {
    await this.navigate(`/scenarios${query}`);
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
  }

  async clickScenarioCard(index = 0) {
    await this.scenarioCards.nth(index).click();
  }

  async getCardCount(): Promise<number> {
    return this.scenarioCards.count();
  }

  async selectSort(label: string) {
    await this.sortTrigger.click();
    await this.page
      .locator('[data-scope="select"][data-part="item"]')
      .filter({ hasText: label })
      .click();
  }
}
