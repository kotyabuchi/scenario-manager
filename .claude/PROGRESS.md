# プロジェクト進捗管理

> **このファイルは複数のClaude Codeインスタンスで共有されます**
> タスク着手時は `[ ]` → `[→]` に、完了時は `[x]` に変更してください

---

## TDD開発フロー

```
/requirements → /gen-test → tdd-implementer → tdd-refactorer
    ↓              ↓              ↓                 ↓
 要件定義        Red           Green            Refactor
 (スキル)      (スキル)    (エージェント)    (エージェント)
```

| 名前 | 種別 | フェーズ | 説明 |
|------|------|---------|------|
| `/requirements` | スキル | 要件定義 | 仕様策定 → `.claude/requirements/` |
| `/gen-test` | スキル | Red | 失敗するテストを書く |
| `tdd-implementer` | エージェント | Green | テストを通す最小実装（自律実行） |
| `tdd-refactorer` | エージェント | Refactor | テスト維持しながら品質改善（自律実行） |
| `/fix-bug` | スキル | バグ修正 | 再現テスト作成 → 修正 → 検証 |

**自動連携**: `tdd-implementer` が過剰実装を検出すると `tdd-refactorer` を自動呼び出し（最大3回）

---

## TDD進捗

> **凡例**: `[ ]` 未着手 / `[→]` 作業中 / `[-]` テストskip・偽陽性 / `[x]` 完了
>
> **要件定義書**: `.claude/requirements/` 配下

### シナリオ検索（requirements-v1.md Section 5）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | [x] | [x] | [x] | [x] | [ ] | 完了（28テスト通過） |
| searchScenarios | [x] | [x] | [-] | [x] | [ ] | 実装済（テスト全件 describe.skip） |
| toSearchParams | [x] | [x] | [x] | [x] | [ ] | 完了（15テスト通過） |
| getAllSystems | [x] | [x] | [-] | [x] | [ ] | 実装済（DB未接続時に偽陽性パターン） |
| getAllTags | [x] | [x] | [-] | [x] | [ ] | 実装済（DB未接続時に偽陽性パターン） |

**テストファイル**:
- `src/app/(main)/scenarios/__tests__/searchFormSchema.test.ts`
- `src/app/(main)/scenarios/__tests__/searchScenarios.test.ts`
- `src/app/(main)/scenarios/__tests__/searchParams.test.ts`
- `src/app/(main)/scenarios/__tests__/masterData.test.ts`

---

### シナリオ登録（requirements-scenario-new.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| scenarioFormSchema | [x] | [x] | [x] | [x] | [ ] | 完了（30テスト通過） |
| createScenario | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト4件 it.skip） |
| getUserByAuthUserId | [x] | [x] | [-] | [x] | [ ] | 実装済（正常系テスト it.skip） |
| checkScenarioNameDuplicate | [x] | [x] | [-] | [x] | [ ] | 実装済（describe.skip で全件スキップ） |
| checkDistributeUrlDuplicate | [x] | [x] | [-] | [x] | [ ] | 実装済（describe.skip で全件スキップ） |
| checkRateLimit | [x] | [x] | [x] | [x] | [ ] | 完了（7テスト通過、DB不要） |
| createScenarioAction | [x] | [ ] | [ ] | [x] | [ ] | 実装済（テストファイル不在） |

**要件定義書**: `.claude/requirements/requirements-scenario-new.md`

**テストファイル**:
- `src/app/(main)/scenarios/new/__tests__/schema.test.ts`
- `src/app/(main)/scenarios/new/__tests__/adapter.test.ts`
- `src/app/(main)/scenarios/new/__tests__/duplicateCheck.test.ts`
- `src/app/(main)/scenarios/new/__tests__/rateLimit.test.ts`

**実装ファイル**:
- `src/app/(main)/scenarios/adapter.ts` - 重複チェック関数
- `src/lib/rateLimit.ts` - レートリミット関数

---

### シナリオ詳細（requirements-v1.md Section 10）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| getScenarioDetail | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| getScenarioReviews | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| getScenarioSessions | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| getScenarioVideoLinks | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| getUserScenarioPreference | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| getUserByAuthUserId | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| toggleFavorite | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |
| togglePlayed | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト it.skip） |

**テストファイル**:
- `src/app/(main)/scenarios/[id]/__tests__/adapter.test.ts`

---

### セッション一覧（requirements-session-list.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | [x] | [x] | [x] | [x] | [ ] | 完了（7テスト通過） |
| searchParamsParsers | [x] | [x] | [-] | [x] | [ ] | 実装済（toPublicSearchParams テスト6件通過、パーサー自体のテストなし） |
| searchPublicSessions | [x] | [x] | [-] | [x] | [ ] | 実装済（6件中5件 skipIf） |
| getUpcomingSessions | [x] | [x] | [-] | [x] | [ ] | 実装済（3件中2件 skipIf） |
| getHistorySessions | [x] | [x] | [-] | [x] | [ ] | 実装済（6件中5件 skipIf） |
| getCalendarSessions | [x] | [x] | [-] | [x] | [ ] | 実装済（4件中3件 skipIf） |
| getAllSystems | [x] | [x] | [-] | [x] | [ ] | 実装済（DB接続失敗時フォールバック） |

**要件定義書**: `.claude/requirements/requirements-session-list.md`

