# E2Eテスト拡充計画

## Context

現在のE2Eテストは43テスト（6ファイル）で、シナリオ検索・詳細・フィルター・インポート機能のみをカバーしている。セッション一覧、ホーム、プロフィール、セッション作成、シナリオ作成など実装済みの主要機能にE2Eテストがない。約52テストを追加し、合計約95テストを目指す。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| ページロード待機 | `waitForLoadState('domcontentloaded')` を使用（`networkidle` 禁止） | Turbopack の HMR WebSocket が常時接続を維持するため |
| レスポンシブ要素の選択 | PC/SP両対応の要素は `:visible` 疑似セレクタで選択 | 同一 placeholder が2つ存在するケースへの対応 |
| CSS transform非表示の検証 | `not.toBeInViewport()` で検証 | `toBeHidden()` は `transform: translateY(100%)` を検知できない |
| a11yテストスコープ | `AxeBuilder({ page }).include('header').include('main').include('footer').disableRules(['color-contrast'])` | agentation ツールバー等の開発ツールを除外 |
| デバイス別テスト分岐 | `test.skip(testInfo.project.name === '...')` | PC/SP固有テストの制御 |
| 環境変数依存テスト | `test.skip(!envVar, '...')` でスキップ | CI/ローカルの差異を吸収 |

## 前提条件

- 事前実装: GlobalHeader のアクティブリンクに `aria-current="page"` を追加する
  - 対象ファイル: `src/components/blocks/GlobalHeader/index.tsx`
  - 変更内容: `navLink` の `active` 状態に `aria-current="page"` 属性を付与
  - ```tsx
    <Link href={href} aria-current={active ? 'page' : undefined} className={styles.navLink({ active })}>
    ```
  - 理由: WCAG 2.1 AA準拠。ナビゲーションテスト（Step 1-5）の `aria-current` 検証に必要。プロジェクト内では `pagination.tsx` で同様のパターンを使用済み
- データ: テスト環境にセッションのシードデータが存在すること

---

## Batch 1: 公開ページ（認証不要）

### Step 1-1. セッション公開卓テスト — `e2e/sessions/public.spec.ts`（5テスト）

新規Page Object: `e2e/pages/sessions-page.ts`（`BasePage`継承）

| テストケース | 検証内容 |
|---|---|
| セッション一覧ページが表示される | title `/セッション/` |
| デフォルトで「公開卓を探す」タブがアクティブ | `tab=public` のボタンが active |
| セッションカードが表示される | カード要素存在 |
| 検索結果の件数が表示される | `/\d+件/` テキスト |
| ソートを変更するとURLに反映される | `?publicSort=` |

※ 未認証時のタブ制限は `<Link><button disabled>` 構造のため `disabled` 属性がナビゲーションを防止しない。実際のユーザー操作結果（LoginPrompt表示）は Step 1-2 で検証する。

### Step 1-2. タブナビゲーション — `e2e/sessions/tabs.spec.ts`（4テスト）

| テストケース | 検証内容 |
|---|---|
| 「公開卓を探す」タブでURLにtab=publicが含まれる | URL検証 |
| 未認証時「参加予定」クリックでLoginPromptが表示される | "ログインが必要" テキスト |
| 未認証時「参加履歴」クリックでLoginPromptが表示される | "ログインが必要" テキスト |
| URLパラメータ `?tab=public` でタブが復元される | ページリロード後の状態 |

### Step 1-3. 認証リダイレクト拡充 — `e2e/redirect.spec.ts`（3テスト）

既存の `import-redirect.spec.ts` と同パターン。以下のページで `redirect('/')` を検証：

- `/profile` → `/`
- `/scenarios/new` → `/`
- `/sessions/new` → `/`

※ `/home` は `return null` のため redirect しない（テスト対象外）
※ `/scenarios/import` は既存テストでカバー済み

### Step 1-4. a11y テスト追加 — `e2e/smoke.spec.ts`（2テスト）+ 既存スコープ統一

既存ファイルに追加：
- セッション一覧ページ (`/sessions`) にa11y違反がない
- シナリオ詳細ページ (`/scenarios/[既存ID]`) にa11y違反がない

