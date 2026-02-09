# E2Eテスト基盤構築計画

## Context

### 背景
scenario-managerのE2Eテストは最小限の状態：
- Playwrightはインストール済み（`@playwright/test ^1.57.0`）
- テストは2ファイルのみ（`example.spec.ts` + `scenarios/search.spec.ts`）
- `package.json`にテスト実行スクリプトなし
- CI/CDでテスト未実行（デプロイのみ）
- 既存テストに `if (isVisible())` でスキップする問題パターンあり

### 目的
公開ページ（認証不要）を対象とした安定したE2Eテスト基盤を構築し、リグレッション検知を可能にする。

### 設計判断
- **認証**: 初期フェーズでは不要。将来的にSupabaseセッション注入で対応
- **テストデータ**: 既存DBデータを使った読み取り専用テスト
- **スコープ**: 公開ページ（ランディング、シナリオ検索/詳細）。`/sessions` は Middleware で認証保護されているため Phase 2 で対応
- **Page Object**: テストが3件以上あるページのみ導入

### 前提条件
- **CI環境のDB接続先**: GitHub Secrets の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` は**本番DB**を指す（Supabase RLS により Anon Key では読み取りのみ可能）
- **最低限のテストデータ**: シナリオが最低1件登録されていること（「シナリオカードが表示される」テストの前提）
- **DB状態への依存リスク**: テストは DB データの存在を前提とするため、データが空の場合は一部テストが失敗する。将来的にテスト用シードデータの仕組みを検討

---

## Step 1: package.json・.gitignore の更新

### package.json

`"scripts"` セクションに以下を追加（`"build-storybook"` の後）:

```json
"vitest": "vitest run",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed"
```

### 追加依存

```bash
pnpm add -D @axe-core/playwright
```

### .gitignore

以下のエントリを追加（Playwrightのアーティファクト）:

```
# Playwright
playwright-report/
test-results/
```

---

## Step 2: Playwright設定の改善

**ファイル**: `playwright.config.ts`

現在の設定をベースに、タイムアウトとレポーターを追加。

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * E2Eテスト用のPlaywright設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: process.env.CI ? [['list'], ['html']] : 'html',

  /* テスト全体のタイムアウト */
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* 個々のアクション（click, fill等）のタイムアウト */
    actionTimeout: 5_000,
  },

  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: {
    command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

**変更点まとめ**:
- `timeout: 30_000` 追加（テスト全体）
- `actionTimeout: 5_000` 追加（個別アクション）
- `expect.timeout: 10_000` 追加（アサーション）
- `reporter` をCI環境で `list` + `html` に分岐
- `webServer.command` をCI環境では `pnpm build && pnpm start`（プロダクションビルド）に分岐
- `webServer.timeout: 120_000` 追加（CI環境のビルド時間を考慮）
- `mobile-chrome` プロジェクト追加（Pixel 7 ビューポートでレスポンシブ検証）

---

## Step 3: example.spec.ts を削除

**ファイル**: `e2e/example.spec.ts` → 削除

テンプレートファイルは不要。スモークテストが代替する。

---

## Step 4: スモークテスト作成

**ファイル**: `e2e/smoke.spec.ts` (新規)

全公開ページが正常に表示されることを確認する最小テスト。

```typescript
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * 全公開ページのスモークテスト
 * 各ページが正常にレンダリングされ、主要要素が表示されることを確認する
 */
