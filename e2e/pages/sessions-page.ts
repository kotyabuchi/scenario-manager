import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * セッション一覧ページのPage Object
 */
export class SessionsPage extends BasePage {
  // タブ
  readonly publicTabButton: Locator;
  readonly upcomingTabButton: Locator;
  readonly historyTabButton: Locator;

  // 公開卓タブのコンテンツ
  readonly sessionCards: Locator;
  readonly resultCount: Locator;
  readonly sortTrigger: Locator;

  // LoginPrompt
  readonly loginPromptText: Locator;

  constructor(page: Page) {
    super(page);

    // タブボタン
    this.publicTabButton = page.getByRole('button', { name: '公開卓を探す' });
    this.upcomingTabButton = page.getByRole('button', { name: '参加予定' });
    this.historyTabButton = page.getByRole('button', { name: '参加履歴' });

    // 公開卓タブのコンテンツ
    // ULID形式のIDは01で始まるため、/sessions/new等を除外できる
    this.sessionCards = page.locator('a[href^="/sessions/0"]');
    this.resultCount = page.getByText(/\d+件のセッションが見つかりました/);
    // ソートのArkUI Select（「並び替え」ラベルの隣にあるSelectに限定し、フィルタ用Selectと区別）
    const sortArea = page.getByText('並び替え').locator('..');
    this.sortTrigger = sortArea.locator(
      '[data-scope="select"][data-part="trigger"]',
    );

    // LoginPrompt
    this.loginPromptText = page.getByText(/ログインが必要です/);
  }

  /** セッション一覧ページに遷移 */
  async goto() {
    await this.navigate('/sessions');
  }

  /** 指定タブに遷移 */
  async gotoTab(tab: 'public' | 'upcoming' | 'history') {
    await this.navigate(`/sessions?tab=${tab}`);
  }

  /** ソートオプションを選択（ArkUI Select経由） */
  async selectSort(label: string) {
    await this.sortTrigger.click();
    await this.page
      .locator('[data-scope="select"][data-part="item"]')
      .filter({ hasText: label })
      .click();
  }
}