既存テストの修正：
- ランディングページのa11yテストのスコープを `.include('main')` から `.include('header').include('main').include('footer')` に統一する（新規テストとスコープを揃える）

### Step 1-5. グローバルナビゲーション — `e2e/navigation.spec.ts`（5テスト）

| テストケース | 検証内容 |
|---|---|
| ヘッダーロゴがリンクとして存在する | href 検証 |
| 「シナリオ」ナビリンクが `/scenarios` に遷移する | ナビゲーション |
| 「セッション」ナビリンクが `/sessions` に遷移する | ナビゲーション |
| 未認証時にログインボタンが表示される | ボタン存在 |
| アクティブなナビリンクが `aria-current` を持つ | 属性検証 |

## Batch 2: 認証必須ページ（読み取りのみ）

### Step 2-1. ホームダッシュボード — `e2e/auth/home.spec.ts`（6テスト）

新規Page Object: `e2e/pages/home-page.ts`

| テストケース | 検証内容 |
|---|---|
| ページが表示される | title `/ホーム/` |
| ウェルカムメッセージが表示される | `/ようこそ/` テキスト（テストユーザーに `full_name` が設定されていること前提） |
| 「参加予定のセッション」セクションが表示される | h2 見出し |
| 「新着シナリオ」セクションが表示される | h2 見出し |
| 「すべて見る」リンクがセッション一覧に遷移する | href `/sessions?tab=upcoming` |
| アクセシビリティ違反がない | AxeBuilder |

### Step 2-2. セッション認証済み機能 — `e2e/auth/sessions.spec.ts`（7テスト）

| テストケース | 検証内容 |
|---|---|
| 「参加予定」タブがクリック可能 | `disabled` でない |
| 「参加予定」タブ切替でコンテンツが表示される | タブコンテンツ存在 |
| 「参加履歴」タブ切替でコンテンツが表示される | タブコンテンツ存在 |
| 「参加予定」タブでソートが変更可能 | ソートUI存在 |
| セッション作成ページが表示される | title `/新規セッション/` |
| セッション作成に必須フィールドが存在する | フォーム要素存在 |
| セッション作成ページのa11y違反がない | AxeBuilder |

### Step 2-3. プロフィール — `e2e/auth/profile.spec.ts`（6テスト）

新規Page Object: `e2e/pages/profile-page.ts`

| テストケース | 検証内容 |
|---|---|
| プロフィール設定ページが表示される | title `/プロフィール設定/` |
| フォームフィールドが表示される | ユーザーID、表示名、自己紹介 |
| 現在のプロフィール情報がプリセットされている | input.value が空でない |
| 「公開プロフィールを見る」リンクが存在する | リンク存在 |
| 公開プロフィールに遷移できる | `/users/[id]` への遷移 |
| アクセシビリティ違反がない | AxeBuilder |

### Step 2-4. シナリオ詳細の認証済みアクション — `e2e/auth/scenario-detail-actions.spec.ts`（5テスト）

既存 `ScenarioDetailPage` にお気に入り・FAB用ロケータを追加：

| テストケース | 検証内容 |
|---|---|
| お気に入りボタンが表示される | ボタン存在 |
| FABメニューボタンが表示される | ボタン存在 |
| FABメニューを開くとメニュー項目が表示される | メニュー項目存在 |
| FABメニュー外クリックでメニューが閉じる | メニュー非表示 |
| アクセシビリティ違反がない | AxeBuilder |

### Step 2-5. 認証済みナビゲーション — `e2e/auth/navigation.spec.ts`（3テスト）

| テストケース | 検証内容 |
|---|---|
| プロフィールアバターが表示される | アバター要素存在 |
| アバタークリックでプロフィールに遷移する | `/profile` への遷移 |
| ログインボタンの代わりにアバターが表示される | ログインボタン非存在 |

## Batch 3: CUD操作テスト（DB書き込みあり）

CI環境でDBクリーンアップを機能させるため、GitHub Actions secrets に `SUPABASE_SERVICE_ROLE_KEY` を追加すること。`.github/workflows/test.yml` の `env` セクションにも `SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}` を追記する。Service Role Key が設定されていない環境ではクリーンアップ処理はスキップされる。

