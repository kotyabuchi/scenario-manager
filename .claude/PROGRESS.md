# プロジェクト進捗管理

> **このファイルは複数のClaude Codeインスタンスで共有されます**
> タスク着手時は `[ ]` → `[→]` に、完了時は `[x]` に変更してください

## 現在のフェーズ: Phase 2

---

## Phase 1: 基盤構築 ✅

### 1.1 Supabase接続設定
- [x] 環境変数ファイル作成（`.env.local`）
- [x] Drizzle接続設定（`src/db/index.ts`）
- [x] 接続テスト

### 1.2 マイグレーション
- [x] Drizzle Kit設定（`drizzle.config.ts`）
- [x] マイグレーションファイル生成
- [x] Supabaseへマイグレーション実行（`pnpm db:push`）
- [x] シードデータ投入（`pnpm db:seed`）

### 1.3 RLSポリシー（認証後に実施）
- [ ] usersテーブルのRLS
- [ ] scenariosテーブルのRLS
- [ ] sessionsテーブルのRLS
- [ ] その他テーブルのRLS

### 1.4 フォームコンポーネント（Phase 3で必要に応じて実装）
- [ ] Input（テキスト入力）
- [ ] Select（ドロップダウン）
- [ ] Checkbox
- [ ] TagInput（タグ選択）
- [ ] RangeInput（範囲入力：人数・時間用）
- [ ] Storybook追加

---

## Phase 2: 認証機能 🔄

### 2.1 認証ライブラリ設定
- [x] Supabase Auth 選定・導入
- [x] `@supabase/ssr` パッケージ追加
- [x] `src/lib/supabase/client.ts` 作成
- [x] `src/lib/supabase/server.ts` 作成
- [x] `src/lib/supabase/middleware.ts` 作成

### 2.2 Discord OAuth
- [→] Discord Developer Portalでアプリ作成（ユーザー作業）
- [→] Supabaseダッシュボードで設定（ユーザー作業）
- [ ] 環境変数に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 追加

### 2.3 ログイン画面
- [x] UI実装（`/login`）
- [x] Discordログインボタン
- [x] エラーハンドリング

### 2.4 新規登録画面
- [ ] UI実装（`/signup`）
- [ ] 初回プロフィール設定フォーム
- [ ] バリデーション

### 2.5 認証ミドルウェア
- [x] `src/middleware.ts` 作成
- [x] 保護ルート設定（/home, /sessions, /users/me）
- [x] リダイレクト処理
- [x] 認証コールバック（`/auth/callback`）

### 2.6 プロフィール画面
- [ ] `/users/me` 実装
- [ ] プロフィール編集機能
- [ ] アバター表示

---

## Phase 3: シナリオ管理

### 3.1 型定義（interface.ts）
- [ ] Drizzleから型導出
- [ ] SearchParams型
- [ ] ScenarioWithRelations型
- [ ] Props型

### 3.2 検索クエリ（adapter.ts）
- [ ] searchScenarios関数
- [ ] getScenarioById関数
- [ ] システム検索（OR条件）
- [ ] タグ検索（AND条件）
- [ ] 人数・時間範囲検索

### 3.3 検索パネルUI
- [ ] SearchPanel コンポーネント
- [ ] システム選択（マルチセレクト）
- [ ] プレイ人数入力
- [ ] プレイ時間入力
- [ ] タグ選択
- [ ] シナリオ名検索

### 3.4 シナリオカード・リスト
- [ ] ScenarioCard完成
- [ ] ScenarioList完成
- [ ] ローディング状態
- [ ] 0件表示

### 3.5 URL同期
- [ ] useSearchParams活用
- [ ] クエリパラメータ ↔ 状態同期
- [ ] URLからの復元

### 3.6 ソート機能
- [ ] 新着順
- [ ] 高評価順
- [ ] プレイ時間順

### 3.7 シナリオ詳細画面
- [ ] `/scenarios/[id]/page.tsx`
- [ ] 基本情報表示
- [ ] レビュー一覧（後で実装）
- [ ] 関連動画（後で実装）

### 3.8 シナリオ登録画面
- [ ] `/scenarios/new/page.tsx`
- [ ] 登録フォーム
- [ ] バリデーション
- [ ] Server Action

### 3.9 シナリオ編集画面
- [ ] `/scenarios/[id]/edit/page.tsx`
- [ ] 編集フォーム
- [ ] 権限チェック

---

## 作業ログ

| 日時 | 担当 | 内容 |
|------|------|------|
| 2026-01-16 | Claude | 進捗管理ファイル作成 |
| 2026-01-16 | Claude | Phase 1.2 マイグレーション・シード完了 |
| 2026-01-16 | Claude | Phase 2.1 Supabase Auth設定完了 |
| 2026-01-16 | Claude | Phase 2.3 ログイン画面UI完了 |
| 2026-01-16 | Claude | Phase 2.5 認証ミドルウェア完了 |

---

## 次のアクション（ユーザー作業）

### Discord OAuth設定手順

1. **Discord Developer Portal** (https://discord.com/developers/applications)
   - 「New Application」でアプリ作成
   - OAuth2 > Redirects に追加:
     - `http://localhost:3000/auth/callback` （開発用）
     - `https://[PROJECT_REF].supabase.co/auth/v1/callback` （Supabase用）

2. **Supabaseダッシュボード** (https://supabase.com/dashboard)
   - Authentication > Providers > Discord
   - Client ID と Client Secret を入力
   - 有効化

3. **環境変数に追加** (`.env.local`)
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

---

## 注意事項

1. **タスク着手時**: `[ ]` → `[→]` に変更し、作業ログに記録
2. **タスク完了時**: `[→]` → `[x]` に変更
3. **競合回避**: 同じタスクを複数人で着手しない
4. **依存関係**: 上から順に進める
