# プロジェクト進捗管理

> **このファイルは複数のClaude Codeインスタンスで共有されます**
> タスク着手時は `[ ]` → `[→]` に、完了時は `[x]` に変更してください

## 現在のフェーズ: Phase 2

---

## Phase 1: 基盤構築 ✅

### 1.1 Supabase接続設定
- [x] 環境変数ファイル作成（`.env`）
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
- [x] Discord Developer Portalでアプリ作成（ユーザー作業）
- [x] Supabaseダッシュボードで設定（ユーザー作業）
- [x] 環境変数に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 追加

### 2.3 ログイン画面
- [x] UI実装（`/login`）
- [x] Discordログインボタン
- [x] エラーハンドリング

### 2.4 新規登録画面
- [x] UI実装（`/signup`）
- [x] 初回プロフィール設定フォーム
- [x] バリデーション
- [x] Server Action（createUser）

### 2.5 認証ミドルウェア
- [x] `src/middleware.ts` 作成
- [x] 保護ルート設定（/home, /sessions, /users/me）
- [x] リダイレクト処理
- [x] 認証コールバック（`/auth/callback`）

### 2.6 プロフィール画面（設計変更）

#### 2.6.1 共通コンポーネント化
- [x] `src/components/blocks/Profile/` ディレクトリ作成
- [x] `ProfileCard.tsx` を移動・共通化（公開プロフィール表示用）
- [x] `ProfileEditForm.tsx` を移動・共通化（設定ページ用）
- [x] `schema.ts` を移動（Zodバリデーション）
- [x] `styles.ts` を移動（PandaCSSスタイル）
- [x] `interface.ts` を移動（型定義）
- [x] `index.ts` を作成（エクスポート）

#### 2.6.2 `/users/[id]` 実装（公開プロフィール）
- [x] `src/app/(main)/users/[id]/page.tsx` 作成
- [x] `src/app/(main)/users/[id]/adapter.ts` 作成（getUserById）
- [x] ProfileCard を使用して基本情報表示
- [ ] セッション履歴セクション（将来実装）
- [ ] 投稿動画セクション（将来実装）
- [ ] レビュー一覧セクション（将来実装）
- [x] 自分のIDの場合も他人のIDの場合も同じ表示（編集ボタン表示で区別）

#### 2.6.3 `/profile` 実装（設定ページ）
- [x] `src/app/(main)/profile/page.tsx` 作成
- [x] `src/app/(main)/profile/actions.ts` 作成（updateProfile）
- [x] ProfileEditForm を使用してプロフィール編集
- [ ] 通知設定セクション（将来実装）
- [ ] その他設定項目（将来実装）
- [x] ログインユーザーのみアクセス可能

#### 2.6.4 `/users/me` 削除
- [x] `/users/me/` ディレクトリを完全削除（後方互換性不要）

#### 2.6.5 ミドルウェア更新
- [x] `src/lib/supabase/middleware.ts` の保護ルート更新
- [x] `/users/me` を保護ルートから削除
- [x] `/profile` を保護ルートに追加

---

## Phase 3: シナリオ管理 🔄

### 3.1 型定義（interface.ts）
- [x] Drizzleから型導出
- [x] SearchParams型
- [x] ScenarioWithRelations型
- [x] Props型（ScenarioCardProps, ScenarioListProps, SearchPanelProps）

### 3.2 検索クエリ（adapter.ts）
- [x] searchScenarios関数
- [x] getScenarioById関数
- [x] getAllSystems関数
- [x] getAllTags関数
- [x] システム検索（OR条件）
- [x] タグ検索（AND条件）
- [x] 人数・時間範囲検索

### 3.3 検索パネルUI
- [x] SearchPanel コンポーネント
- [x] システム選択（マルチセレクト）
- [x] プレイ人数入力
- [x] プレイ時間入力
- [x] タグ選択
- [x] シナリオ名検索

### 3.4 シナリオカード・リスト
- [x] ScenarioCard完成
- [x] ScenarioList完成
- [x] ローディング状態
- [x] 0件表示
- [x] styles.ts（PandaCSSスタイル定義）

### 3.5 URL同期
- [x] useSearchParams活用
- [x] クエリパラメータ ↔ 状態同期
- [x] URLからの復元

### 3.6 ソート機能
- [x] 新着順（adapter.ts実装済み）
- [x] 高評価順（adapter.ts実装済み、TODOあり）
- [x] プレイ時間順（adapter.ts実装済み）