**テストファイル**:
- `src/app/(main)/sessions/__tests__/adapter.test.ts`
- `src/app/(main)/sessions/__tests__/searchParams.test.ts`
- `src/app/(main)/sessions/__tests__/slotWarning.test.ts`（9件通過、PROGRESS未記載だった）
- `src/app/(main)/sessions/_components/schema.ts` （スキーマ定義）

---

### セッション管理（requirements-session-flow.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| sessionFormSchema | [x] | [x] | [x] | [x] | [ ] | 完了 |
| createSession | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| getSessionById | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| updateSession | [x] | [ ] | [ ] | [x] | [ ] | 実装済（テスト未） |
| 日程調整機能 | [x] | [x] | [x] | [x] | [ ] | 完了（availability + confirm） |
| applyToSession | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| approveApplication | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| rejectApplication | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| withdrawFromSession | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| cancelApplication | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| cancelSession | [x] | [x] | [x] | [x] | [ ] | Green（実装済） |
| updateSessionScenario | [x] | [x] | [x] | [x] | [ ] | 完了（adapter+action+UI） |

**テストファイル**:
- `src/app/(main)/sessions/new/__tests__/schema.test.ts`
- `src/app/(main)/sessions/new/__tests__/adapter.test.ts`
- `src/app/(main)/sessions/__tests__/participantAdapter.test.ts`
- `src/app/(main)/sessions/[id]/__tests__/adapter.test.ts`

**実装ファイル**:
- `src/app/(main)/sessions/new/adapter.ts` - セッション作成・取得
- `src/app/(main)/sessions/participantAdapter.ts` - 参加申請管理

**TODO**:
- [ ] セッション募集フォームの日時入力で、`From` 入力完了時に `To` へ即フォーカス移動（`datetime-local` の自動補完で誤判定）。独自 `DateTimeInput` 作成後に再対応。

---

### 認証画面（requirements-auth.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| signupFormSchema (Step1) | [x] | [x] | [x] | [x] | [ ] | Green完了（12テスト通過） |
| signupStep2Schema | [x] | [x] | [x] | [x] | [ ] | Green完了（5テスト通過） |
| checkUserNameAvailability | [x] | [x] | [x] | [ ] | [ ] | テスト設計済（モック）、実装はスタブ |
| registerUser (createUser) | [x] | [x] | [x] | [x] | [ ] | Green完了（テストはモック、実装はServer Action済） |
| generateUserName | [x] | [x] | [x] | [x] | [ ] | Green完了（6テスト通過） |
| SignupModal | [x] | [x] | [x] | [x] | [ ] | Green完了（29テスト通過） |
| AuthRedirect | [x] | [ ] | [ ] | [x] | [ ] | 実装済（useDiscordAuth + AuthContext + callback）テスト未 |

**要件定義書**: `.claude/requirements/requirements-auth.md`

**テストファイル**:
- `src/components/blocks/SignupModal/__tests__/schema.test.ts` — スキーマ（17テスト）
- `src/components/blocks/SignupModal/__tests__/adapter.test.ts` — 一意性チェック（4テスト、モック）
- `src/components/blocks/SignupModal/__tests__/actions.test.ts` — ユーザー登録（5テスト、モック）
- `src/components/blocks/SignupModal/__tests__/utils.test.ts` — ユーザー名生成（6テスト）
- `src/components/blocks/SignupModal/SignupModal.test.tsx` — コンポーネント（29テスト）

**実装ファイル**:
- `src/components/blocks/SignupModal/` — モーダルUI一式（schema, actions, adapter, utils, styles）
- `src/hooks/useDiscordAuth.ts` — Discord OAuth（ポップアップ/リダイレクト方式）
- `src/context/auth-context.tsx` — 認証コンテキスト（新規ユーザー判定含む）
- `src/app/(auth)/auth/callback/route.ts` — OAuthコールバック（BroadcastChannel方式）
- `src/app/(main)/_components/SignupModalWrapper.tsx` — モーダル自動表示制御

**実装済みの要件（PROGRESS外）**:
- `/login`, `/signup` ページ廃止済み — 独立ページは削除完了
- ヘッダーログインボタン — `GlobalHeader` に `useDiscordAuth` で統合済み
- 新規ユーザー判定 — `AuthContext.isNewUser` で `usersテーブル未登録` を自動検出
- 好きなシナリオ (`favorite_scenarios`) — DBカラム存在、registerUserで保存済み

**未実装項目**:
- [ ] `checkUserNameAvailability` — adapter.tsがスタブ（`return { available: false }` 固定）。Supabase問い合わせ未実装
- [ ] `adapter.test.ts` / `actions.test.ts` — テストがvi.fnモックのみで実装を呼んでいない（統合テスト未検証）
- [ ] `AuthRedirect` のテスト — `useDiscordAuth` / `auth-context.tsx` のユニットテスト未作成
- [ ] Step2「好きなシステム」チップ選択UI — SignupModal内が `{/* TODO: チップ選択UI */}` のまま
- [ ] `user_favorite_systems` テーブル — DBに未作成（マイグレーション必要）
- [ ] ランディングページCTAからのOAuth起動 — ヘッダーは実装済みだがCTAボタンは未連携

---

### プロフィール

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| profileFormSchema | [ ] | [x] | [x] | [x] | [ ] | 完了（17テスト通過、要件未定義） |
| updateUserProfile | [ ] | [x] | [-] | [x] | [ ] | 実装済（テスト8件中6件 it.skip） |
| getUserById | [ ] | [ ] | [ ] | [x] | [ ] | 実装済（要件・テスト未） |
| getUserByAuthUserId (profile) | [ ] | [ ] | [-] | [x] | [ ] | 実装済（テスト2件中1件 skip） |
| updateProfile (Server Action) | [ ] | [ ] | [ ] | [x] | [ ] | 実装済（テスト未） |
| ProfileEditFormWrapper | [ ] | [ ] | [ ] | [x] | [ ] | 実装済（テスト未） |

