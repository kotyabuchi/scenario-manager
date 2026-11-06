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
    this.startInput = page
      .getByLabel('開始', { exact: true })
      .filter({ visible: true });
    this.endInput = page
      .getByLabel('終了', { exact: true })
      .filter({ visible: true });
    this.addButton = page
      .getByRole('button', { name: '追加', exact: true })
      .filter({ visible: true });
    this.editorErrorAlert = page.getByRole('alert');

    // 保存
    this.saveButton = page.getByRole('button', { name: /提出を保存/ });
    this.successMessage = page.getByText('スケジュールを保存しました。');

    // 状態表示
    this.emptyScheduleMessage = page
      .getByRole('main')
      .getByText(
        'まだスケジュールがありません。右側からコピーするか、上のフォームで追加してください。',
        { exact: true },
      )
      .filter({ visible: true });
    // aria-live="polite" 内のスケジュール件数に限定し strict mode violation を回避
    this.scheduleCountText = page
      .locator('[aria-live="polite"]')
      .getByText(/\d+件/)
      .first();
  }

  /** スケジュール提出ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}/schedule/availability`);
  }

  /** 時間ブロックを追加する */
  async addTimeBlock(start: string, end: string) {
    await this.startInput.fill(start);
    await this.endInput.fill(end);
    await this.addButton.click();
  }

  /**
   * スケジュール提出を保存する
   *
   * 「提出を保存」ボタンはモバイル用 StickyBar 内にあり、
   * デスクトップ幅（md以上）では display:none のため、
   * 一時的にビューポートをモバイル幅に切り替えてクリックする。
   */
  async save() {
    const viewport = this.page.viewportSize();
    await this.page.setViewportSize({ width: 375, height: 812 });
    // devツールのオーバーレイがポインタイベントを遮る場合があるため
    // dispatchEvent で直接イベントを発火させる
    await this.saveButton.dispatchEvent('click');
    if (viewport) {
      await this.page.setViewportSize(viewport);
    }
  }
}
