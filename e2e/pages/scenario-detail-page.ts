import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * シナリオ詳細ページのPage Object
 */
export class ScenarioDetailPage extends BasePage {
  // ヘッダー
  readonly title: Locator;
  readonly backLink: Locator;

  // ScenarioInfo（article内にスコープ）
  readonly article: Locator;
  readonly playerCount: Locator;
  readonly playTime: Locator;

  // セクション見出し
  readonly sessionHeading: Locator;
  readonly videoHeading: Locator;
  readonly reviewHeading: Locator;

  constructor(page: Page) {
    super(page);

    // ヘッダー
    // ScenarioInfo内のh1（メインタイトル、article内）
    this.title = page.locator('article h1');
    this.backLink = page.getByRole('link', { name: '戻る' });

    // ScenarioInfo（article内にスコープし、ページ内の他テキストとの誤マッチを防止）
    this.article = page.locator('article');
    this.playerCount = this.article.getByText(/\d+人/);
    this.playTime = this.article.getByText(/\d+.*(?:時間|分)/);

    // セクション見出し（h2ロールで特定）
    this.sessionHeading = page.getByRole('heading', {
      name: '関連セッション',
    });
    this.videoHeading = page.getByRole('heading', { name: 'プレイ動画' });
    this.reviewHeading = page.getByRole('heading', { name: /レビュー/ });
  }

  /** シナリオ詳細ページに直接遷移 */
  async goto(scenarioId: string) {
    await this.navigate(`/scenarios/${scenarioId}`);
  }
}