**テストファイル**:
- `src/components/blocks/Profile/__tests__/schema.test.ts`
- `src/app/(main)/profile/__tests__/adapter.test.ts`

**実装ファイル**:
- `src/app/(main)/profile/page.tsx` — プロフィール編集ページ
- `src/app/(main)/profile/adapter.ts` — DB操作（getUserByAuthUserId, updateUserProfile）
- `src/app/(main)/profile/actions.ts` — Server Action（updateProfile）
- `src/app/(main)/profile/_components/ProfileEditFormWrapper.tsx` — フォームラッパー
- `src/app/(main)/users/[id]/page.tsx` — ユーザー公開プロフィール
- `src/app/(main)/users/[id]/adapter.ts` — getUserById

---

### レビュー機能（requirements-review-ui.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| reviewFormSchema | [x] | [x] | [x] | [x] | [ ] | 完了（19テスト通過） |
| createReview | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト3件 it.skip） |
| updateReview | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト2件 it.skip） |
| deleteReview | [x] | [x] | [-] | [x] | [ ] | 実装済（主要テスト1件 it.skip） |

**テストファイル**:
- `src/app/(main)/scenarios/[id]/__tests__/schema.test.ts`
- `src/app/(main)/scenarios/[id]/__tests__/adapter.test.ts`

**TODO**:
- [ ] セッション完了後のレビュー導線を実装（CompleteSessionDialog のサクセス画面「レビューを書く」ボタンを有効化し、レビュー画面へリンク）

---

### フィードバック機能（requirements-feedback.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| feedbackFormSchema | [x] | [x] | [x] | [x] | [ ] | 完了（18テスト通過） |
| createFeedbackAction | [x] | [x] | [-] | [x] | [ ] | 実装済（actions.test.ts はスキーマテスト14件のみ通過、Server Action呼び出しテスト3件 it.skip） |
| FeedbackModal | [x] | [ ] | [ ] | [x] | [ ] | 実装済（テスト未） |
| FeedbackButton | — | — | — | — | — | 廃止完了（削除済み、SpeedDialFABに統合） |

**テストファイル**:
- `src/components/blocks/FeedbackModal/__tests__/schema.test.ts`
- `src/components/blocks/FeedbackModal/__tests__/actions.test.ts`

**UIコンポーネント**:
- `src/components/blocks/FeedbackModal/` - フィードバック投稿モーダル

---

### FABリニューアル（requirements-fab-redesign.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| SpeedDialFAB | [x] | [x] | [x] | [x] | [ ] | 統合完了（14テスト通過） |
| useSpeedDial | [x] | [x] | [x] | [x] | [ ] | 統合完了（6テスト通過） |
| shareCurrentPage | [x] | [x] | [x] | [x] | [ ] | 統合完了（3テスト通過） |
| BottomNav統合 | [x] | [x] | [x] | [x] | [ ] | 統合完了（専用テストなし、SpeedDialFAB経由で間接カバー） |
| QuickSearchModal | [x] | [ ] | [ ] | [ ] | [ ] | 要件定義済（Phase 2） |
| searchScenariosQuick | [x] | [ ] | [ ] | [ ] | [ ] | 要件定義済（Phase 2） |

**要件定義書**: `.claude/requirements/requirements-fab-redesign.md`

**テストファイル**:
- `src/components/blocks/SpeedDialFAB/__tests__/useSpeedDial.test.ts` - フック Unit Tests (6項目)
- `src/components/blocks/SpeedDialFAB/__tests__/share.test.ts` - シェアユーティリティ Unit Tests (3項目)
- `src/components/blocks/SpeedDialFAB/SpeedDialFAB.test.tsx` - コンポーネント Tests (14項目)
- `src/components/blocks/SpeedDialFAB/SpeedDialFAB.stories.tsx` - Storybook Stories

---

### 基盤コンポーネント

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| Button | [ ] | [x] | [x] | [x] | [ ] | 完了（23テスト通過） |
| Card | [ ] | [x] | [x] | [x] | [ ] | 完了（8テスト通過） |
| Chip | [ ] | [x] | [x] | [x] | [ ] | 完了（18テスト通過） |
| Modal | [ ] | [x] | [x] | [x] | [ ] | 完了（8テスト通過） |
| Select | [x] | [x] | [x] | [x] | [ ] | 完了（14テスト通過） |
| Input | [ ] | [x] | [x] | [x] | [ ] | 完了（23テスト通過） |
| Textarea | [ ] | [x] | [x] | [x] | [ ] | 完了（16テスト通過） |
| ToggleGroup | [ ] | [x] | [x] | [x] | [ ] | 完了（16テスト通過） |
| Avatar | [ ] | [x] | [x] | [x] | [ ] | 完了（12テスト通過） |
| FormField | [ ] | [ ] | [ ] | [x] | [ ] | 実装済（テスト未、Storybook あり） |

**要件定義書**:
- `Select`: `.claude/requirements/components/Select.md`

