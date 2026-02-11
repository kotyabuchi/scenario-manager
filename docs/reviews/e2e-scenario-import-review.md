# シナリオ登録 E2Eテスト実装計画 レビューレポート

> **反映ステータス**: 反映済み（2026-02-11）
> **反映内容**: 必須 3件 + 推奨 2件 + 検討 3件

> **レビュー日時**: 2026-02-11
> **対象ファイル**: `docs/plans/e2e-scenario-import.md`
> **総合評価**: B

## サマリー

認証基盤の新規構築からPage Object、テストスペックまで網羅的に設計された良質な計画。Supabase SSRのCookie形式を再現する認証ヘルパーのアプローチは技術的に妥当で、Tier 1/Tier 2の分離も外部依存のあるE2Eテストとして適切。ただし、Playwright Config のプロジェクト分離設計に不備があり、認証必須テストが非認証プロジェクトで誤実行される問題がある。また、CI ワークフローの更新が計画に含まれていない。

## 評価詳細

### 1. 技術的妥当性 OK

- Supabase SSR v0.8.0 のCookie形式（`sb-<projectRef>-auth-token`、`base64-` prefix + base64url エンコード、3180バイト超のチャンク化）を手動構築するアプローチは正確
- `signInWithPassword` → Cookie構築 → `storageState` 保存の流れは Playwright の認証パターンに沿っている
- `BasePage` を継承した Page Object パターンは既存の `ScenariosPage`, `ScenarioDetailPage` と一貫
- Tier 2 の `retries: 2` + `test.skip()` パターンは外部サービス依存テストの標準的なプラクティス

### 2. 網羅性・考慮漏れ WARN

**プロジェクト分離の不備**: `chromium` / `mobile-chrome` はデフォルトで `e2e/` 配下の全テストを実行する。`import.spec.ts`（認証必須）が `chromium` プロジェクトでも実行され、認証なしのため失敗する。計画では `chromium-auth` の `testMatch` は指定されているが、非認証プロジェクト側の `testIgnore` に `import.spec.ts` を追加する記述がない。

**CI ワークフロー未更新**: `.github/workflows/test.yml` に `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` の secrets が渡されていない。auth-setup が CI で動作しないため、認証テストが CI で全スキップまたは失敗する。CI で認証テストを実行するかスキップするかの方針を明示すべき。

**テストデータのライフサイクル**: Tier 2 テストはフォーム表示までで登録は行わないため問題は少ないが、将来 Tier 3（登録テスト）を追加する場合のクリーンアップ戦略が示されていない。

**環境変数名の齟齬**: Step 2 で「環境変数チェック（SUPABASE_URL, ANON_KEY）」と記載されているが、実際のプロジェクトでは `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`。混同を招く可能性がある。

### 3. セキュリティ OK

- テスト認証情報は `.env` ファイル（`.gitignore` で除外済み）と GitHub Secrets で管理
- MODERATOR ロールのテストユーザーはレートリミット緩和目的で適切。本番環境のMODERATOR権限と同じ動作なので、権限昇格リスクはない
- `httpOnly: false` は Supabase JS Client がブラウザからCookieを読む必要があるため妥当

### 4. UX・アクセシビリティ OK

- Tier 1 に AxeBuilder による a11y テストが含まれており、既存のスモークテストと同じ `include('main')` パターンを使用
- ページ構造（タイトル、見出し、リンク）の検証が網羅的

### 5. 保守性・拡張性 OK

- 認証ヘルパー (`supabase-auth.ts`) を分離しているため、他の認証必須ページのテスト追加時に再利用可能
- Page Object パターンにより、UI変更時の修正箇所が限定される
- Tier 分けにより、テストの実行速度と信頼性のバランスを段階的に管理できる

### 6. プロジェクト整合性 OK

- ファイル配置（`e2e/helpers/`, `e2e/pages/`, `e2e/scenarios/`）は既存構造に準拠
- `BasePage` の継承、`domcontentloaded` 待機（`navigate` メソッド）は既存パターンを踏襲
- AxeBuilder の使用方法は `smoke.spec.ts` と一貫

