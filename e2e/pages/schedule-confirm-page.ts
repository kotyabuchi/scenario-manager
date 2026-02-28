import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * 日程確定ページのPage Object
 */
export class ScheduleConfirmPage extends BasePage {
  readonly pageTitle: Locator;
  readonly calendarTitle: Locator;
  readonly emptyConfirmedMessage: Locator;
  readonly emptyRecommendationMessage: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: '日程を確定する' });
    this.calendarTitle = page.getByText('日程確定カレンダー');
    this.emptyConfirmedMessage = page.getByText(
      'おすすめ一覧から候補を選択してください。',
    );
    this.emptyRecommendationMessage = page.getByText(
      'スケジュールが不足しています',
    );
    this.confirmButton = page.getByRole('button', { name: /日程を確定/ });
  }

  /** 日程確定ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}/schedule/confirm`);
  }
}
