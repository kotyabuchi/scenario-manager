# シナリオ登録 E2Eテスト実装計画

## Context

`/scenarios/import`（URLインポート）のE2Eテストが未実装。
既存E2Eテスト4件は全て公開ページ用で、Playwright認証セットアップが存在しない。
認証基盤の構築 → Page Object → テストスペックの順で実装する。

---

## 前提条件: テストユーザー作成（手動）

インポートページは認証必須のため、Supabase上にテストユーザーが必要。

### 手順

1. **Supabase Dashboard > Authentication > Providers** で Email プロバイダーが有効であることを確認
2. **Authentication > Users > Add User** でテストユーザーを作成
   - Email: 任意（例: `e2e-test@scenario-manager.local`）
   - Password: 任意の安全なパスワード
   - Auto Confirm User: ON
3. 作成されたユーザーの **UUID** をコピー
4. **Table Editor > users** テーブルにレコードを挿入:
   - `user_id`: ULID（`01`で始まる26文字）を手動生成
   - `discord_id`: 上記でコピーした Supabase Auth UUID
   - `name`: `E2Eテストユーザー`
   - `role`: `MODERATOR`（レートリミット緩和のため）
5. `.env` に環境変数を追加:
   ```
   E2E_TEST_USER_EMAIL=e2e-test@scenario-manager.local
   E2E_TEST_USER_PASSWORD=<設定したパスワード>
   ```

> `discord_id` カラムは名前に反して Supabase Auth UUID を格納している（`getUserByDiscordId(authUser.id)` で使用）

---

## 実装ステップ

### Step 1: 認証ヘルパー作成

**ファイル**: `e2e/helpers/supabase-auth.ts`

Supabase SSR（v0.8.0）のCookie形式を再現するユーティリティ:
- `stringToBase64URL(str)` — `Buffer.from(str).toString('base64url')` 相当
- `buildSupabaseCookies(supabaseUrl, session)` — セッションからCookie配列を構築
  - Cookie名: `sb-<projectRef>-auth-token`
  - Cookie値: `base64-<base64url_encoded_session_json>`
  - 3180バイト超の場合はチャンク化（`.0`, `.1`, ...）
  - Options: `path: "/", sameSite: "Lax", httpOnly: false`

### Step 2: Playwright Auth Setup

**ファイル**: `e2e/auth.setup.ts`

```
1. 環境変数チェック（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, E2E_TEST_USER_EMAIL, E2E_TEST_USER_PASSWORD）
   - いずれかが未設定の場合は test.skip() でスキップ（エラーにしない）
   - CI で secrets 未設定でも安全にスキップされる
2. @supabase/supabase-js で signInWithPassword
3. buildSupabaseCookies() でCookie構築
4. page.context().addCookies() でブラウザに設定
5. /scenarios/import に遷移して認証確認（リダイレクトされないこと）
6. storageState を e2e/.auth/user.json に保存
```

### Step 3: Playwright Config 更新

**ファイル**: `playwright.config.ts`

変更点:
- `auth-setup` プロジェクトを追加（`testMatch: /auth\.setup\.ts/`）
- 既存の `chromium` / `mobile-chrome`（公開ページ用）に `testIgnore` を追加:
  - `testIgnore: [/auth/]`
  - パターン `/auth/` で `auth.setup.ts` と `e2e/auth/` ディレクトリ配下を一括除外
  - 今後認証必須テストを追加する際も `e2e/auth/` に配置するだけで自動除外される
- `chromium-auth` / `mobile-chrome-auth` を新規追加
  - `storageState: 'e2e/.auth/user.json'`
  - `dependencies: ['auth-setup']`
  - `testDir: 'e2e/auth'`（認証テスト専用ディレクトリを指定）
- `.gitignore` に `e2e/.auth/` を追加

### Step 4: Import Page Object

**ファイル**: `e2e/pages/import-page.ts`

`BasePage` を継承。主要ロケータ:

| ロケータ | セレクタ | 用途 |
|---------|---------|------|
| `urlInput` | `#url` | URL入力フィールド |
| `submitButton` | `getByRole('button', { name: '取り込む' })` | URL送信ボタン |
| `manualInputLink` | `getByRole('link', { name: /手動で入力/ })` | /scenarios/new リンク |
| `supportedSitesText` | `getByText('対応サイト: Booth, TALTO')` | 対応サイト表示 |
| `sourceBanner` | `getByText(/インポート元:/)` | ソース情報バナー（Step 2） |
| `nameInput` | `#name` | シナリオ名 |
| `authorInput` | `#author` | 作者名 |
| `descriptionTextarea` | `#description` | 概要文 |
| `backButton` | `getByRole('button', { name: '戻る' })` | 戻るボタン |
| `registerButton` | `getByRole('button', { name: '登録する' })` | 登録ボタン |

メソッド:
- `goto()` — `/scenarios/import` に遷移
- `submitUrl(url)` — URL入力 → 送信
- `waitForFormStep()` — Step 2表示を待機

### Step 5: 未認証リダイレクトテスト

**ファイル**: `e2e/scenarios/import-redirect.spec.ts`

認証なしプロジェクトで実行。storageState を使わない。

| テスト | 内容 |
|-------|------|
| 未認証リダイレクト | `/scenarios/import` → `page.waitForURL('/')` で明示的にリダイレクト完了を待機し、URLが `/` であることを確認 |

### Step 6: インポートページ E2Eテスト

