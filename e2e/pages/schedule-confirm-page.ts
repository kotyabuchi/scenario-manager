import { expect } from '@playwright/test';

import {
  candidateTimeBlockLabel,
  toScheduleInput,
} from '../helpers/schedule-confirmation';
import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';
import type { AvailabilityTimeBlockInput } from '../../src/app/(main)/sessions/[id]/schedule/availability/interface';

/**
 * 日程確定ページのPage Object
 */
export class ScheduleConfirmPage extends BasePage {
  readonly pageTitle: Locator;
  readonly calendarTitle: Locator;
  readonly emptyConfirmedMessage: Locator;
  readonly emptyRecommendationMessage: Locator;
  readonly confirmButton: Locator;
  readonly editor: Locator;
  readonly startInput: Locator;
  readonly endInput: Locator;
  readonly addButton: Locator;
  readonly candidateRows: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: '日程を確定する' });
    this.calendarTitle = page
      .getByText('日程確定カレンダー', { exact: true })
      .filter({ visible: true });
    this.emptyConfirmedMessage = page.getByText(
      'おすすめ一覧から候補を選択するか、上のフォームで追加してください。',
    );
    this.emptyRecommendationMessage = page.getByText(
      'スケジュールが不足しています',
    );
    this.confirmButton = page
      .getByRole('button', { name: '日程を確定', exact: true })
      .filter({ visible: true });
    this.editor = page.getByRole('region', { name: '日程を追加', exact: true });
    this.startInput = this.editor.getByLabel('開始', { exact: true });
    this.endInput = this.editor.getByLabel('終了', { exact: true });
    this.addButton = this.editor.getByRole('button', {
      name: '追加',
      exact: true,
    });
    this.candidateRows = page
      .locator('section')
      .filter({ has: this.editor })
      .getByRole('listitem');
    this.successMessage = page
      .getByText('確定日程を保存しました。', { exact: true })
      .filter({ visible: true });
  }

  /** 日程確定ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}/schedule/confirm`);
  }

  /** 現在のviewportで利用できる確定ボタンを通常操作する。 */
  /** 指定した配置の表示・他方の非表示を確認し、実際のボタンで保存する。 */
  async confirm(placement?: 'desktop' | 'sticky') {
    // モバイルの自動収納ナビを、上方向への通常スクロールで再表示する
    await this.pageTitle.scrollIntoViewIfNeeded();
    if (!placement) {
      await this.confirmButton.click();
      return;
    }
    const desktop = this.page
      .locator('section')
      .filter({ has: this.editor })
      .getByRole('button', {
        name: '日程を確定',
        exact: true,
        includeHidden: true,
      });
    const sticky = this.page
      .getByRole('navigation', {
        name: 'モバイルナビゲーション',
        exact: true,
        includeHidden: true,
      })
      .locator('..')
      .getByRole('button', {
        name: '日程を確定',
        exact: true,
        includeHidden: true,
      });
    const selected = placement === 'desktop' ? desktop : sticky;
    const hidden = placement === 'desktop' ? sticky : desktop;
    await expect(selected).toHaveCount(1);
    await expect(selected).toBeVisible();
    await expect(selected).toBeEnabled();
    await expect(hidden).toBeHidden();
    await selected.click();
  }

  /** Asia/Tokyoの日時入力から、実際の追加ボタンで枠を追加する。 */
  async addTimeBlock(block: AvailabilityTimeBlockInput) {
    const count = await this.candidateRows.count();
    await this.startInput.fill(toScheduleInput(block.startAt));
    await this.endInput.fill(toScheduleInput(block.endAt));
    await this.addButton.click();
    await expect(this.candidateRows).toHaveCount(count + 1);
  }

  /** 対象一覧の末尾から削除し、既存候補をすべて除去する。 */
  async removeAllTimeBlocks() {
    const count = await this.candidateRows.count();
    for (let index = count - 1; index >= 0; index -= 1) {
      await this.candidateRows
        .nth(index)
        .getByRole('button', { name: '削除', exact: true })
        .click();
      await expect(this.candidateRows).toHaveCount(index);
    }
  }

  /** UI上の候補を全件比較し、余分な旧枠や欠落も検出する。 */
  async expectCandidates(blocks: readonly AvailabilityTimeBlockInput[]) {
    await expect(this.candidateRows).toHaveCount(blocks.length);
    await expect(this.candidateRows).toContainText(
      blocks.map(candidateTimeBlockLabel),
    );
  }
}
