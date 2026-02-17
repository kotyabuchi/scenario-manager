import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * フィードバック一覧ページのPage Object
 */
export class FeedbackPage extends BasePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly newPostButton: Locator;
  readonly categoryChips: Locator;
  readonly feedbackCards: Locator;
  readonly sortSelect: Locator;
  readonly loadMoreButton: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'フィードバック' });
    this.searchInput = page.getByPlaceholder('フィードバックを検索...');
    this.newPostButton = page.getByRole('button', { name: /新規投稿/ });
    this.categoryChips = page.locator('[class*="categoryChip"]');
    this.feedbackCards = page.locator('a[href^="/feedback/"]');
    this.sortSelect = page.getByLabel('並び替え');
    this.loadMoreButton = page.getByRole('button', { name: 'もっと見る' });
    this.resultCount = page.getByText(/\d+件のフィードバック/);
  }

  async goto() {
    await this.navigate('/feedback');
  }

  /** 最初のフィードバックカードの投票ボタンを取得 */
  getVoteButton(cardIndex = 0) {
    return this.feedbackCards
      .nth(cardIndex)
      .getByRole('button', { name: /投票/ });
  }

  /** 最初のフィードバックカードの投票数を取得 */
  getVoteCount(cardIndex = 0) {
    return this.feedbackCards.nth(cardIndex).locator('[aria-live="polite"]');
  }

  /** 最初のフィードバックカードをクリックして詳細に遷移 */
  async clickCard(index = 0) {
    await this.feedbackCards.nth(index).click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
