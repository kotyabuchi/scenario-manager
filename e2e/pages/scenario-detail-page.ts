import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/** シナリオ詳細の共通表示。2ペインと単独ページの両方で使用する。 */
export class ScenarioDetailPage extends BasePage {
  readonly pane: Locator;
  readonly title: Locator;
  readonly closeControl: Locator;
  readonly backControl: Locator;
  readonly article: Locator;
  readonly playerCount: Locator;
  readonly playTime: Locator;
  readonly sessionHeading: Locator;
  readonly videoHeading: Locator;
  readonly reviewHeading: Locator;
  readonly toc: Locator;
  readonly tocTrigger: Locator;

  constructor(page: Page) {
    super(page);

    this.pane = page.getByRole('region', { name: 'シナリオ詳細' });
    this.title = this.pane.getByRole('heading', { level: 1 });
    this.closeControl = this.pane
      .getByRole('button', { name: '閉じる' })
      .or(this.pane.getByRole('link', { name: '閉じる' }));
    this.backControl = this.pane
      .getByRole('button', { name: 'シナリオ一覧に戻る' })
      .or(this.pane.getByRole('link', { name: 'シナリオ一覧に戻る' }));
    this.article = this.pane.locator('article');
    this.playerCount = this.article.getByText(/\d+人/);
    this.playTime = this.article.getByText(/\d+.*(?:時間|分)/);
    this.sessionHeading = this.pane.getByRole('heading', {
      name: /関連セッション/,
    });
    this.videoHeading = this.pane.getByRole('heading', { name: /プレイ動画/ });
    this.reviewHeading = this.pane.getByRole('heading', { name: /コメント/ });
    this.toc = page.getByRole('navigation', { name: '目次' });
    this.tocTrigger = page.getByRole('button', { name: '目次', exact: true });
  }

  async goto(scenarioId: string, query = '') {
    await this.navigate(`/scenarios/${scenarioId}${query}`);
  }
}
