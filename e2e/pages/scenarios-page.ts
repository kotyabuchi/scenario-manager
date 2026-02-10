import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * シナリオ一覧ページのPage Object
 */
export class ScenariosPage extends BasePage {
  // 検索
  readonly searchInput: Locator;
  readonly scenarioCards: Locator;
  readonly emptyMessage: Locator;

  // 結果ヘッダー
  readonly resultCount: Locator;
  readonly sortTrigger: Locator;
  readonly loadMoreButton: Locator;

  // PC: サイドバー
  readonly sidebar: Locator;
  readonly sidebarSearchButton: Locator;

  // SP: フィルター
  readonly mobileFilterButton: Locator;
  readonly filterDialog: Locator;
  readonly filterDialogConfirm: Locator;
  readonly filterDialogReset: Locator;
  readonly filterDialogClose: Locator;

  constructor(page: Page) {
    super(page);

    // 検索
    // PC版とSP版で同じplaceholderの入力が2つあるため、可視の要素のみ対象
    this.searchInput = page.locator(
      'input[placeholder="シナリオを検索..."]:visible',
    );
    // ULID形式のIDは01で始まるため、/scenarios/new等を除外できる
    this.scenarioCards = page.locator('a[href^="/scenarios/0"]');
    this.emptyMessage = page.getByText(
      '条件に一致するシナリオが見つかりませんでした',
    );

    // 結果ヘッダー
    this.resultCount = page.getByText(/検索結果：\d+件/);
    // ソートのArkUI Selectトリガー（結果エリア[aria-busy]内に限定し、システム選択と区別）
    const resultsArea = page.locator('[aria-busy]');
    this.sortTrigger = resultsArea.locator(
      '[data-scope="select"][data-part="trigger"]',
    );
    this.loadMoreButton = page.getByRole('button', { name: 'もっと見る' });

    // PC: サイドバー
    this.sidebar = page.locator('aside');
    this.sidebarSearchButton = page
      .locator('aside')
      .getByRole('button', { name: '検索' });

    // SP: フィルター
    // aria-label 付きのサイドバートグル（"フィルターを展開" 等）と区別するため正規表現で限定
    this.mobileFilterButton = page.getByRole('button', {
      name: /^フィルター\s*\d*$/,
    });
    this.filterDialog = page.locator(
      '[role="dialog"][aria-label="フィルター"]',
    );
    this.filterDialogConfirm = this.filterDialog.getByRole('button', {
      name: 'この条件で検索',
    });
    this.filterDialogReset = this.filterDialog.getByRole('button', {
      name: '条件をリセット',
    });
    this.filterDialogClose = this.filterDialog.locator(
      'button[aria-label="閉じる"]',
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

  /** ソートオプションを選択（ArkUI Select経由） */
  async selectSort(label: string) {
    await this.sortTrigger.click();
    await this.page
      .locator('[data-scope="select"][data-part="item"]')
      .filter({ hasText: label })
      .click();
  }

  /** SP: フィルターダイアログを開く */
  async openMobileFilter() {
    await this.mobileFilterButton.click();
    await this.filterDialog.waitFor({ state: 'visible' });
  }

  /** SP: フィルターを確定して閉じる */
  async confirmMobileFilter() {
    await this.filterDialogConfirm.click();
  }

  /** SP: フィルターダイアログを閉じる */
  async closeMobileFilter() {
    await this.filterDialogClose.click();
  }
}
