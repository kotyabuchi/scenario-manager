import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * スケジュール提出ページのPage Object
 */
export class AvailabilityPage extends BasePage {
  // ページヘッダー
  readonly pageTitle: Locator;

  // スケジュール入力
  readonly startInput: Locator;
  readonly endInput: Locator;
  readonly addButton: Locator;
  readonly editorErrorAlert: Locator;

  // 保存
  readonly saveButton: Locator;
  readonly successMessage: Locator;

  // 状態表示
  readonly emptyScheduleMessage: Locator;
  readonly scheduleCountText: Locator;

  constructor(page: Page) {
    super(page);

    // ページヘッダー
    this.pageTitle = page.getByRole('heading', {
      level: 1,
      name: 'スケジュールを提出',
    });

    // スケジュール入力
    this.startInput = page.getByLabel('開始');
    this.endInput = page.getByLabel('終了');
    this.addButton = page.getByRole('button', { name: '追加' });
    this.editorErrorAlert = page.getByRole('alert');

    // 保存
    this.saveButton = page.getByRole('button', { name: /提出を保存/ });
    this.successMessage = page.getByText('スケジュールを保存しました。');

    // 状態表示
    this.emptyScheduleMessage = page.getByText('まだスケジュールがありません');
    this.scheduleCountText = page.getByText(/\d+件/);
  }

  /** スケジュール提出ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}/availability`);
  }

  /** 時間ブロックを追加する */
  async addTimeBlock(start: string, end: string) {
    await this.startInput.fill(start);
    await this.endInput.fill(end);
    await this.addButton.click();
  }

  /** スケジュール提出を保存する */
  async save() {
    await this.saveButton.click();
  }
}