### 3.7 シナリオ詳細画面
- [x] `/scenarios/[id]/page.tsx`
- [x] 基本情報表示
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
| 2026-01-17 | Claude | Phase 3.1, 3.2 型定義・検索クエリ完了 |
| 2026-01-17 | Claude | Phase 3.4, 3.6 シナリオカード・リスト・ソート完了 |
| 2026-01-17 | Claude | lib/formatters.ts作成（汎用フォーマット関数） |
| 2026-01-17 | Claude | Phase 3.3 検索パネルUI完了（SearchPanel, ScenariosContent） |
| 2026-01-17 | Claude | Phase 3.5 URL同期完了（クエリパラメータ同期） |
| 2026-01-17 | Claude | Phase 3.7 シナリオ詳細画面（基本情報表示）完了 |
| 2026-01-17 | Claude | /api/scenarios/search APIルート作成 |
| 2026-01-19 | Claude | Phase 2.2 Discord OAuth完了（ユーザー作業完了） |
| 2026-01-19 | Claude | Phase 2.4 新規登録画面確認（既存実装済み） |
| 2026-01-19 | Claude | プロフィール画面設計変更（/users/me → /profile + /users/[id]） |
| 2026-01-19 | Claude | Phase 2.6 詳細タスク分解（共通化 → 公開 → 設定 → リダイレクト） |
| 2026-01-19 | Claude | UI/UXレビュー完了（ui-reviewerエージェント使用） |
| 2026-01-19 | Claude | PROGRESS.mdにリファクタリング対象を記載（P0: 12件, P1: 18件, P2: 8件） |
| 2026-01-19 | Claude | Chipコンポーネント共通化・デザインシステム準拠対応（P0-001, P0-002完了） |
| 2026-01-19 | Claude | セマンティックトークン移行開始（P0-003完了確認、P0-004部分完了） |
| 2026-01-19 | Claude | セマンティックHTML適用（P0-006完了：hr要素への変更） |
| 2026-01-19 | Claude | フォーカス状態を_focusVisibleに統一（P0-012完了） |
| 2026-01-19 | Claude | お気に入り機能をFABメニューに統合（P0-005完了） |
| 2026-01-19 | Claude | サイドメニューにaria-label追加（P0-007完了） |
| 2026-01-19 | Claude | チップのホバー効果にtranslateY追加（P0-010完了） |
| 2026-01-19 | Claude | No Imageプレースホルダーにアイコンとテキスト追加（P0-009完了） |
| 2026-01-19 | Claude | WCAG AA準拠のコントラスト比確保（P0-008完了） |
| 2026-01-19 | Claude | セマンティックトークン移行完了（P0-004完了） |
| 2026-01-19 | Claude | P1タスク開始：P1-002, P1-003確認済み、P1-018完了 |
| 2026-01-19 | Claude | プロフィール画像サイズ拡大（P1-013完了：80px → 128px） |
| 2026-01-19 | Claude | 「続きを読む」ボタン改善（P1-008完了：アイコン追加） |
| 2026-01-19 | Claude | FABメニュー展開方向変更（P1-009完了：上左に展開） |
| 2026-01-19 | Claude | セッションタブの選択状態明確化（P1-010完了：背景色+太字追加） |
| 2026-01-19 | Claude | 検索ボタン階層確認（P1-011確認済み：既に実装済み） |
| 2026-01-19 | Claude | ソートUIをタブ形式に変更（P1-012完了：全ページでselect→タブボタン） |
| 2026-01-19 | Claude | もっと見るボタン改善（P1-004完了：ChevronDownアイコン追加） |
| 2026-01-19 | Claude | 0件時メッセージ改善（P1-005完了：温かみのあるメッセージに変更、絵文字をアイコンに置換） |
| 2026-01-19 | Claude | 検索パネル折りたたみ機能追加（P1-001完了：詳細条件を折りたたみ可能に） |
| 2026-01-20 | Claude | Phase 2.6 プロフィール画面設計変更完了（共通化・/users/[id]・/profile実装・/users/me削除） |

---

## UI/UXリファクタリング 🎨

**レビュー日**: 2026-01-19
**レビュー基準**: ui-design-system.md + WCAG 2.1 AA + ユーザビリティ
**詳細レポート**: [UI_REVIEW_REPORT.md](../UI_REVIEW_REPORT.md)

### サマリー
| 優先度 | 件数 | 内訳 |
|--------|------|------|
| **P0: 致命的** | 12件 | デザインシステム違反、アクセシビリティ重大問題 |
| **P1: 重要** | 18件 | UX改善、一貫性の欠如 |
| **P2: 推奨** | 8件 | 細かい改善点 |

