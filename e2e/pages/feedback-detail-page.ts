import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * フィードバック詳細ページのPage Object
 */
export class FeedbackDetailPage extends BasePage {
  readonly backButton: Locator;
  readonly heading: Locator;
  readonly categoryBadge: Locator;
  readonly statusBadge: Locator;
  readonly voteButton: Locator;
  readonly voteCount: Locator;
  readonly description: Locator;
  readonly commentSection: Locator;
  readonly commentInput: Locator;
  readonly commentSubmitButton: Locator;
  readonly commentList: Locator;

  constructor(page: Page) {
    super(page);

    this.backButton = page.getByRole('link', { name: '戻る' });
    this.heading = page.locator('h1').first();
    this.categoryBadge = page.locator('[class*="categoryBadge"]').first();
    this.statusBadge = page.locator('[class*="statusBadge"]').first();
    this.voteButton = page.getByRole('button', { name: /投票/ });
    this.voteCount = page
      .locator('[class*="voteSection"]')
      .locator('[aria-live="polite"]');
    this.description = page.locator('[class*="detailBody"]');
    this.commentSection = page
      .getByRole('region')
      .filter({ hasText: 'コメント' });
    this.commentInput = page.getByPlaceholder(/議論に参加/);
    this.commentSubmitButton = page.getByRole('button', {
      name: 'コメントする',
    });
    this.commentList = page.locator('[class*="commentList"]');
  }

  async goto(feedbackId: string) {
    await this.navigate(`/feedback/${feedbackId}`);
  }

  /** 投票ボタンのaria-pressed状態を取得 */
  async isVoted() {
    return (await this.voteButton.getAttribute('aria-pressed')) === 'true';
  }

  /** 投票数をnumberとして取得 */
  async getVoteCountValue() {
    const text = await this.voteCount.textContent();
    return Number.parseInt(text ?? '0', 10);
  }
}
