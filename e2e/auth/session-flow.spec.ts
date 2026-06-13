import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cleanupE2ESession, generateE2ESessionName } from '../helpers/cleanup';
import { SessionDetailPage } from '../pages/session-detail-page';
import { SessionNewPage } from '../pages/session-new-page';

/**
 * セッションフローのE2Eテスト（認証必須）
 *
 * テストシナリオ:
 * 1. セッション作成 → 詳細ページ表示
 * 2. 詳細ページの構造確認（GMビュー）
 * 3. アクションボタンの表示
 * 4. 申請管理ページへの遷移
 * 5. 日程調整ページへの遷移
 * 6. セッションキャンセル
 * 7. セッション完了
 * 8. アクセシビリティ
 *
 * 注: 参加申請→承認→日程回答の完全フローは
 * 複数ユーザー（GM + PL）が必要なため、
 * 単一ユーザーで検証可能な範囲に限定しています。
 */

let createdSessionId: string | null = null;

test.describe('セッションフロー', () => {
  test.afterAll(async () => {
    if (createdSessionId) {
      await cleanupE2ESession(createdSessionId);
    }
  });

  test.describe('セッション作成 → 詳細ページ', () => {
    test('セッションを作成して詳細ページに遷移する', async ({ page }) => {
      const sessionNewPage = new SessionNewPage(page);
      await sessionNewPage.goto();

      const name = generateE2ESessionName('フローテスト');
      await sessionNewPage.fillMinimum(
        name,
        'E2Eテスト用のセッション。セッションフローの検証を行います。',
      );
      await sessionNewPage.submit();

      // 詳細ページにリダイレクトされる
      await expect(page).toHaveURL(/\/sessions\/[A-Z0-9]{26}$/);
      await expect(page).toHaveTitle(/セッション詳細/);

      // セッションIDを保存
      const url = page.url();
      const match = url.match(/\/sessions\/([A-Z0-9]{26})$/);
      createdSessionId = match?.[1] ?? null;
    });
  });

  test.describe('セッション詳細ページ（GMビュー）', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(
        !createdSessionId,
        'セッション作成テストが先に成功する必要があります',
      );
      const detailPage = new SessionDetailPage(page);
      await detailPage.goto(createdSessionId ?? '');
    });

    test('セッション名がタイトルに表示される', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await expect(detailPage.pageTitle).toContainText(/フローテスト/);
    });

    test('戻るリンクが機能する', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await detailPage.backLink.click();
      await expect(page).toHaveURL(/\/sessions/);
    });

    test('GM用の編集ボタンが表示される', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await expect(detailPage.editButton).toBeVisible();
    });

    test('募集中フェーズでGM用アクションが表示される', async ({ page }) => {
      // 申請管理リンク
      await expect(page.getByRole('link', { name: '申請管理' })).toBeVisible();

      // 日程調整リンク
      await expect(page.getByRole('link', { name: '日程調整' })).toBeVisible();

      // キャンセルボタン
      await expect(
        page.getByRole('button', { name: 'キャンセル' }),
      ).toBeVisible();
    });

    test('基本情報セクションが表示される', async ({ page }) => {
      await expect(page.getByText('E2Eテスト用のセッション')).toBeVisible();
    });

    test('参加者セクションが表示される', async ({ page }) => {
      // 作成者が参加者として表示される
      const detailPage = new SessionDetailPage(page);
      await expect(detailPage.participantsSection).toBeVisible();
    });

    test('GMメモセクションが表示される', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await expect(detailPage.gmNotesSection).toBeVisible();
    });

    test('タイムラインにセッション作成イベントがある', async ({ page }) => {
      await expect(page.getByText('セッション作成')).toBeVisible();
    });
  });

  test.describe('サブページへの遷移', () => {
    test.beforeEach(async () => {
      test.skip(
        !createdSessionId,
        'セッション作成テストが先に成功する必要があります',
      );
    });

    test('申請管理ページに遷移できる', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await detailPage.goto(createdSessionId ?? '');
      await detailPage.clickApplicationsLink();
      await expect(page).toHaveURL(/\/applications$/);
    });

    test('日程調整ページに遷移できる', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await detailPage.goto(createdSessionId ?? '');
      await detailPage.clickScheduleLink();
      await expect(page).toHaveURL(/\/schedule$/);
    });
  });

  test.describe('ダイアログ操作', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(
        !createdSessionId,
        'セッション作成テストが先に成功する必要があります',
      );
      const detailPage = new SessionDetailPage(page);
      await detailPage.goto(createdSessionId ?? '');
    });

    test('キャンセルダイアログが開閉できる', async ({ page }) => {
      const detailPage = new SessionDetailPage(page);
      await detailPage.clickCancelSessionButton();
      await expect(detailPage.cancelSessionDialog).toBeVisible();

      // ダイアログ内のキャンセルボタンで閉じる
      await detailPage.cancelSessionDialog
        .getByRole('button', { name: 'キャンセル' })
        .first()
        .click();
      await expect(detailPage.cancelSessionDialog).not.toBeVisible();
    });
  });

  test.describe('アクセシビリティ', () => {
    test('セッション詳細ページのa11y違反がない', async ({ page }) => {
      test.skip(
        !createdSessionId,
        'セッション作成テストが先に成功する必要があります',
      );
      const detailPage = new SessionDetailPage(page);
      await detailPage.goto(createdSessionId ?? '');

      const results = await new AxeBuilder({ page })
        .include('main')
        .disableRules(['color-contrast'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