### P0: 致命的な問題（1週間以内に修正）

**デザインシステム違反**
- [x] P0-001: チップコンポーネントのborder削除、shadow適用
- [x] P0-002: 選択中チップの色をprimary.defaultに変更
- [x] P0-003: 検索パネルのborder削除、shadow適用（既に準拠済み）
- [x] P0-004: セマンティックトークンへの移行（rgba, oklch, ハードコード値の削除）
- [x] P0-005: お気に入りボタンにラベル追加またはFABメニュー統合
- [x] P0-006: 区切り線を`<hr>`要素に変更
- [x] P0-007: サイドメニューにテキストラベルまたはARIA label追加
- [x] P0-008: コントラスト比確保（WCAG AA準拠）
- [x] P0-009: 「No Image」プレースホルダーのデザイン改善
- [x] P0-010: ホバー効果に`transform: translateY(-2px)`追加
- [x] P0-011: システムラベルオーバーレイを半透明+blur（既に実装済み）
- [x] P0-012: フォーカス状態の明確化（`_focusVisible`追加）

### P1: 重要な問題（2週間以内に修正）

**UX改善**
- [x] P1-001: 検索パネルの初期状態を折りたたみに
- [x] P1-002: シナリオカードのdescriptionを3行まで省略（既に実装済み）
- [x] P1-003: 評価表示に星アイコン追加（既に実装済み）
- [x] P1-004: 「もっと見る」ボタンを明確に（ChevronDown + テキスト）
- [x] P1-005: 0件時のメッセージを温かみのあるものに
- [ ] P1-006: ルートページCTAボタンの階層明確化
- [ ] P1-007: Login/Signupボタンをヘッダー右上に移動
- [x] P1-008: 「続きを読む」をボタン形式に
- [x] P1-009: FABメニューの展開方向を上左に
- [x] P1-010: タブの選択状態を背景色+下線で明確化
- [x] P1-011: 検索ボタンと条件クリアの階層明確化（既に実装済み）
- [x] P1-012: ソートUIをタブ形式に変更
- [x] P1-013: マイページのプロフィール画像を大きく（96px → 128px）
- [ ] P1-014: フォームのエラー表示を追加
- [x] P1-015: 配布ページリンクにテキスト追加（既に実装済み）
- [ ] P1-016: セッション作成ボタンの配置を改善
- [ ] P1-017: ホームページのダッシュボード実装
- [x] P1-018: 検索結果件数の表示を大きく

### P2: 推奨改善（1ヶ月以内に修正）

- [ ] P2-001: ルートページ機能紹介カードに影追加
- [ ] P2-002: フッターコピーライトのコントラスト確保
- [ ] P2-003: システム選択チップの並び順を使用頻度順に
- [ ] P2-004: 配布ページリンクに`target="_blank"`設定
- [ ] P2-005: プレイ時間の単位を統一（7h等）
- [ ] P2-006: セッション一覧の日付指定UIを実装
- [ ] P2-007: マイページの「ロール」を「権限」に変更
- [ ] P2-008: 自己紹介textareaの高さを拡大

### 検証方法

**デザインシステム準拠チェック**
```bash
# ハードコードされた色・影を検索
grep -r "rgba(" src/
grep -r "oklch(" src/
grep -r "0 2px" src/

# borderの使用箇所を検索
grep -r "border:" src/ | grep -v "border: 'none'"
grep -r "borderTop:" src/
```

**アクセシビリティチェック**
- Lighthouse (Chrome DevTools) でスコア確認
- WAVE (https://wave.webaim.org/) でアクセシビリティ検証
- キーボードのみで全機能が操作可能か確認

**コントラストチェック**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

---

## 次のアクション

### Phase 2完了 ✅

**Phase 2.6 プロフィール画面（設計変更）**: 完了
- `/profile` でプロフィール編集ができる ✅
- `/users/[id]` で自分・他人のプロフィールが閲覧できる ✅
- `/users/me` は削除（後方互換性不要）✅

### Phase 3継続

**優先度A**: シナリオ管理の残タスク
1. Phase 3.7: シナリオ詳細画面のレビュー一覧・関連動画（後で実装）
2. Phase 3.8: シナリオ登録画面
3. Phase 3.9: シナリオ編集画面

---

## 注意事項

1. **タスク着手時**: `[ ]` → `[→]` に変更し、作業ログに記録
2. **タスク完了時**: `[→]` → `[x]` に変更
3. **競合回避**: 同じタスクを複数人で着手しない
4. **依存関係**: 上から順に進める
