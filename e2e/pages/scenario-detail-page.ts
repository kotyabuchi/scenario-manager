import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * シナリオ詳細ページのPage Object
 */
export class ScenarioDetailPage extends BasePage {
  readonly title: Locator;
  readonly playerCount: Locator;
  readonly playTime: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    // ScenarioInfo内のh1（メインタイトル、article内）
    this.title = page.locator('article h1');
    this.playerCount = page.getByText(/\d+人/);
    this.playTime = page.getByText(/時間|分/);
    this.backLink = page.getByRole('link', { name: 'シナリオ一覧に戻る' });
  }

  /** シナリオ詳細ページに直接遷移 */
  async goto(scenarioId: string) {
    await this.navigate(`/scenarios/${scenarioId}`);
  }
}
