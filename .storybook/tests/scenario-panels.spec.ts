import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
};

for (const width of [320, 390, 600, 1280]) {
  test(`詳細の戻る・操作ボタンが${width}px幅で収まる`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openStory(page, 'scenarios-scenariodetailpanel--page-variant');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'シナリオ一覧に戻る', exact: true }),
    ).toBeVisible();
    const favorite = page.getByRole('button', { name: 'お気に入り' });
    const createSession = page.getByRole('link', {
      name: 'セッションを作成',
      exact: true,
    });
    await expect(favorite).toBeInViewport();
    await expect(createSession).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  });
}

test('モバイルでも検索を入力・実行・リセットできる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'scenarios-scenariolistpanel--default');
  const search = page.getByRole('searchbox', { name: 'フリーワード検索' });
  await search.fill('検索に一致しない固有語');
  await expect(search).toHaveValue('検索に一致しない固有語');
  await page.getByRole('button', { name: 'この条件で検索' }).click();
  await expect(page.getByText('検索結果：0件', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: '条件をリセット', exact: true })
    .click();
  await expect(search).toHaveValue('');
  await expect(page.getByText('検索結果：0件', { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('2ペインの下限幅で左右1:1と検索結果行を保つ', async ({ page }) => {
  // Storyの左右余白48pxを除いた740pxが2ペインの利用可能幅。
  await page.setViewportSize({ width: 788, height: 900 });
  await openStory(page, 'scenarios-twopane--default');
  await page.getByRole('button', { name: '詳細フィルター' }).click();
  await expect(
    page.getByText('プレイ人数', { exact: true }).first(),
  ).toBeVisible();

  const paneWidths = await page
    .locator('#storybook-root > div > div > div')
    .evaluate((grid) =>
      Array.from(grid.children, (pane) => pane.getBoundingClientRect().width),
    );
  expect(paneWidths).toHaveLength(2);
  expect(paneWidths[0]).toBeCloseTo(paneWidths[1], 0);
  expect(paneWidths[0]).toBeGreaterThanOrEqual(358);

  const sortLabelLines = await page
    .getByText('並び替え：', { exact: true })
    .evaluate((label) => {
      const range = document.createRange();
      range.selectNodeContents(label);
      return range.getClientRects().length;
    });
  expect(sortLabelLines).toBe(1);
  await expectNoHorizontalOverflow(page);
});

test('お気に入りの保存失敗を通知して再操作できる', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await openStory(page, 'scenarios-scenariodetailpanel--favorite-failure');
  const favorite = page.getByRole('button', { name: 'お気に入り' });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await favorite.click();
  await expect(favorite).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('更新に失敗しました');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await expect(favorite).toBeEnabled();
  await favorite.click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(favorite).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('更新に失敗しました');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await expect(favorite).toBeEnabled();
});

test('空白のない長文でも詳細のタイトルが欠けない', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openStory(page, 'scenarios-scenariodetailpanel--long-unbroken-content');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  const sizes = await heading.evaluate((element) => {
    // ページ全体が収まっても、カードの overflow:hidden で文字が欠け得る。
    let visibleRight = document.documentElement.clientWidth;
    let ancestor = element.parentElement;
    while (ancestor) {
      if (
        ['hidden', 'clip', 'auto', 'scroll'].includes(
          getComputedStyle(ancestor).overflowX,
        )
      ) {
        visibleRight = Math.min(
          visibleRight,
          ancestor.getBoundingClientRect().right,
        );
      }
      ancestor = ancestor.parentElement;
    }
    return {
      content: element.scrollWidth,
      width: element.clientWidth,
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
      visibleRight,
    };
  });
  expect(sizes.content).toBeLessThanOrEqual(sizes.width + 1);
  expect(sizes.left).toBeGreaterThanOrEqual(0);
  expect(sizes.right).toBeLessThanOrEqual(sizes.visibleRight);
  await expectNoHorizontalOverflow(page);
});