**テストファイル**:
- `src/components/elements/button/button.test.tsx`
- `src/components/elements/card/card.test.tsx`
- `src/components/elements/Chip/chip.test.tsx`
- `src/components/elements/modal/modal.test.tsx`
- `src/components/elements/select/select.test.tsx`
- `src/components/elements/input/input.test.tsx`
- `src/components/elements/textarea/textarea.test.tsx`
- `src/components/elements/toggle-group/toggle-group.test.tsx`
- `src/components/elements/avatar/avatar.test.tsx`

---

## インフラ・設定（TDD対象外）

### DB接続・マイグレーション [x]
- [x] Supabase接続設定
- [x] Supabase JS Client（旧Drizzle ORM — Supabase JS Client に移行済み）
- [x] マイグレーション実行
- [x] シードデータ投入

### 認証設定 [x]
- [x] Supabase Auth設定
- [x] Discord OAuth連携
- [x] 認証ミドルウェア

### RLSポリシー（未実施）
- [ ] usersテーブル
- [ ] scenariosテーブル
- [ ] sessionsテーブル

### デプロイ設定 [x]
- [x] Cloudflare Pages設定
- [x] 不使用（Hyperdrive — Supabase JS Client 移行により廃止）
- [x] GitHub Actions

---

## UI/UXリファクタリング

**レビュー日**: 2026-01-19
**詳細レポート**: [UI_REVIEW_REPORT.md](../UI_REVIEW_REPORT.md)

| 優先度 | 完了 | 残り |
|--------|------|------|
| P0: 致命的 | 12件 | 0件 |
| P1: 重要 | 16件 | 1件 |
| P2: 推奨 | 0件 | 8件 |

**P1残タスク**:
- [x] P1-006: ルートページCTAボタンの階層明確化
- [x] P1-007: Login/Signupボタンをヘッダー右上に移動
- [x] P1-014: フォームのエラー表示を追加
- [ ] P1-016: セッション作成ボタンの配置を改善
- [x] P1-017: ホームページのダッシュボード実装

---

## 計画書進捗

