import { expect } from '@playwright/test';

import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * セッション詳細ページのPage Object
 */
export class SessionDetailPage extends BasePage {
  // ヘッダー
  readonly pageTitle: Locator;
  readonly sessionHeader: Locator;
  readonly backLink: Locator;
  readonly editButton: Locator;

  // アクションボタン
  readonly actionButtons: Locator;

  // 基本情報セクション
  readonly basicInfoSection: Locator;

  // 参加者セクション
  readonly participantsSection: Locator;

  // GMメモセクション
  readonly gmNotesSection: Locator;

  // サイドバー
  readonly toolsSection: Locator;
  readonly timelineSection: Locator;

  // フェーズ
  readonly phaseSection: Locator;

  // メニュー
  readonly moreActionsButton: Locator;

  // ダイアログ
  readonly participationDialog: Locator;
  readonly cancelSessionDialog: Locator;
  readonly completeSessionDialog: Locator;
  readonly withdrawDialog: Locator;

  constructor(page: Page) {
    super(page);

    // ヘッダー
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.sessionHeader = page.locator('header').filter({ has: this.pageTitle });
    this.backLink = page.getByRole('link', { name: '戻る' });
    this.editButton = page.getByRole('button', { name: '基本情報を編集' });

    // アクションボタン
    this.actionButtons = page.locator(
      '[class*="sessionActions"] button, [class*="sessionActions"] a',
    );

    // セクション
    this.basicInfoSection = page.locator('section').filter({
      has: page.getByRole('heading', {
        level: 2,
        name: '基本情報',
        exact: true,
        includeHidden: true,
      }),
    });
    this.participantsSection = page.locator('section').filter({
      has: page.getByRole('heading', { level: 2, name: '参加者', exact: true }),
    });
    this.gmNotesSection = page.locator('section').filter({
      has: page.getByRole('heading', { level: 2, name: 'GMメモ', exact: true }),
    });
    this.toolsSection = page.getByText('ツール・リンク').locator('..');
    this.timelineSection = page.locator('section').filter({
      has: page.getByRole('heading', {
        level: 2,
        name: 'タイムライン',
        exact: true,
      }),
    });

    // フェーズ
    this.phaseSection = page.locator(
      'section[aria-label="セッション進行フェーズ"]',
    );

    // メニュー
    this.moreActionsButton = this.sessionHeader
      .getByRole('button', { name: 'その他の操作', exact: true })
      .filter({ visible: true });

    // ダイアログ
    this.participationDialog = page.getByRole('dialog', { name: /参加申請/ });
    this.cancelSessionDialog = page.getByRole('dialog', { name: /キャンセル/ });
    this.completeSessionDialog = page.getByRole('dialog', { name: /完了/ });
    this.withdrawDialog = page.getByRole('dialog', { name: /辞退/ });
  }

  /** セッション詳細ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}`);
    // ストリーミング中は、表示用のセクションと非表示のコピーが一時的に共存する。
    await this.basicInfoSection.filter({ visible: true }).waitFor();
    await expect(this.basicInfoSection).toHaveCount(1);
  }

  /** 参加申請ボタンをクリック */
  async clickParticipateButton() {
    await this.page.getByRole('button', { name: '参加申請' }).click();
  }

  /** キャンセルボタンをクリック */
  async clickCancelSessionButton() {
    await this.clickMoreActionsMenu();
    await this.sessionHeader
      .getByRole('menuitem', { name: 'キャンセル', exact: true })
      .click();
  }

  /** 完了ボタンをクリック */
  async clickCompleteButton() {
    await this.page.getByRole('button', { name: '完了にする' }).click();
  }

  /** 申請管理リンクをクリック */
  async clickApplicationsLink() {
    await this.clickHeaderAction('申請管理');
  }

  /** 募集中セッションのスケジュール提出導線をクリック */
  async clickScheduleLink() {
    await this.clickHeaderAction('スケジュールを提出');
  }

  /** その他の操作メニューを開く */
  async clickMoreActionsMenu() {
    await this.moreActionsButton.click();
  }

  /** ヘッダーの可視配置に合わせてリンクまたはメニュー項目を操作する */
  private async clickHeaderAction(name: string) {
    await this.moreActionsButton.waitFor({ state: 'visible' });
    const inlineLink = this.sessionHeader.getByRole('link', {
      name,
      exact: true,
    });
    if (await inlineLink.isVisible()) {
      await inlineLink.click();
      return;
    }
    await this.clickMoreActionsMenu();
    await this.sessionHeader
      .getByRole('menuitem', { name, exact: true })
      .click();
  }

  /** 現在のフェーズテキストを取得 */
  async getPhaseText() {
    return this.phaseSection.textContent();
  }
}
