import { BasePage } from './base-page';

import type { Locator, Page } from '@playwright/test';

/**
 * セッション詳細ページのPage Object
 */
export class SessionDetailPage extends BasePage {
  // ヘッダー
  readonly pageTitle: Locator;
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
    this.backLink = page.getByRole('link', { name: 'セッション一覧' });
    this.editButton = page.getByRole('button', { name: '編集' });

    // アクションボタン
    this.actionButtons = page.locator(
      '[class*="sessionActions"] button, [class*="sessionActions"] a',
    );

    // セクション
    this.basicInfoSection = page.getByText('基本情報').locator('..');
    this.participantsSection = page.getByText('参加者').first().locator('..');
    this.gmNotesSection = page.getByText('GMメモ').locator('..');
    this.toolsSection = page.getByText('ツール・リンク').locator('..');
    this.timelineSection = page.getByText('タイムライン').locator('..');

    // フェーズ
    this.phaseSection = page.locator(
      'section[aria-label="セッション進行フェーズ"]',
    );

    // メニュー
    this.moreActionsButton = page.getByRole('button', {
      name: 'その他の操作',
    });

    // ダイアログ
    this.participationDialog = page.getByRole('dialog', { name: /参加申請/ });
    this.cancelSessionDialog = page.getByRole('dialog', { name: /キャンセル/ });
    this.completeSessionDialog = page.getByRole('dialog', { name: /完了/ });
    this.withdrawDialog = page.getByRole('dialog', { name: /辞退/ });
  }

  /** セッション詳細ページに遷移 */
  async goto(sessionId: string) {
    await this.navigate(`/sessions/${sessionId}`);
  }

  /** 参加申請ボタンをクリック */
  async clickParticipateButton() {
    await this.page.getByRole('button', { name: '参加申請' }).click();
  }

  /** キャンセルボタンをクリック */
  async clickCancelSessionButton() {
    await this.page.getByRole('button', { name: 'キャンセル' }).click();
  }

  /** 完了ボタンをクリック */
  async clickCompleteButton() {
    await this.page.getByRole('button', { name: '完了にする' }).click();
  }

  /** 申請管理リンクをクリック */
  async clickApplicationsLink() {
    await this.page.getByRole('link', { name: '申請管理' }).click();
  }

  /** 日程調整リンクをクリック */
  async clickScheduleLink() {
    await this.page.getByRole('link', { name: '日程調整' }).click();
  }

  /** その他の操作メニューを開く */
  async clickMoreActionsMenu() {
    await this.moreActionsButton.click();
  }

  /** 現在のフェーズテキストを取得 */
  async getPhaseText() {
    return this.phaseSection.textContent();
  }
}
