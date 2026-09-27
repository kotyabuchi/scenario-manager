import { expect, test } from '@playwright/test';

import { ScenarioDetailPage } from '../pages/scenario-detail-page';
import { ScenariosPage } from '../pages/scenarios-page';

test.describe('シナリオ一覧と詳細のルーティング', () => {
  test.beforeEach(async ({ browserName }, testInfo) => {
    test.skip(
      browserName !== 'chromium' || testInfo.project.name === 'mobile-chrome',
      'ビューポート幅を明示したPC検証',
    );
  });

  test('一覧単独表示ではスクロールバーを右端に置き、余白はペイン内側に保つ', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1319, height: 954 });
    const list = new ScenariosPage(page);
    await list.goto();

    const mainBox = await page.getByRole('main').boundingBox();
    const listBox = await list.listPane.boundingBox();
    expect(mainBox).not.toBeNull();
    expect(listBox).not.toBeNull();
    if (mainBox && listBox) {
      expect(
        Math.abs(listBox.x + listBox.width - mainBox.x - mainBox.width),
      ).toBeLessThanOrEqual(1);
    }
    await expect(list.listPane).toHaveCSS('padding-top', '24px');
    await expect(list.listPane).toHaveCSS('padding-bottom', '24px');
    await expect(list.listPane).toHaveCSS('padding-right', '24px');
    await expect(list.listPane).toHaveCSS('overflow-y', 'auto');
    await expect(list.listPane).toHaveAttribute('data-can-scroll-up', 'false');
    await expect(list.listPane).toHaveAttribute('data-can-scroll-down', 'true');
    await expect(list.listPane).not.toHaveCSS('mask-image', 'none');

    await list.listPane.evaluate((element) => {
      element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
    });
    await expect(list.listPane).toHaveAttribute('data-can-scroll-up', 'true');
    await expect(list.listPane).toHaveAttribute('data-can-scroll-down', 'true');

    await list.listPane.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(list.listPane).toHaveAttribute('data-can-scroll-up', 'true');
    await expect(list.listPane).toHaveAttribute(
      'data-can-scroll-down',
      'false',
    );

    await page.setViewportSize({ width: 1319, height: 4000 });
    await expect(list.listPane).toHaveAttribute('data-can-scroll-up', 'false');
    await expect(list.listPane).toHaveAttribute(
      'data-can-scroll-down',
      'false',
    );
    await expect(list.listPane).toHaveCSS('mask-image', 'none');
  });

  test('広い画面では左右1:1の2ペインで開き、閉じると一覧へ戻る', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto();
    await page
      .locator('[data-pane-open] > section[aria-label="シナリオ詳細"]')
      .evaluate((element) => {
        element.addEventListener(
          'animationstart',
          (event) => {
            if (
              event instanceof AnimationEvent &&
              event.animationName === 'slideInFromRight'
            ) {
              element.dataset.slideStarted = 'true';
            }
          },
          { once: true },
        );
      });
    await list.clickScenarioCard();

    await expect(list.listPane).toBeVisible();
    await expect(detail.pane).toBeVisible();
    await expect(detail.pane).toHaveAttribute('data-slide-started', 'true');
    await expect(detail.closeControl).toBeVisible();
    await expect(detail.closeControl).toBeFocused();
    await expect(detail.toc).toHaveCount(0);
    await expect(detail.pane).toHaveCSS('animation-name', 'slideInFromRight');
    await expect(detail.pane).toHaveCSS('animation-duration', '0.5s');
    await expect(detail.pane).toHaveCSS(
      'animation-timing-function',
      'cubic-bezier(0.645, 0.045, 0.355, 1)',
    );

    const listBox = await list.listPane.boundingBox();
    const detailBox = await detail.pane.boundingBox();
    expect(listBox).not.toBeNull();
    expect(detailBox).not.toBeNull();
    if (listBox && detailBox) {
      expect(listBox.x + listBox.width).toBeLessThan(detailBox.x);
      expect(Math.abs(listBox.width - detailBox.width)).toBeLessThanOrEqual(2);
    }

    // 各ペインは独立してスクロールでき、ページ全体ははみ出さない。
    await expect(page.locator('footer')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        ),
      )
      .toBeLessThanOrEqual(1);
    await expect(list.listPane).toHaveCSS('overflow-y', 'auto');
    await expect(detail.pane).toHaveCSS('overflow-y', 'auto');
    await expect(list.listPane).toHaveCSS('padding-right', '8px');
    await expect(detail.pane).toHaveCSS('padding-right', '8px');
    await expect(detail.pane).toHaveAttribute('data-can-scroll-down', 'true');
    await expect(detail.pane).not.toHaveCSS('mask-image', 'none');
    await detail.pane.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(detail.pane).toHaveAttribute('data-can-scroll-up', 'true');
    await expect(detail.pane).toHaveAttribute('data-can-scroll-down', 'false');

    await detail.closeControl.click();
    await expect(page).toHaveURL(/\/scenarios(?:\?.*)?$/);
    await expect(list.listPane).toBeVisible();
    await expect(detail.pane).not.toBeVisible();
  });

  test('動きを抑える設定では詳細ペインをスライドさせない', async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto();
    await list.clickScenarioCard();

    await expect(detail.pane).toBeVisible();
    await expect(detail.pane).toHaveCSS('animation-name', 'none');
  });

  test('狭い画面では詳細を単独表示し、戻ると一覧を表示する', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto();
    await list.clickScenarioCard();

    await expect(detail.pane).toBeVisible();
    await expect(list.listPane).not.toBeVisible();
    await expect(detail.backControl).toBeVisible();
    await expect(detail.tocTrigger).toBeVisible();
    await detail.tocTrigger.click();
    await expect(detail.toc).toBeVisible();

    await page.keyboard.press('Escape');

    await detail.backControl.click();
    await expect(list.listPane).toBeVisible();
  });

  test('2ペイン合計1000pxを境に切り替わり、サイドメニューを畳むと再び2ペインになる', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto();
    const sideMenu = page.getByRole('complementary', {
      name: 'メインナビゲーション',
    });
    const toggle = sideMenu.getByRole('button', {
      name: 'サイドメニューを閉じる',
    });
    const logo = sideMenu.getByRole('link', { name: /シナプレ管理くん/ });
    const menuContent = sideMenu.locator(':scope > div').first();
    await expect(menuContent).toHaveCSS('padding-top', '16px');
    await expect(menuContent).toHaveCSS('padding-left', '16px');
    await expect(menuContent).toHaveCSS('overflow-y', 'auto');
    await expect(logo).toHaveCSS('padding-left', '0px');
    await expect(logo).toHaveCSS('padding-right', '0px');
    const toggleBox = await toggle.boundingBox();
    const logoBox = await logo.boundingBox();
    const sideMenuBox = await sideMenu.boundingBox();
    const loginBox = await sideMenu
      .getByRole('button', { name: 'ログイン' })
      .boundingBox();
    const navIcons = sideMenu.locator('nav a svg');
    const iconBoxesBefore = await navIcons.evaluateAll((icons) =>
      icons.map((icon) => {
        const { x, y } = icon.getBoundingClientRect();
        return { x, y };
      }),
    );
    expect(toggleBox).not.toBeNull();
    expect(logoBox).not.toBeNull();
    expect(sideMenuBox).not.toBeNull();
    if (toggleBox && sideMenuBox) {
      const menuRight = sideMenuBox.x + sideMenuBox.width;
      expect(Math.abs(toggleBox.x - menuRight)).toBeLessThanOrEqual(1);
      expect(toggleBox.x + toggleBox.width).toBeGreaterThan(menuRight);
      expect(toggleBox.height).toBe(112);
      const menuCenterY = sideMenuBox.y + sideMenuBox.height / 2;
      const toggleCenterY = toggleBox.y + toggleBox.height / 2;
      expect(Math.abs(toggleCenterY - menuCenterY)).toBeLessThanOrEqual(1);
    }
    for (const label of ['シナプレ管理くん', 'TRPGを、もっと楽しく。']) {
      const textFits = await sideMenu
        .getByText(label, { exact: true })
        .evaluate((element) => element.scrollWidth <= element.clientWidth);
      expect(textFits).toBe(true);
    }
    await list.clickScenarioCard();

    await expect(list.listPane).toBeVisible();
    await expect(detail.pane).toBeVisible();
    const leftWidth = (await list.listPane.boundingBox())?.width;
    const rightWidth = (await detail.pane.boundingBox())?.width;
    const paneWidth = (leftWidth ?? 0) + (rightWidth ?? 0);
    expect(paneWidth).toBeGreaterThanOrEqual(1000);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        ),
      )
      .toBeLessThanOrEqual(1);

    const outerWidth = 1360 - (sideMenuBox?.width ?? 0) - paneWidth;
    const twoPaneBreakpoint = Math.ceil(
      (sideMenuBox?.width ?? 0) + outerWidth + 1000,
    );
    await page.setViewportSize({ width: twoPaneBreakpoint, height: 900 });
    await expect(list.listPane).toBeVisible();
    await page.setViewportSize({ width: twoPaneBreakpoint - 1, height: 900 });
    await expect(list.listPane).not.toBeVisible();
    await expect(detail.backControl).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(list.listPane).not.toBeVisible();
    await expect(detail.pane).toBeVisible();
    await expect(detail.backControl).toBeVisible();

    await page.getByRole('button', { name: 'サイドメニューを閉じる' }).click();
    await expect(menuContent).toHaveCSS('padding-top', '16px');
    await expect(menuContent).toHaveCSS('padding-left', '16px');
    const homeIconLink = sideMenu.getByRole('link', { name: 'ホーム' });
    await expect(homeIconLink).toBeVisible();
    await expect(homeIconLink).toHaveText('');
    await expect(homeIconLink).toHaveCSS('justify-content', 'flex-start');
    await expect(homeIconLink).toHaveCSS('padding-left', '12px');
    await expect(homeIconLink).toHaveCSS('padding-right', '12px');
    const collapsedMenuBox = await sideMenu.boundingBox();
    const collapsedNavLinkBox = await homeIconLink.boundingBox();
    if (collapsedMenuBox && collapsedNavLinkBox) {
      expect(collapsedNavLinkBox.width).toBeGreaterThanOrEqual(44);
      expect(collapsedMenuBox.width).toBeGreaterThanOrEqual(
        collapsedNavLinkBox.width + 32,
      );
    }
    await expect(logo).toBeVisible();
    await expect(logo).toHaveText('');
    const collapsedLogoBox = await logo.boundingBox();
    expect(collapsedLogoBox).not.toBeNull();
    if (logoBox && collapsedLogoBox) {
      expect(Math.abs(collapsedLogoBox.y - logoBox.y)).toBeLessThanOrEqual(1);
    }
    const collapsedLoginBox = await sideMenu
      .getByRole('button', { name: 'ログイン' })
      .boundingBox();
    if (loginBox && collapsedLoginBox) {
      expect(Math.abs(collapsedLoginBox.y - loginBox.y)).toBeLessThanOrEqual(1);
    }
    const openToggle = sideMenu.getByRole('button', {
      name: 'サイドメニューを開く',
    });
    await expect(openToggle).toHaveCSS('margin-top', '0px');
    await expect(openToggle).toHaveCSS('width', '24px');
    await expect(openToggle).toHaveCSS('height', '112px');
    await expect(openToggle).toHaveCSS('position', 'absolute');
    await expect(openToggle.locator('svg')).toHaveCount(1);
    const logoIconBox = await logo.locator('svg').boundingBox();
    const openToggleBox = await openToggle.boundingBox();
    const collapsedContentBox = await menuContent.boundingBox();
    expect(logoIconBox).not.toBeNull();
    expect(openToggleBox).not.toBeNull();
    expect(collapsedContentBox).not.toBeNull();
    if (logoIconBox && collapsedContentBox) {
      const logoCenterX = logoIconBox.x + logoIconBox.width / 2;
      const menuCenterX = collapsedContentBox.x + collapsedContentBox.width / 2;
      expect(Math.abs(logoCenterX - menuCenterX)).toBeLessThanOrEqual(1);
    }
    if (openToggleBox && collapsedMenuBox) {
      const menuRight = collapsedMenuBox.x + collapsedMenuBox.width;
      expect(Math.abs(openToggleBox.x - menuRight)).toBeLessThanOrEqual(1);
      expect(openToggleBox.x + openToggleBox.width).toBeGreaterThan(menuRight);
    }
    const iconBoxesAfter = await navIcons.evaluateAll((icons) =>
      icons.map((icon) => {
        const { x, y } = icon.getBoundingClientRect();
        return { x, y };
      }),
    );
    expect(iconBoxesAfter).toHaveLength(iconBoxesBefore.length);
    for (const [index, after] of iconBoxesAfter.entries()) {
      const before = iconBoxesBefore[index];
      expect(before).toBeDefined();
      if (before) {
        expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
      }
    }
    await expect(
      sideMenu.getByRole('link', { name: 'サービスについて' }),
    ).toHaveCount(0);
    await expect(list.listPane).toBeVisible();
    await expect(detail.closeControl).toBeVisible();
    const expandedLeftWidth = (await list.listPane.boundingBox())?.width;
    const expandedRightWidth = (await detail.pane.boundingBox())?.width;
    expect(
      (expandedLeftWidth ?? 0) + (expandedRightWidth ?? 0),
    ).toBeGreaterThanOrEqual(1000);

    await page.getByRole('button', { name: 'サイドメニューを開く' }).click();
    await expect(list.listPane).not.toBeVisible();
    await expect(detail.backControl).toBeVisible();
  });

  test('直URLとリロードでは単独ページを表示する', async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto();
    const href = await list.scenarioCards.first().getAttribute('href');
    expect(href).toMatch(/^\/scenarios\/01[A-Za-z0-9]{24}/);
    const pathname = new URL(href ?? '', 'http://localhost').pathname;

    await page.goto(pathname);
    await expect(detail.pane).toBeVisible();
    await expect(list.listPane).not.toBeVisible();
    await expect(detail.toc).toBeVisible();
    await expect(detail.backControl).toBeVisible();

    await page.reload();
    await expect(detail.pane).toBeVisible();
    await expect(list.listPane).not.toBeVisible();
    await expect(detail.toc).toBeVisible();
    await detail.backControl.click();
    await expect(page).toHaveURL(/\/scenarios(?:\?.*)?$/);
  });

  test('条件付き詳細URLをリロードしても戻り先の検索条件を保つ', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto('?sort=oldest');
    const href = await list.scenarioCards.first().getAttribute('href');
    expect(href).toContain('returnTo=');

    await page.goto(href ?? '/scenarios');
    await page.reload();
    await expect(detail.pane).toBeVisible();
    await expect(list.listPane).not.toBeVisible();
    await detail.backControl.click();
    await expect(page).toHaveURL(/\/scenarios\?sort=oldest$/);
    await expect(list.sortTrigger).toContainText('古い順');
  });

  test('ブラウザの戻る・進むで検索条件と2ペイン表示を復元する', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto('?sort=oldest');
    await expect(list.sortTrigger).toContainText('古い順');
    await list.clickScenarioCard();
    await expect(detail.pane).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/scenarios\?sort=oldest$/);
    await expect(list.sortTrigger).toContainText('古い順');

    await page.goForward();
    await expect(detail.pane).toBeVisible();
    await expect(list.listPane).toBeVisible();
  });

  test('閉じた後も検索、追加読込、スクロール、発火元フォーカスを保持する', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1360, height: 900 });

    // 既存の実データ1件をもとに一覧APIだけ40件へ拡張し、データ量に依存せず
    // 追加読込と一覧ペイン内スクロールの復元を検証する。
    const response = await request.get(
      '/api/scenarios/search?limit=1&offset=0',
    );
    expect(response.ok()).toBeTruthy();
    const result = (await response.json()) as {
      scenarios: { scenarioId: string }[];
    };
    test.skip(result.scenarios.length === 0, '検証用シナリオが存在しない');
    const source = result.scenarios[0];
    if (!source) return;

    const scenarios = Array.from({ length: 40 }, (_, index) => ({
      ...source,
      scenarioId:
        index === 5
          ? source.scenarioId
          : `01${String(index).padStart(24, '0')}`,
    }));
    await page.route('**/api/scenarios/search?**', async (route) => {
      const offset = Number(
        new URL(route.request().url()).searchParams.get('offset') ?? 0,
      );
      await route.fulfill({
        json: {
          scenarios: scenarios.slice(offset, offset + 20),
          totalCount: 40,
        },
      });
    });

    const list = new ScenariosPage(page);
    const detail = new ScenarioDetailPage(page);
    await list.goto();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/scenarios/search') &&
          new URL(response.url()).searchParams.get('q') === '状態保持テスト',
      ),
      list.search('状態保持テスト'),
    ]);
    await expect(page).toHaveURL(/q=/);
    await expect(list.scenarioCards).toHaveCount(20);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/scenarios/search') &&
          new URL(response.url()).searchParams.get('sort') === 'oldest',
      ),
      list.selectSort('古い順'),
    ]);
    await expect(page).toHaveURL(/sort=oldest/);
    await expect(list.scenarioCards).toHaveCount(20);
    const listUrl = page.url();

    await list.loadMoreButton.click();
    await expect(list.scenarioCards).toHaveCount(40);
    const sourceCard = list.scenarioCards.nth(5);
    await sourceCard.scrollIntoViewIfNeeded();
    const scrollTop = await list.listPane.evaluate(
      (element) => element.scrollTop,
    );
    expect(scrollTop).toBeGreaterThan(0);

    await sourceCard.click();
    await expect(detail.pane).toBeVisible();
    await expect(list.scenarioCards).toHaveCount(40);
    await expect
      .poll(async () =>
        list.listPane.evaluate(
          (element, expectedScrollTop) =>
            Math.abs(element.scrollTop - expectedScrollTop),
          scrollTop,
        ),
      )
      .toBeLessThan(5);
    await detail.closeControl.click();
    await expect(page).toHaveURL(listUrl);
    await expect(list.scenarioCards).toHaveCount(40);
    await expect
      .poll(async () =>
        list.listPane.evaluate(
          (element, expectedScrollTop) =>
            Math.abs(element.scrollTop - expectedScrollTop),
          scrollTop,
        ),
      )
      .toBeLessThan(5);
    await expect(sourceCard).toBeFocused();
  });
});
