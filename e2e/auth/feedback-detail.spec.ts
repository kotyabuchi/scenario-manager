import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { FeedbackDetailPage } from '../pages/feedback-detail-page';
import { FeedbackPage } from '../pages/feedback-page';

/**
 * フィードバック詳細ページのE2Eテスト（認証必須）
 */
test.describe('フィードバック詳細', () => {
  let detailPage: FeedbackDetailPage;

  test.beforeEach(async ({ page }) => {
    // 一覧から最初のカードをクリックして詳細に遷移
    const listPage = new FeedbackPage(page);
    await listPage.goto();

    const count = await listPage.feedbackCards.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await listPage.clickCard(0);

    detailPage = new FeedbackDetailPage(page);
  });

  test('戻るボタンが表示される', async () => {
    await expect(detailPage.backButton).toBeVisible();
  });

  test('タイトルが表示される', async () => {
    await expect(detailPage.heading).toBeVisible();
    const text = await detailPage.heading.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('投票ボタンが表示される', async () => {
    await expect(detailPage.voteButton).toBeVisible();
  });

  test('投票数が0以上の数値で表示される', async () => {
    const count = await detailPage.getVoteCountValue();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('コメント入力フォームが表示される', async () => {
    await expect(detailPage.commentInput).toBeVisible();
  });

  test('戻るボタンで一覧に戻れる', async ({ page }) => {
    await detailPage.backButton.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/feedback$/);
  });

  test('アクセシビリティ違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('フィードバック投票', () => {
  let detailPage: FeedbackDetailPage;

  test.beforeEach(async ({ page }) => {
    const listPage = new FeedbackPage(page);
    await listPage.goto();

    const count = await listPage.feedbackCards.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await listPage.clickCard(0);
    detailPage = new FeedbackDetailPage(page);
  });

  test('投票→取り消しで元の数に戻る', async ({ page }) => {
    const initialCount = await detailPage.getVoteCountValue();
    const initialVoted = await detailPage.isVoted();

    // 投票（または取り消し）
    await detailPage.voteButton.click();

    // 楽観的更新で即座に反映される
    if (initialVoted) {
      // 取り消し: カウント -1
      await expect(detailPage.voteCount).toHaveText(
        String(Math.max(initialCount - 1, 0)),
      );
    } else {
      // 投票: カウント +1
      await expect(detailPage.voteCount).toHaveText(String(initialCount + 1));
    }

    // サーバー反映を待つ
    await page.waitForLoadState('domcontentloaded');

    // 逆操作で元に戻す
    await detailPage.voteButton.click();
    await expect(detailPage.voteCount).toHaveText(String(initialCount));
  });

  test('投票数が負にならない', async ({ page }) => {
    // 既に投票済みなら取り消してから確認
    const initialVoted = await detailPage.isVoted();
    if (initialVoted) {
      await detailPage.voteButton.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // 現在0票の状態で表示を確認
    const count = await detailPage.getVoteCountValue();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('投票するとaria-pressedが切り替わる', async () => {
    const before = await detailPage.isVoted();
    await detailPage.voteButton.click();

    // aria-pressed が反転する
    await expect(detailPage.voteButton).toHaveAttribute(
      'aria-pressed',
      String(!before),
    );
  });

  // FIXME: 共有フィードバックの投票状態を複数テストが変異させるため、リロード永続検証が
  // 先行テストの残留状態と競合し不安定。テスト毎の新規フィードバック or DBリセット
  // （Docker+seed 分離基盤）導入後に test() へ戻す。詳細は PROGRESS の Category B 参照。
  test.fixme(
    '投票後にページリロードしても状態が保持される',
    async ({ page }) => {
      // 「状態」= ユーザー自身の投票状態(aria-pressed)。グローバルな投票数は他ユーザーの
      // 投票で変動し得るため、per-userで決定論的な aria-pressed の永続性を検証する。
      const initialVoted = await detailPage.isVoted();

      // 投票状態をトグル
      await detailPage.voteButton.click();
      await expect(detailPage.voteButton).toHaveAttribute(
        'aria-pressed',
        String(!initialVoted),
      );

      // リロードしても反転後の状態が保持される
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      detailPage = new FeedbackDetailPage(page);
      await expect(detailPage.voteButton).toHaveAttribute(
        'aria-pressed',
        String(!initialVoted),
      );

      // 元に戻す（クリーンアップ）
      await detailPage.voteButton.click();
      await expect(detailPage.voteButton).toHaveAttribute(
        'aria-pressed',
        String(initialVoted),
      );
    },
  );
});

test.describe('フィードバック一覧の投票', () => {
  let listPage: FeedbackPage;

  test.beforeEach(async ({ page }) => {
    listPage = new FeedbackPage(page);
    await listPage.goto();

    const count = await listPage.feedbackCards.count();
    if (count === 0) {
      test.skip();
    }
  });

  test('一覧カードに投票ボタンが表示される', async () => {
    const voteButton = listPage.getVoteButton(0);
    await expect(voteButton).toBeVisible();
  });

  test('一覧で投票→取り消ししてもカウントが負にならない', async ({ page }) => {
    const voteButton = listPage.getVoteButton(0);
    const voteCount = listPage.getVoteCount(0);

    const initialCount = Number.parseInt(
      (await voteCount.textContent()) ?? '0',
      10,
    );

    // 投票or取り消し
    await voteButton.click();

    // 少し待ってから確認
    await page.waitForTimeout(500);

    const afterCount = Number.parseInt(
      (await voteCount.textContent()) ?? '0',
      10,
    );
    expect(afterCount).toBeGreaterThanOrEqual(0);

    // 元に戻す
    await voteButton.click();
    await page.waitForTimeout(500);

    const restoredCount = Number.parseInt(
      (await voteCount.textContent()) ?? '0',
      10,
    );
    expect(restoredCount).toBe(initialCount);
  });
});