### Step 3-1. セッション作成 — `e2e/auth/session-create.spec.ts`（4テスト）

新規Page Object: `e2e/pages/session-new-page.ts`

| テストケース | 検証内容 |
|---|---|
| セッション名が空で送信するとバリデーションエラー | エラー表示 |
| 募集文が空で送信するとバリデーションエラー | エラー表示 |
| 最小入力で作成するとリダイレクトされる | `/sessions/` URLパターン |
| 作成後にセッション詳細ページが表示される | ページ遷移確認 |

データ管理: セッション名に `[E2E] ${Date.now()}` プレフィックスを付与。`afterAll` で Supabase service role key を使ったクリーンアップ（環境変数がない場合はスキップ）。

### Step 3-2. プロフィール編集 — `e2e/auth/profile-edit.spec.ts`（2テスト）

| テストケース | 検証内容 |
|---|---|
| 表示名を変更して送信すると成功メッセージが表示される | "更新" テキスト |
| 空のユーザーIDで送信するとバリデーションエラー | エラー表示 |

データ管理: `beforeAll` で元の値を保存、`afterAll` で復元（テストではなくフックで処理）。

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---|---|
| `e2e/pages/sessions-page.ts` | Page Object: セッション一覧（3タブ、検索、フィルタ） |
| `e2e/pages/home-page.ts` | Page Object: ホームダッシュボード |
| `e2e/pages/profile-page.ts` | Page Object: プロフィール編集 + 公開プロフィール |
| `e2e/pages/session-new-page.ts` | Page Object: セッション作成フォーム |
| `e2e/sessions/public.spec.ts` | テスト: セッション公開卓（5テスト） |
| `e2e/sessions/tabs.spec.ts` | テスト: タブナビゲーション（4テスト） |
| `e2e/redirect.spec.ts` | テスト: 認証リダイレクト（3テスト） |
| `e2e/navigation.spec.ts` | テスト: グローバルナビゲーション（5テスト） |
| `e2e/auth/home.spec.ts` | テスト: ホームダッシュボード（6テスト） |
| `e2e/auth/sessions.spec.ts` | テスト: セッション認証済み機能（7テスト） |
| `e2e/auth/profile.spec.ts` | テスト: プロフィール（6テスト） |
| `e2e/auth/scenario-detail-actions.spec.ts` | テスト: シナリオ詳細の認証済みアクション（5テスト） |
| `e2e/auth/navigation.spec.ts` | テスト: 認証済みナビゲーション（3テスト） |
| `e2e/auth/session-create.spec.ts` | テスト: セッション作成（4テスト） |
| `e2e/auth/profile-edit.spec.ts` | テスト: プロフィール編集（2テスト） |
| `e2e/helpers/cleanup.ts` | DB書込テスト用クリーンアップ |

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/components/blocks/GlobalHeader/index.tsx` | `aria-current="page"` 追加 |
| `e2e/smoke.spec.ts` | a11yテスト2件追加 + スコープ統一 |
| `e2e/pages/scenario-detail-page.ts` | お気に入り・FABロケータ追加 |

## 今後の拡張（次バッチ候補）

本計画の対象外とした実装済みページ。テストカバレッジの拡大時に優先的に対応する。

| ページ | パス | 備考 |
|--------|------|------|
| セッション詳細 | `/sessions/[id]` | 参加申請、日程調整等の重要機能あり。CUD操作テストも含まれる |
| ユーザー一覧 | `/users` | 一覧表示・検索 |
| ユーザー詳細（公開プロフィール） | `/users/[id]` | プロフィール表示 |
| スケジュール | `/schedules` | 日程調整機能 |

## 検証方法

### 自動テスト

```bash
# 全E2Eテスト実行
pnpm exec playwright test

# 特定ファイルのみ実行
pnpm exec playwright test e2e/sessions/public.spec.ts

# 認証テストのみ
pnpm exec playwright test --project=chromium-auth

# UIモードでデバッグ
pnpm exec playwright test --ui
```
