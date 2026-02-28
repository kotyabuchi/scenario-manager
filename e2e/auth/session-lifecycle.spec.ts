import { expect, test } from '@playwright/test';

import { cleanupE2ESessions, generateE2ESessionName } from '../helpers/cleanup';
import { getNextWeekDateTimeLocal } from '../helpers/datetime';
import { AvailabilityPage } from '../pages/availability-page';
import { ScheduleConfirmPage } from '../pages/schedule-confirm-page';
import { SessionDetailPage } from '../pages/session-detail-page';
import { SessionNewPage } from '../pages/session-new-page';

/**
 * セッションライフサイクルのE2Eテスト（認証必須・シリアル実行）
 *
 * フェーズ遷移を順番に検証する:
 * 1. RECRUITING フェーズの表示確認
 * 2. スケジュール提出
 * 3. 募集締切（RECRUITING -> PREPARATION）
 * 4. PREPARATION フェーズでの日程確定
 * 5. キャンセル操作
 *
 * 注: テスト間でフェーズ状態が引き継がれるため、シリアル実行が必須。
 */

let sessionId: string;
let sessionDetailPage: SessionDetailPage;
let availabilityPage: AvailabilityPage;
let scheduleConfirmPage: ScheduleConfirmPage;

test.describe('セッションライフサイクル', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    });
    const page = await context.newPage();
    const sessionNewPage = new SessionNewPage(page);
    await sessionNewPage.goto();

    const name = generateE2ESessionName('lifecycle');
    await sessionNewPage.fillMinimum(name, 'ライフサイクルテスト用セッション');
    await sessionNewPage.submit();
    await page.waitForURL(/\/sessions\/[^/]+$/);

    sessionId = page.url().match(/\/sessions\/([^/]+)/)?.[1] ?? '';
    await page.close();
    await context.close();
  });

  test.afterAll(async () => {
    await cleanupE2ESessions();
  });

  test.describe('RECRUITING フェーズ', () => {
    test.beforeEach(async ({ page }) => {
      sessionDetailPage = new SessionDetailPage(page);
      await sessionDetailPage.goto(sessionId);
    });

    test('フェーズステッパーに「募集中」が表示される', async () => {
      await expect(sessionDetailPage.phaseSection).toContainText('募集中');
    });

    test('「募集を締める」ボタンが表示される', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: '募集を締める' }),
      ).toBeVisible();
    });

    test('「申請管理」「スケジュールを提出」リンクが表示される', async ({
      page,
    }) => {
      await expect(page.getByRole('link', { name: '申請管理' })).toBeVisible();
      await expect(
        page.getByRole('link', { name: /スケジュールを提出/ }),
      ).toBeVisible();
    });

    test('「キャンセル」がメニュー内に表示される', async ({ page }) => {
      await sessionDetailPage.clickMoreActionsMenu();
      await expect(
        page.getByRole('menuitem', { name: 'キャンセル' }),
      ).toBeVisible();
    });
  });

  test.describe('スケジュール提出', () => {
    test('スケジュールを追加して保存できる', async ({ page }) => {
      availabilityPage = new AvailabilityPage(page);
      await availabilityPage.goto(sessionId);

      const start = getNextWeekDateTimeLocal(0, 14, 0);
      const end = getNextWeekDateTimeLocal(0, 16, 0);
      await availabilityPage.addTimeBlock(start, end);
      await availabilityPage.save();
      await expect(availabilityPage.successMessage).toBeVisible();
    });
  });

  test.describe('募集締切（RECRUITING → PREPARATION）', () => {
    test('募集を締めるとPREPARATIONフェーズに遷移する', async ({ page }) => {
      sessionDetailPage = new SessionDetailPage(page);
      await sessionDetailPage.goto(sessionId);

      await page.getByRole('button', { name: '募集を締める' }).click();
      // 成功メッセージを待つ
      await expect(
        page.getByText('募集を締めました。準備フェーズに移行しました'),
      ).toBeVisible();
      // フェーズが更新されたことを確認
      await expect(sessionDetailPage.phaseSection).toContainText('準備中');
    });
  });

  test.describe('日程確定（PREPARATION フェーズ）', () => {
    test('日程確定ページにアクセスできる', async ({ page }) => {
      scheduleConfirmPage = new ScheduleConfirmPage(page);
      await scheduleConfirmPage.goto(sessionId);
      await expect(scheduleConfirmPage.pageTitle).toBeVisible();
    });

    test('日程確定ページの構造が正しい', async ({ page }) => {
      scheduleConfirmPage = new ScheduleConfirmPage(page);
      await scheduleConfirmPage.goto(sessionId);
      // カレンダータイトルが表示されること
      await expect(scheduleConfirmPage.calendarTitle).toBeVisible();
    });

    test('おすすめ候補を選択して日程を確定できる', async ({ page }) => {
      scheduleConfirmPage = new ScheduleConfirmPage(page);
      await scheduleConfirmPage.goto(sessionId);

      // GMのスケジュールが提出済みのため、おすすめ候補が必ず表示される
      // （requiredUsers=1、GM自身は常に参加可能 → 全員参加可の候補が生成される）
      const firstRecommendation = page
        .getByRole('button')
        .filter({ hasText: /全員参加可/ })
        .first();
      await expect(firstRecommendation).toBeVisible();
      await firstRecommendation.click();

      // 確定ボタンが有効になり、日程を確定できること
      await expect(scheduleConfirmPage.confirmButton).toBeEnabled();
      await scheduleConfirmPage.confirmButton.click();
      await expect(page.getByText('確定日程を保存しました。')).toBeVisible();
    });
  });

  test.describe('キャンセル操作', () => {
    test('セッションをキャンセルできる', async ({ page }) => {
      sessionDetailPage = new SessionDetailPage(page);
      await sessionDetailPage.goto(sessionId);

      // メニューを開いてキャンセルをクリック
      await sessionDetailPage.clickMoreActionsMenu();
      await page.getByRole('menuitem', { name: 'キャンセル' }).click();

      // キャンセルダイアログの操作
      const dialog = page.getByRole('dialog', { name: /キャンセル/ });
      await expect(dialog).toBeVisible();
      await page.getByLabel(/確認のため/).fill('キャンセル');
      await dialog.getByRole('button', { name: 'キャンセルする' }).click();

      // フェーズが「キャンセル」に変更されることを検証
      await expect(sessionDetailPage.phaseSection).toContainText('キャンセル');
    });
  });
});