| 計画書 | 状態 | 備考 |
|--------|------|------|
| `icon-migration.md` | [x] 完了 | lucide-react/react-icons の import は 0件。@phosphor-icons/react に統一済み |
| `dashboard-redesign.md` | ほぼ完了 | HeroSection, UpcomingSessions, ActivityTimeline, NewScenarios, MiniCalendar, SystemNotice 実装済。**StatsSection, QuickActions 未実装** |
| `scenario-search-redesign.md` | Phase 0-3 実装済 | Phase 0（Pencil統一）、Phase 2（ドラフト状態 useFilterDraft）、Phase 3（SearchTopBar/SearchSidebar/MobileSearchBar）完了 |
| `select-redesign.md` | [x] 完了 | Issue #1 マージ済（ValueText コンポーネント化、オーバーフロー対応） |
| `e2e-testing-plan.md` | [x] 基盤完了 | E2Eテスト基盤構築済み |
| `e2e-test-expansion.md` | 未着手 | 前提条件の aria-current は実装済み |
| `e2e-scenario-import.md` | 未着手 | — |
| `components-folder-restructure.md` | [ ] 未着手 | `_components/` フォルダ構成の刷新（Batch 1-10）。レビュー反映済み。[Issue #3](https://github.com/kotyabuchi/scenario-manager/issues/3) |
| `feedback-deferred-items.md` | 部分実装 | ActionSection 存在（削除・編集機能の一部が実装済みの可能性） |
| `import-url-detection.md` | 未着手 | — |
| `scenario-auto-import.md` | Step 5 完了、Step 6 未着手 | 下記セクション参照 |

---

## シナリオ自動インポート機能

**計画書**: `docs/plans/scenario-auto-import.md`

### 実装進捗

| ステップ | 内容 | 状態 |
|---------|------|------|
| Step 1 | DBスキーマ変更（source_type, source_url, source_fetched_at） | [x] |
| Step 1.5 | HTMLパーサー PoC（cheerio + Edge Runtime） | [x] |
| Step 2 | 外部サイトパーサー実装（url-validator, sanitizer, booth/talto-parser） | [x] |
| Step 3 | インポート登録ページ（/scenarios/import） | [x] |
| Step 4 | シナリオ一覧ページへの導線追加 | [x] |
| Step 5 | UI改善（配布元リンク表示、出典情報） | [x] |
| Step 6 | 利用規約・通報機能 | [ ] |

> **Step 5 詳細**: 配布元リンク表示、ソースバッジ（Booth/TALTO）、インポートフォームソース情報バナー、readOnlyフィールド、著作権注意メッセージが全て実装済み。

### 利用規約調査（2026-02-10 完了）

| サイト | 規約確認 | robots.txt | リスク評価 | 事前連絡 |
|--------|:-------:|:----------:|-----------|:-------:|
| BOOTH（pixiv） | [x] | [x] 商品ページ制限なし | 低（2025年10月に「常識的なスクレイピング歓迎」方針） | [ ] |
| TALTO（ココフォリア） | [x] | [x] /projects/* 許可 | 低〜中（「情報収集」条項の解釈に幅あり） | [ ] |

**「商業目的」条項**: scenario-managerは管理ツールでありBOOTH/TALTOと競合しない。事実情報のメタデータ参照のみで「サービスの商業利用」には非該当 → リスク低

### 残タスク（リリース前）

- [ ] pixiv社（BOOTH）への事前連絡・許諾確認
- [ ] ココフォリア社（TALTO）への事前連絡・許諾確認
- [ ] 連絡結果に応じた対応（許諾→公開 / 条件付き→調整 / 拒否→パーサー無効化）

---

## E2Eテスト失敗の分類と対応方針（2026-06-14）

**経緯**: ポート競合対策（E2E専用3100 / `next start` / `kill-port` 前処理）でフルスイートが初めて完走可能に。結果 **221 passed / 63 failed / 28 skipped / 19 did not run（7.0分）**。ポート起因の失敗は0。63失敗（≒ユニーク35テスト × chromium-auth/mobile-chrome-auth 二重計上）は従来ポート問題で可視化されていなかった潜在失敗。

> **方針**: 個別パッチではなく、**共通の仕組みで一括解決**できるものは仕組み化して再発防止する。

### カテゴリA: 外部ネットワーク依存（仕組みで解決）
- **対象**: `import.spec.ts` Tier2 URL解析（:83 / :100 / :109 / :132）。TALTO/BOOTH へ実アクセスし30秒タイムアウト多発。
- **根本原因**: E2Eが外部サイトの可用性・DB登録URLに依存。
- **判明**: 解析は Server Action（サーバー側 fetch）のため `page.route()` では傍受不可。本番コードへのテストシーム挿入も侵襲的。
- **仕組み（採用）**: 外部依存テストは**明示オプトイン**化（`f19fd30`）。`E2E_LIVE_IMPORT=1` のときのみ Tier2 を実行、既定はskip → 既定スイートは決定論的・外部アクセス無し。
- [x] import Tier2 を E2E_LIVE_IMPORT オプトイン化（既定 6 skipped）

### カテゴリB: 「シードデータ依存」→ 実体は大半が staleセレクタ（誤診の訂正）
- **当初の想定**: feedback/home/session系はDB上の特定データが無いと失敗＝seed依存。
- **実測での判明**: D/C/A 修正後にフル実行したところ 63→23 に減少。残23を error-context で精査した結果、**データは存在しており、失敗の実体は UI リデザイン後の staleセレクタ**だった（誤診）。
  - home: 見出しテキスト変更（「予定されているセッション」「新着おすすめシナリオ」）
  - applications: タブ→Selectフィルターへのリデザイン（`#tab-*` 消滅）
  - session-subpages/lifecycle: stats文言（「N名」）・link化（申請管理/スケジュール）・廃止済み確認入力
  - feedback voteCount: PandaCSSアトミッククラスで `[class*=...]` が不一致
- [x] 上記をセレクタ修正で解消（`dcf84c6`）。23 → 1（fixme）まで緑化
- **唯一の真のデータ分離案件**: `feedback-detail`「投票後リロード保持」のみ、共有フィードバックの投票状態を複数テストが変異させ競合 → `test.fixme`。

### Docker+seed 分離基盤（将来の決定論タスク・任意）
- **背景**: 現状E2Eはクラウドの既存データに暗黙依存。完全な決定論・CI再現には isolated/resettable DB が有効。
- **調査済みの実現性**: migrations 24本あり `supabase db reset` でスキーマ再構築可。auth はメール/パスワードでローカル動作可。不足は `supabase/seed.sql` と env 切替のみ。Docker 起動が前提。
- **適用先**: 主に上記 `test.fixme` の投票リロードテスト（テスト毎の新規フィードバック or reset）。
- [ ] `supabase/seed.sql` + Playwright `globalSetup`(db reset) + ローカルenv + GitHub Actions（着手は任意）

### カテゴリC: テストセレクタ／レスポンシブの不備（page-object共通化で解決）
- **対象**: `search`（ソートSelect :47/:70、`aria-busy`残留で操作不達）、`public`（:39 件数テキストが strict-mode 2要素）、`navigation`（モバイル :21/:31 が `header nav` を探すが実機はBottomNav）、`scenario-detail-actions`（FAB :34/:47）、`import` Tier1（:37/:40）、`scenario-new-banner:56`、`session-flow:67`、`session-create:22/:29`、`sessions:49`。
- **根本原因**: 曖昧/レスポンシブ非対応ロケータ、Select/FAB操作の待機不足、`aria-busy`解消待ちなし。
- **仕組み**: `e2e/pages/` のpage-objectに**堅牢なロケータ＆操作ヘルパー**を集約（viewport別nav取得、visible限定、Select選択ヘルパー等）。
- [x] 公開側（`331fa5d`）: resultCount を visible 限定 / navLink で viewport非依存 / search ソートを実在オプション(`古い順`)へ修正 → navigation+public 20 passed、search ソート 4 passed
- [x] **Button asChild の実バグ修正**（`f19fd30`）: asChild時にprefix/suffixラッパーでArk Slotが壊れ非描画だった問題を修正。これにより import:37/:40・scenario-new-banner:56 が解消（Linkボタン全般に波及）
- [x] 認証側（`e334776`/`83fc6ac`/`16da6f5`）: FAB(実ラベル+overlay閉じ)・戻る/編集ボタン(stale locator)・詳細/新規見出し(stale)・**SessionFormのクライアント検証エラー非表示の実バグ**を修正
- ✅ **Category C 完了**（公開側+認証側すべて）

### カテゴリD: 実アプリのアクセシビリティバグ（コンポーネント側で解決）
- **対象**: `sessions.spec.ts:59` セッション作成ページのa11y違反。axe `label`（critical）= NumberInput にラベル紐付けが無い。
- **根本原因**: Ark UI NumberInput がラベル未関連付け。**実アプリのバグ**（テストではない）。
- **仕組み**: 共有コンポーネント側で対応（`e387156`）。Select は隠し`<select>`へ aria-label 伝播、NumberInput は aria-label を`<input>`へ転送するprop追加。全Select/NumberInputに横断的に効く。
- [x] Select/NumberInput のアクセシブル名修正（a11y E2E 2 passed / ユニット41 passed）
- [ ] 他フォーム要素のa11y横断点検（フル再実行時に確認）

### 補足: 切り分け結果・要精査
- ✅ **本番ビルド(`next start`)切替は無罪**: `search` ソート2件は `pnpm test:e2e:dev`（dev再利用）でも同一失敗。ポート/ビルド変更は回帰を生んでいない。63失敗はすべて潜在バグ。
- `home:21 ウェルカムメッセージ`・`session-create:22/:29 バリデーション` はデータ/セレクタどちらか要確認。

---

## 監査指摘事項（2026-02-23）

- [ ] DB統合テストの実行環境を確立する（Supabase Local または モック化）
- [ ] 偽陽性テストパターン（`expect(true).toBe(true)`）を `it.skip` に統一する
- [ ] `createScenarioAction` のテストを作成する
- [ ] adapter/actions テストのモック→実装呼出テストへの移行を検討する
- [ ] Chipディレクトリ名をPascalCase→kebab-caseに統一する
- [ ] deploy.yml の `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` を削除する
- [ ] インフラセクションの歴史的記述（Drizzle/Hyperdrive）を整理する

---

## セッション画面 モックデザイン適合リファクタリング

**モックディレクトリ**: `docs/designs/mocks/セッション/`

### 画面一覧・対応表

| # | モック名 | 実装ファイル | 状態 |
|---|---------|-------------|------|
| 1 | セッション募集フォーム_基本状態 | `sessions/new/_components/SessionForm.tsx` | [x] 完了 |
| 2 | セッション募集フォーム_シナリオ選択状態 | `sessions/new/_components/sections/scenario/` | [x] 完了 |
| 3 | セッション募集フォーム_シナリオ検索モーダル | `sessions/new/_components/sections/scenario/ScenarioSearchModal.tsx` | [x] 完了 |
| 4 | セッション詳細ページ | `sessions/[id]/_components/SessionDetailContent.tsx` | [x] 完了 |
| 5 | 日程回答画面（日程提出） | `sessions/[id]/schedule/availability/` | [x] 完了 |
| 6 | 日程集計・確定画面 | `sessions/[id]/schedule/confirm/` | [x] 完了 |
| 7 | キャンセル・辞退ダイアログ | `sessions/[id]/_components/CancelSessionDialog.tsx`, `WithdrawDialog.tsx` | [x] 完了 |
| 8 | セッション参加申請モーダル | `sessions/[id]/_components/ParticipationRequestDialog.tsx` | [x] 完了 |
| 9 | セッション完了ダイアログ | `sessions/[id]/_components/CompleteSessionDialog.tsx` | [x] 完了 |
| 10 | 参加申請承認画面 | `sessions/[id]/applications/_components/` | [x] 完了 |
| ~~11~~ | ~~日程候補選択画面~~ | ~~未実装~~ | 不要（日程提出方式に変更済み） |

### 各画面の差分詳細

#### #7 キャンセル・辞退ダイアログ

**GMキャンセルダイアログ** (`CancelSessionDialog.tsx`):
- [x] モックは「キャンセル」入力の二重確認フィールドなし → `confirmText` フィールドを削除し、シンプルな確認UIに変更
- [x] 警告ヘッダーをモックの赤背景バー形式（`セッションをキャンセルしますか？`）に合わせる
- [x] 影響説明ボックスの文言をモックに合わせる（「参加予定のプレイヤー全員に通知が送信されます」等）
- [x] 理由フィールドのplaceholderをモックに合わせる

**PLAYER辞退ダイアログ** (`WithdrawDialog.tsx`):
- [x] タイトルを「セッションから辞退しますか？」に変更
- [x] 警告ボックス追加（ベルアイコン + 「GMに参加辞退の連絡を送ります」説明文）
- [x] 辞退理由を「必須」に変更（モックでは必須バッジあり）
- [x] 文字数カウンター追加（0/200文字）
- [x] ボタンラベルを「辞退する」+アイコンに変更

#### #8 セッション参加申請モーダル

- [x] セッション情報サマリーをモック形式に変更（SCENARIO / MEMBER / DATE の3行表示）
- [x] 参加タイプに「GMとして参加」オプションを追加（3択: GM / プレイヤー / 観戦者）
- [x] カード型ラジオUIをモックのレイアウトに合わせる（左アイコン + テキスト + 右ラジオ）
- [x] 選択状態をモック準拠に変更（左アクセントバー + 緑背景 + 半透明ボーダー + アイコン/テキスト色変更）
- [x] 送信ボタンを全幅の緑ボタン（「申請を送る」+アイコン + primaryシャドウ）に変更
- [x] 下部の「キャンセル」をテキストリンクに変更（ボタンではなくテキスト）

#### #9 セッション完了ダイアログ

- [x] シナリオ情報カードを追加（サムネ + シナリオ名 + 日時情報）
- [x] 完了時の処理チェックリストを追加（参加者ステータス更新、経験点配布、ログアーカイブ）
- [x] GMメモフィールドの追加（ラベル変更 + 任意・非公開バッジ）
- [x] 完了後のサクセス画面を追加（チェックマークアイコン + 「セッションが完了しました」 + 「レビューを書く（準備中）」ボタン）
- [x] SessionActions の early return 修正（サクセス画面消滅対策）
- [x] Storybook 追加（Default / WithoutSchedule / SuccessView）

#### #10 参加申請承認画面 [x]

- [x] パンくずナビゲーション → PageHeaderに置換
- [x] 統計表示を「参加予定 N / M名」形式に変更
- [x] 検索入力フィールドを追加
- [x] ソート・フィルターボタンを追加
- [x] カードデザインをモックに合わせる（申請メッセージ吹き出し風）
- [x] ボタンラベルを「拒否する」「承認する」に統一
- [x] ページネーションを追加
- [x] border softトークン適用（カード・フィルターバー）

---

## 作業ログ

| 日時 | 内容 |
|------|------|
| 2026-01-16 | Phase 1 完了（DB接続・マイグレーション） |
| 2026-01-16 | Phase 2 認証設定完了 |
| 2026-01-17 | シナリオ検索機能実装・テスト完了 |
| 2026-01-17 | シナリオ詳細画面実装 |
| 2026-01-19 | UI/UXリファクタリング（P0完了） |
| 2026-01-20 | プロフィール画面設計変更完了 |
| 2026-01-21 | シナリオ登録画面完了 |
| 2026-01-22 | TDD進捗管理形式に統一 |
| 2026-01-22 | レビューCRUD機能を追加（schema + adapter + tests） |
| 2026-01-22 | フィードバック機能のスキーマテストを追加 |
| 2026-01-22 | セッション募集フォームスキーマを追加（schema + tests） |
| 2026-01-22 | TDD Red: セッション管理・参加申請機能のテストを追加 |
| 2026-01-22 | createFeedbackActionのテストを追加 |
| 2026-01-22 | TDD Green: セッション管理・参加申請機能の実装完了 |
| 2026-01-27 | シナリオ登録画面の詳細要件定義書を作成（重複チェック・レートリミット追加） |
| 2026-01-27 | TDD Red: シナリオ登録の境界値テスト追加、重複チェック・レートリミットのテスト作成 |
| 2026-01-27 | TDD Green: 重複チェック・レートリミット実装完了（adapter.ts, rateLimit.ts） |
| 2026-01-27 | セッション一覧画面の個別要件定義書を作成（requirements-session-list.md） |
| 2026-01-27 | Server Action統合: 重複チェック・レートリミットをcreateScenarioActionに組み込み |
| 2026-01-27 | フロントエンド改善: useSystemMessageでエラー・成功メッセージ表示 |
| 2026-02-23 | PROGRESS全規模監査実施、テスト状態の細分化（[x]/[-]/[ ]）、計画書進捗セクション追加 |
| 2026-03-10 | セッションシナリオ変更機能 完了（adapter/action/schema/UI + テスト5件） |
| 2026-06-14 | E2E失敗対応 D/C/A/B。フル実測 286 passed / 3 failed / 1 fixme（63→3）。実バグ3件(Button asChild/Select a11y/新規セッションのクライアント検証非表示)修正。Bは誤診で実体staleセレクタ。残3は並列実行+共有DBのフレーク2件(search:70 mobile / home:21)+新規表面化1件(session-lifecycle:138)＝Docker+seed分離の保留タスクで解消見込み |
| 2026-06-14 | E2Eポート競合を根本解決（専用3100/`next start`/`kill-port`/`open:never`）+ dev3000固定（predevガード）。フル実行で221 passed/63 failed判明→4カテゴリに分類し対応方針を記録（`44f4807` 他） |
| 2026-06-13 | `feature/session-flow`(113コミット)を develop へマージ（`da2cd09`）。DBスキーマ移行(discord_id→auth_user_id+discord_account_id、game_schedules廃止)を本対応で収束。検証: 旧スキーマ参照0 / tsc 0 / build 全25ルート成功 / biome クリーン / vitest 1168 passed・16 skipped。バックアップ: `backup/develop-pre-sessionflow-merge` |

---

## 次のアクション

> **ベースライン**: `feature/session-flow`（113コミット）をマージ済み（2026-06-13, `da2cd09`）。develop が唯一の最新ソース。

### 優先度A: テスト品質改善（横断的課題）
1. DB統合テストのskip問題を解決（Supabase Local or モック化）
2. 偽陽性テスト（`expect(true).toBe(true)` / 表中 `[-]` マーク）を `it.skip` に統一
3. `createScenarioAction` のテスト作成
4. adapter/actions テストのモック→実装呼び出し化（`AuthRedirect` のテスト含む）

### 優先度B: 未完了機能
1. ダッシュボード残り: StatsSection, QuickActions（`dashboard-redesign.md`）
2. セッション作成ボタンの配置改善（P1-016）
3. `updateSession` のテスト追加（※機能実装済み・日程調整機能は完了済み）
4. `checkUserNameAvailability` のSupabase実装（現状スタブ）
5. SignupModal「好きなシステム」チップUI + `user_favorite_systems` テーブル作成（マイグレーション）
6. シナリオ編集画面
7. セッション完了後のレビュー導線（CompleteSessionDialog → レビュー画面）

### 優先度C: セキュリティ・運用
1. RLSポリシー設定（users / scenarios / sessions）
2. シナリオ自動インポート Step 6: 利用規約・通報機能
3. BOOTH/TALTO への事前連絡・許諾確認

### 優先度D: 品質改善・技術的負債
1. `_components/` フォルダ構成の刷新（`docs/plans/components-folder-restructure.md`、Batch 1-10）— [Issue #3](https://github.com/kotyabuchi/scenario-manager/issues/3)
2. TDD Refactor（全機能でリファクタ未実施）
3. deploy.yml の dead env var 削除（`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`）
4. インフラ記述（Drizzle/Hyperdrive 歴史的記述）の整理 + Chipディレクトリ名の kebab-case 化
5. UI/UX P2残タスク 8件、FilterBottomSheet のスワイプダウン閉じジェスチャー
6. `borders.soft` トークンを他画面（シナリオ一覧 / セッション一覧）へ展開
7. [ ] PandaCSS任意値のアンダースコア記法バグ修正（2026-07-07発見）
   - PandaCSSの `[...]` はTailwindと異なりアンダースコアを空白に変換しない → 不正値として宣言ごと破棄され**スタイルが静かに無効化**されている
   - 対象（生成CSSで宣言が空 `{ }` になっているのを確認済み）:
     - `src/components/blocks/ScheduleCalendar/styles.ts:24-25`（gridTemplateColumns/Rows → カレンダーのグリッド定義が無効）
     - `src/components/blocks/ScheduleCalendar/styles.ts:208,227,246`（boxShadow 3箇所）
     - `src/components/blocks/BottomNav/styles.ts:25`（上方向シャドウ）
     - `src/app/(main)/sessions/[id]/styles.ts:154,543`（boxShadow / radial-gradient）
   - 修正はアンダースコア→空白の置換だが、**今まで無効だったスタイルが突然適用されて見た目が変わる**ため、画面ごとに表示確認しながら適用すること（特にScheduleCalendar）
8. [ ] SectionToc の下線アニメの _motionReduce(0ms化) を削除（2026-07-11方針決定）
   - `src/components/blocks/SectionToc/styles.ts:56-58`
   - 方針: 小さな機能フィードバック（アイコン回転・2px下線の伸長等）は
     prefers-reduced-motion でも動かす（ネタバレキャレット f4726fa と同判断）。
     reduced-motion で抑制するのは大きな移動・視差などの前庭刺激系のみ
   - SectionToc は現在パネル未使用（将来のページ側目次で再利用予定）のため実害なし
9. [ ] 旧メインカラー・生カラー直書きの残骸をトークンへ置換（2026-07-09棚卸し）
   - 現行パレットは色相148。select.ts レシピは primary.{subtle,subtleHover,text} へ置換済み
   - **旧メインカラー（H=163 / emerald #10b981 / #059568 / rgba(5,149,104)）の残り**:
     - `src/components/blocks/GlobalHeader/styles.ts`: oklch直書き11箇所（163系8＋150系3）※lg非表示・廃止判断待ち
     - `src/components/blocks/ScheduleCalendar/styles.ts`: `#10b981` 5箇所（＋slate系hex `#334155` `#64748b` 等が多数）
     - `src/components/blocks/SignupModal/styles.ts`: `rgba(5,149,104,0.25)` 影2箇所
     - `src/components/elements/system-badge/system-badge.tsx`: colorMap の green `#059568`
     - `src/app/(main)/sessions/[id]/styles.ts` 3箇所、schedule/availability の2コンポーネント各1箇所
   - **旧色ではないが規約違反の生カラー**（優先度低・機械的に置換可）:
     - 影の直書き `[0 1px 2px rgba(0,0,0,0.05)]` 等: checkbox/dropdown/number-input/pagination/radio/switch/tags-input/tabs/skeleton/toast/toggle-group、select・comboboxレシピ → `shadows.*` トークンへ集約
     - Tailwind系hex: tags-input `#D54443`、tabs `#E5E7EB`、skeleton のgradient
   - 例外としてOK: Tag のOKLCH（データ駆動動的色）、stories/test 内のモック色
   - 注意: 見た目が変わる置換（特に ScheduleCalendar・SignupModal）は画面確認しながら実施
10. [ ] コーディング規約の「セミコロンなし」記述と実態の食い違いを解消（2026-07-20 Codexハーネスのドライランで発覚）
    - 実態: `biome.json` に `semicolons` 設定が無く Biome デフォルト `"always"` が効く。コミット済みコードはセミコロンあり（例: `src/types/result.ts`）。ユーザーは打っていないが Biome が整形時に自動付与している
    - 食い違い: `.claude/rules/coding-standards.md` §1 は「セミコロン: なし」（→ AGENTS.md にもミラーされ Codex に誤った指示が届く）
    - 方針は現状維持で保留。将来どちらかに揃える:
      - (A) 実態に合わせ coding-standards.md を「セミコロンあり（Biome自動付与）」に修正（biome.json 変更なし・差分ゼロ）
      - (B) 本当に無しにするなら biome.json に `javascript.formatter.semicolons: "asNeeded"` を追加（`pnpm check` で全コード一括除去＝大きな整形差分）
    - どちらでも決着後に `pnpm gen:agents` で AGENTS.md が自動追従する

---

## 完了済み（参考）

- **DBスキーマ移行**: `discord_id` → `auth_user_id` + `discord_account_id`、`game_schedules` 廃止 → `game_sessions.schedule_date/phase`（2026-06-13 マージで収束）
- **セッション詳細 編集UI**（バックエンド + UI 全完了）: ToolsSection / キャラクターシート編集 / GMメモ インライン編集 / 基本情報編集 / シナリオ変更
- **セッション画面 モックデザイン適合**（#1〜#10 全完了、上記「セッション画面 モックデザイン適合リファクタリング」参照）
