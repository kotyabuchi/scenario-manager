import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { cleanupE2ESession, generateE2ESessionName } from '../helpers/cleanup';
import { getNextWeekDateTimeLocal } from '../helpers/datetime';
import { ApplicationsPage } from '../pages/applications-page';
import { AvailabilityPage } from '../pages/availability-page';
import { SessionNewPage } from '../pages/session-new-page';

/**
 * セッションサブページの構造検証E2Eテスト（認証必須）
 *
 * beforeAllで1つのセッションを作成し、各サブページのテストで共有する。
 */

let sessionId: string;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: 'e2e/.auth/user.json',
  });
  const page = await context.newPage();
  const sessionNewPage = new SessionNewPage(page);
  await sessionNewPage.goto();

  const name = generateE2ESessionName('subpages');
  await sessionNewPage.fillMinimum(
    name,
    'サブページ構造検証用テストセッション',
  );
  await sessionNewPage.submit();
  await page.waitForURL(/\/sessions\/(?!new$)[^/]+$/);

  sessionId = page.url().match(/\/sessions\/([^/]+)/)?.[1] ?? '';
  await page.close();
  await context.close();
});

test.afterAll(async () => {
  await cleanupE2ESession(sessionId);
});

test.describe('申請管理ページ', () => {
  let applicationsPage: ApplicationsPage;

  test.beforeEach(async ({ page }) => {
    applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto(sessionId);
  });

  test('ページタイトルが表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: '参加申請管理' }),
    ).toBeVisible();
  });

  test('3つのタブが表示される', async () => {
    await expect(applicationsPage.tabAll).toBeVisible();
    await expect(applicationsPage.tabAll).toContainText('すべて');

    await expect(applicationsPage.tabPending).toBeVisible();
    await expect(applicationsPage.tabPending).toContainText('承認待ち');

    await expect(applicationsPage.tabConfirmed).toBeVisible();
    await expect(applicationsPage.tabConfirmed).toContainText('承認済み');
  });

  test('すべてタブが初期選択されている', async () => {
    await expect(applicationsPage.tabAll).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('タブ切り替えが動作する', async () => {
    await applicationsPage.tabPending.click();
    await expect(applicationsPage.tabPending).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(applicationsPage.tabAll).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  test('GM（セッション作成者）が自動参加者として表示される', async ({
    page,
  }) => {
    // セッション作成者はGMとして自動的に承認済み参加者になる
    // サマリーの「承認済み N / N 件」で確認（タブ・バッジにも同テキストが出現するためスコープを限定）
    await expect(page.getByText(/承認済み \d+ \/ \d+ 件/)).toBeVisible();
  });

  test('a11y違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules([
        'color-contrast',
        'heading-order',
        'landmark-unique',
        'landmark-main-is-top-level',
        'landmark-no-duplicate-main',
      ])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('スケジュール提出ページ', () => {
  // DB保存テストが並列実行で競合するためシリアル実行
  test.describe.configure({ mode: 'serial' });
  let availabilityPage: AvailabilityPage;

  test.beforeEach(async ({ page }) => {
    availabilityPage = new AvailabilityPage(page);
    await availabilityPage.goto(sessionId);
  });

  test('ページタイトルが表示される', async () => {
    await expect(availabilityPage.pageTitle).toBeVisible();
  });

  test('追加フォームが表示される', async () => {
    await expect(availabilityPage.startInput).toBeVisible();
    await expect(availabilityPage.endInput).toBeVisible();
    await expect(availabilityPage.addButton).toBeVisible();
  });

  test('空状態メッセージが表示される', async () => {
    await expect(availabilityPage.emptyScheduleMessage).toBeVisible();
  });

  test('時間帯を追加すると件数が更新される', async () => {
    const start = getNextWeekDateTimeLocal(0, 14, 0);
    const end = getNextWeekDateTimeLocal(0, 16, 0);
    await availabilityPage.addTimeBlock(start, end);
    await expect(availabilityPage.scheduleCountText).toBeVisible();
  });

  test('保存すると成功メッセージが表示される', async () => {
    const start = getNextWeekDateTimeLocal(0, 14, 0);
    const end = getNextWeekDateTimeLocal(0, 16, 0);
    await availabilityPage.addTimeBlock(start, end);
    await availabilityPage.save();
    await expect(availabilityPage.successMessage).toBeVisible();
  });

  test('保存後リロードするとスケジュールが表示されている', async ({ page }) => {
    // シリアル実行の前のテストでスケジュールが保存済み
    // ページ遷移直後にスケジュールが表示されていることを確認
    await expect(availabilityPage.scheduleCountText).toBeVisible();

    // リロード後も維持されていることを確認
    await page.reload();
    await expect(availabilityPage.scheduleCountText).toBeVisible();
  });

  test('a11y違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules([
        'color-contrast',
        'heading-order',
        'landmark-unique',
        'landmark-main-is-top-level',
        'landmark-no-duplicate-main',
      ])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('日程確定ページ', () => {
  test('RECRUITINGフェーズでアクセスするとリダイレクトされる', async ({
    page,
  }) => {
    await page.goto(`/sessions/${sessionId}/schedule/confirm`);
    await expect(page).toHaveURL(`/sessions/${sessionId}`);
  });
});