test.describe('スモークテスト', () => {
  test('ランディングページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/シナプレ管理くん/);
  });

  test('シナリオ一覧ページが表示される', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('アクセシビリティ', () => {
  test('ランディングページにa11y違反がない', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('シナリオ一覧ページにa11y違反がない', async ({ page }) => {
    await page.goto('/scenarios');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

**追加依存**: `@axe-core/playwright` を devDependencies にインストール

---

## Step 5: BasePage - Page Object基底クラス作成

**ファイル**: `e2e/pages/base-page.ts` (新規)

全Page Objectの基底クラス。共通のナビゲーション・待機処理を集約する。

```typescript
import { type Page } from '@playwright/test';

/**
 * Page Objectの基底クラス
 */
export abstract class BasePage {
  constructor(readonly page: Page) {}

  /** ページのURLに遷移して読み込みを待つ */
  protected async navigate(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }
}
```

---

## Step 6: ScenariosPage - Page Object作成

**ファイル**: `e2e/pages/scenarios-page.ts` (新規)

シナリオ一覧ページのロケータとアクションを集約する。

```typescript
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * シナリオ一覧ページのPage Object
 */
export class ScenariosPage extends BasePage {
  // ロケータ
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly scenarioCards: Locator;
  readonly emptyMessage: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1');
    this.searchInput = page.getByPlaceholder('シナリオを検索...');
    this.searchButton = page.getByRole('button', { name: /検索/i });
    this.scenarioCards = page.locator('[data-testid="scenario-card"]');
    this.emptyMessage = page.getByText(
      '条件に一致するシナリオが見つかりませんでした',
    );
    // 仮設定: Ark UI Select の ARIA 属性を DevTools で確認後に調整
    this.sortSelect = page.getByRole('combobox', { name: /ソート|並び替え/i });
  }

  /** シナリオ一覧ページに遷移 */
  async goto() {
    await this.navigate('/scenarios');
  }

  /** キーワードで検索を実行 */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    if (await this.searchButton.isVisible()) {
      await this.searchButton.click();
    } else {
      await this.searchInput.press('Enter');
    }
  }

  /** 指定インデックスのシナリオカードをクリック */
  async clickScenarioCard(index = 0) {
    await this.scenarioCards.nth(index).click();
  }

  /** シナリオカードの数を取得 */
  async getCardCount(): Promise<number> {
    return this.scenarioCards.count();
  }
}
```

**注意**: `sortSelect` のロケータは Ark UI の `Select` コンポーネント依存のため、実装時に DevTools で実際の ARIA 属性を確認して調整すること。

---

## Step 7: シナリオ検索テストの改善

**ファイル**: `e2e/scenarios/search.spec.ts` (既存を全面書き換え)

既存の問題:
- `if (await element.isVisible())` でテストをスキップ → アサーションに変更
- Page Object未使用 → `ScenariosPage`を使用

```typescript
import { expect, test } from '@playwright/test';
import { ScenariosPage } from '../pages/scenarios-page';

/**
 * シナリオ検索機能のE2Eテスト
 * 対象要件: requirements-v1.md 5. シナリオ検索
 */
test.describe('シナリオ検索', () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }) => {
    scenariosPage = new ScenariosPage(page);
    await scenariosPage.goto();
  });

  test('シナリオ一覧ページが表示される', async () => {
    await expect(scenariosPage.heading).toBeVisible();
  });

  test('シナリオカードが表示される', async () => {
    // 既存データがあるため、少なくとも1件は表示される
    await expect(scenariosPage.scenarioCards.first()).toBeVisible();
  });

  test('シナリオ名で検索できる', async ({ page }) => {
    await expect(scenariosPage.searchInput).toBeVisible();

    // TODO(human): 既存DBに確実に存在するシナリオ名を指定
    await scenariosPage.search('テスト');

    // URLにクエリパラメータが反映される
    await expect(page).toHaveURL(/q=/);
  });

  test('検索結果が0件の場合、空メッセージが表示される', async () => {
    await scenariosPage.search('存在しないシナリオ_E2E_12345');
    await expect(scenariosPage.emptyMessage).toBeVisible();
  });

  test('シナリオカードをクリックすると詳細ページに遷移する', async ({
    page,
  }) => {
    await scenariosPage.clickScenarioCard(0);
    await expect(page).toHaveURL(/\/scenarios\/[A-Za-z0-9]+$/);
  });
});
```

**補足**:
- 「シナリオ名で検索できる」テストの検索キーワードは、既存DBデータに合わせて調整が必要
- `data-testid="scenario-card"` が実装されていない場合、`ScenariosPage`のロケータを `article` や他のセレクタに変更

---

## Step 8: ScenarioDetailPage - Page Object作成

**ファイル**: `e2e/pages/scenario-detail-page.ts` (新規)

```typescript
import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * シナリオ詳細ページのPage Object
 */
export class ScenarioDetailPage extends BasePage {
  readonly title: Locator;
  readonly systemName: Locator;
  readonly playerCount: Locator;
  readonly playTime: Locator;
  readonly tags: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('h1');
    this.systemName = page.getByText(/システム/).locator('..');
    this.playerCount = page.getByText(/人/);
    this.playTime = page.getByText(/時間|分/);
    this.tags = page.locator('[data-scope="tag"]');
    this.backLink = page.getByRole('link', { name: /戻る|一覧/i });
  }

  /** シナリオ詳細ページに直接遷移 */
  async goto(scenarioId: string) {
    await this.navigate(`/scenarios/${scenarioId}`);
  }
}
```

**注意**: ロケータはテキストマッチングベースの仮設定。実装時に DevTools で実際の DOM 構造を確認し、より安定したロケータに調整すること。

---

## Step 9: シナリオ詳細テスト作成

**ファイル**: `e2e/scenarios/detail.spec.ts` (新規)

```typescript
import { expect, test } from '@playwright/test';
import { ScenariosPage } from '../pages/scenarios-page';
import { ScenarioDetailPage } from '../pages/scenario-detail-page';

/**
 * シナリオ詳細ページのE2Eテスト
 */
test.describe('シナリオ詳細', () => {
  test('一覧からシナリオ詳細に遷移して情報が表示される', async ({ page }) => {
    const scenariosPage = new ScenariosPage(page);
    const detailPage = new ScenarioDetailPage(page);

    // 一覧ページから最初のカードをクリック
    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);

    // 詳細ページのURLパターンを確認
    await expect(page).toHaveURL(/\/scenarios\/[A-Za-z0-9]+$/);

    // タイトルが表示される
    await expect(detailPage.title).toBeVisible();
  });

  test('シナリオの基本情報が表示される', async ({ page }) => {
    const scenariosPage = new ScenariosPage(page);
    const detailPage = new ScenarioDetailPage(page);

    await scenariosPage.goto();
    await scenariosPage.clickScenarioCard(0);

    // タイトルと主要情報が表示される
    await expect(detailPage.title).not.toBeEmpty();
    await expect(detailPage.playerCount).toBeVisible();
  });
});
```

---

## Step 10: GitHub Actions CI ワークフロー作成

**ファイル**: `.github/workflows/test.yml` (新規)

```yaml
name: Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-unit:
    name: Lint & Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm prepare
      - run: pnpm check
      - run: pnpm vitest

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint-and-unit
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm prepare
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: playwright-
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**前提**:
- GitHub Secretsに `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定済みであること（本番DBを指す）
- E2Eテストは既存DBの読み取りのみなので、`SUPABASE_SERVICE_ROLE_KEY` は不要
- 本番DBにシナリオデータが最低1件存在すること

---

## ファイル一覧

| ファイル | 操作 | Step |
|---------|------|------|
| `package.json` | 編集（スクリプト4行追加） | 1 |
| `.gitignore` | 編集（Playwrightアーティファクト追加） | 1 |
| `playwright.config.ts` | 編集（タイムアウト・レポーター追加） | 2 |
| `e2e/example.spec.ts` | 削除 | 3 |
| `e2e/smoke.spec.ts` | 新規作成 | 4 |
| `e2e/pages/base-page.ts` | 新規作成 | 5 |
| `e2e/pages/scenarios-page.ts` | 新規作成 | 6 |
| `e2e/scenarios/search.spec.ts` | 全面書き換え | 7 |
| `e2e/pages/scenario-detail-page.ts` | 新規作成 | 8 |
| `e2e/scenarios/detail.spec.ts` | 新規作成 | 9 |
| `.github/workflows/test.yml` | 新規作成 | 10 |

---

## 検証方法

### ローカル検証
1. `pnpm dev` で開発サーバーを起動（または既に起動済みならそのまま）
2. `pnpm test:e2e` で全E2Eテストを実行 → 全パス確認
3. `pnpm test:e2e:headed` でブラウザ上の動作を目視確認
4. `pnpm vitest` で既存ユニットテストが壊れていないことを確認
5. `pnpm check` でlintエラーなし確認

### Page Objectロケータの調整
Step 6, 8のPage Objectのロケータは仮設定。以下の手順で確定する:
1. `pnpm test:e2e:headed` で実行し、失敗するテストを確認
2. ブラウザのDevToolsで実際のDOM構造を確認
3. ロケータを修正（`getByRole`, `getByTestId`, `getByText` など）
4. 必要に応じてコンポーネントに `data-testid` を追加

### CI検証
- テストブランチを作成してPRを開き、GitHub Actionsが正常に動作することを確認
- Secretsが未設定の場合、E2Eジョブは失敗する → Secrets設定後に再実行

---

## 将来の拡張（本計画のスコープ外）

- **認証テスト**: Supabase Admin APIでセッション注入 → 認証必須ページ（`/sessions`, `/home`, `/profile`）のテスト
- **書き込みテスト**: テストデータの作成/削除を含むCRUDフローテスト
- **ビジュアルリグレッション**: Playwright `toHaveScreenshot()` でスナップショット比較
- **パフォーマンステスト**: LCP, FID等の計測