**ファイル**: `e2e/auth/import.spec.ts`（認証済みプロジェクトで実行、`e2e/auth/` ディレクトリに配置）

#### Tier 1: ページ構造・バリデーション（外部サービス不要）

| テスト | 検証内容 |
|-------|---------|
| ページタイトル | `<title>` に「シナリオをインポート」が含まれる |
| ページヘッダー表示 | 見出しが表示される |
| URL入力フィールド表示 | `#url` が可視 |
| 取り込むボタン表示 | ボタンが可視 |
| 対応サイト情報表示 | "対応サイト: Booth, TALTO" テキストが可視 |
| 手動入力リンク表示 | リンクが可視 |
| 手動入力リンク遷移 | クリック → `/scenarios/new` に遷移 |
| 空URL送信エラー | "URLを入力してください" エラー表示 |
| 不正URL送信エラー | "有効なURLを入力してください" エラー表示 |
| a11y | AxeBuilder で main 要素をスキャン |

#### Tier 2: URL解析フロー（外部サービス依存、条件付き実行）

`E2E_TEST_BOOTH_URL` / `E2E_TEST_TALTO_URL` 環境変数が未設定の場合は `test.skip()`。
`retries: 2` で外部サービスの一時的な障害に対応。
各テストで `test.slow()` を使用してタイムアウトを3倍に延長（外部サービスへのネットワーク往復を含むため）。

| テスト | 検証内容 |
|-------|---------|
| Booth URL解析 → フォーム表示 | ソースバナーに "Booth" 表示、`nameInput` が空でないこと（値の具体的内容は外部サイト依存のため検証しない） |
| TALTO URL解析 → フォーム表示 | ソースバナーに "TALTO" 表示、`nameInput` が空でないこと |
| 戻るボタン | フォーム → URL入力ステップに戻れる |
| readOnlyフィールド | 高信頼度フィールドに `readOnly` 属性が付与 |

**アサーション粒度の指針**: 外部サイトのHTML変更で壊れやすいため、フィールドの**値の具体的内容**は検証せず、**値が存在すること（空でないこと）** のみを検証する。ソースバナーのサイト名表示（"Booth" / "TALTO"）はアプリ側のロジックで生成されるため安定的に検証可能。

### Step 7: CI ワークフロー更新

**ファイル**: `.github/workflows/test.yml`

認証テストを CI で段階的に有効化できるようにする:

1. `pnpm test:e2e` の `env` に `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` を追加（GitHub Secrets から取得）
2. `auth.setup.ts` は環境変数が未設定の場合 `test.skip()` でスキップする設計のため、secrets 未設定でも CI は失敗しない
3. 認証テストを有効化するには GitHub Settings > Secrets に `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` を追加するだけでよい

```yaml
- run: pnpm test:e2e
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
```

### Step 8: .env.example 更新

```
# E2E Test User
E2E_TEST_USER_EMAIL=
E2E_TEST_USER_PASSWORD=

# E2E Test URLs (optional, for integration tests)
E2E_TEST_BOOTH_URL=
E2E_TEST_TALTO_URL=
```

---

## 対象ファイル一覧

| ファイル | 操作 | 内容 |
|---------|------|------|
| `e2e/helpers/supabase-auth.ts` | 新規 | Cookie構築ヘルパー |
| `e2e/auth.setup.ts` | 新規 | Playwright認証セットアップ |
| `e2e/pages/import-page.ts` | 新規 | Import Page Object |
| `e2e/scenarios/import-redirect.spec.ts` | 新規 | 未認証リダイレクトテスト（非認証プロジェクトで実行） |
| `e2e/auth/import.spec.ts` | 新規 | インポートE2Eテスト Tier 1 + Tier 2（認証プロジェクトで実行） |
| `playwright.config.ts` | 修正 | auth-setup + auth プロジェクト追加、非認証プロジェクトに testIgnore 追加 |
| `.github/workflows/test.yml` | 修正 | E2E認証用 secrets を env に追加 |
| `.gitignore` | 修正 | `e2e/.auth/` 追加 |
| `.env.example` | 修正 | E2E環境変数の説明追加 |

---

## 検証手順

```bash
# 1. 認証セットアップの動作確認
pnpm exec playwright test --project=auth-setup

# 2. 未認証リダイレクトテスト
pnpm exec playwright test import-redirect

# 3. Tier 1テスト（認証済み）
pnpm exec playwright test e2e/auth/import.spec.ts --project=chromium-auth

# 4. 全テスト（既存テストの回帰確認含む）
pnpm exec playwright test

# 5. デバッグ（UI モード）
pnpm exec playwright test e2e/auth/import.spec.ts --project=chromium-auth --ui
```

---

## リスクと対策

| リスク | 対策 |
|-------|------|
| 外部サービス障害でTier 2失敗 | `test.skip()` + `retries: 2`、CI では URL 環境変数を設定しないことでスキップ可能 |
| URL重複チェックで解析ブロック | 未登録のURLを使用。テストユーザーの role を MODERATOR に設定しレートリミット緩和 |
| Cookie形式の変更 | `@supabase/ssr` のバージョンアップ時に `supabase-auth.ts` の修正が必要。将来的に `@supabase/ssr` の内部関数（`createBrowserClient` 経由のCookie取得等）を利用できればヘルパーの保守が不要になる可能性があるため、実装時に調査する |
| 既存テストへの影響 | 非認証プロジェクトの `testIgnore` で認証必須テストを除外、認証プロジェクトの `testMatch` で対象を明示指定し完全分離 |