### 7. 実行可能性 WARN

- 手順は概ね具体的で実行可能
- ただし、Playwright Config の `testMatch` / `testIgnore` の具体的なパターン（正規表現）が一部不明確。`chromium-auth` の `testMatch` に具体的にどのパターンを指定するか（例: `/import\.spec\.ts/`）を明記すべき
- 検証手順は段階的で適切。ただし Step 1（auth-setup）の動作確認時に、環境変数が設定されていない場合のエラーメッセージが計画にない

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | `chromium` / `mobile-chrome` が `import.spec.ts` を誤実行する | 非認証プロジェクトの `testIgnore` に認証必須テストのパターンを追加。例: `testIgnore: [/auth\.setup\.ts/, /import\.spec\.ts/]`。または認証テストを `e2e/auth/` サブディレクトリに配置し、非認証プロジェクトの `testDir` や `testIgnore` でディレクトリ単位で除外する |
| 2 | 網羅性 | CI ワークフロー（`.github/workflows/test.yml`）の更新が計画にない | `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` を GitHub Secrets に追加し、`test.yml` の `env` に渡す。または CI では認証テストをスキップする方針を明記し、auth-setup が環境変数不足時にスキップする設計にする |
| 3 | 実行可能性 | Step 2 の環境変数名が実際と異なる（`SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL` 等） | 正確な変数名で記載する |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 保守性 | 認証テストが増えるたびに非認証プロジェクトの `testIgnore` を更新するのは保守負荷が高い | `e2e/auth/` ディレクトリを設け、認証必須テストはそこに配置。非認証プロジェクトは `testIgnore: [/auth/]` で一括除外する構成を推奨 |
| 2 | 網羅性 | Tier 2 で外部URLから取得したデータの具体的なアサーション内容が曖昧 | Booth/TALTO それぞれで確認するフィールド（name, author 等の存在）を明記する。外部サイトのHTML変更で壊れやすいので、アサーション粒度の指針を示す |
| 3 | 実行可能性 | `auth.setup.ts` で環境変数不足時の挙動が不明確 | `E2E_TEST_USER_EMAIL` 等が未設定の場合は `test.skip()` で明示的にスキップし、エラーではなくスキップとして処理する設計を推奨。CI で段階的に認証テストを有効化できる |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 保守性 | Supabase SSR のCookie形式はバージョンアップで変わる可能性がある（リスクに記載済み） | `@supabase/ssr` の内部関数を使えるか調査。直接 `createBrowserClient` 経由でCookieを取得できればヘルパーの保守が不要になる可能性 |
| 2 | 網羅性 | Tier 2 で `test.slow()` の使用を検討 | 外部サービスへのネットワーク往復を含むため、デフォルトの30秒タイムアウトでは不安定な場合がある |
| 3 | 技術的妥当性 | `import-redirect.spec.ts` の未認証リダイレクト確認方法 | Server-side redirect（`redirect('/')`）の場合、`page.goto()` 後に `page.url()` を確認するだけでなく、`page.waitForURL('/')` で明示的に待機するとより安定する |

## 総合所見

全体として質の高い計画。特に以下の点が優れている:

- **認証基盤の分離**: `supabase-auth.ts` を独立ヘルパーとして設計し、今後の認証テストで再利用可能にしている
- **Tier分け**: 外部サービス依存を明確に分離し、`test.skip()` + `retries` で不安定さに対処している
- **Page Object**: 既存のパターンを踏襲し、一貫性のある設計

最優先で対処すべきは **#1: プロジェクト分離の不備** で、これを解決しないと既存テストの回帰失敗を引き起こす。認証テスト専用のディレクトリ構成（`e2e/auth/`）を導入することで、#1 と推奨 #1 を同時に解決でき、将来の認証テスト追加にもスケールする。
