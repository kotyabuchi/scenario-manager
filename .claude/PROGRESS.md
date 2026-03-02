# プロジェクト進捗管理

> **このファイルは複数のClaude Codeインスタンスで共有されます**
> タスク着手時は `⬜` → `🔄` に、完了時は `✅` に変更してください

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

> **凡例**:
> - ⬜ 未着手 / 🔄 作業中 / ✅ 完了
> - テスト状態: ✅ = テスト実行パス / 🔸 = テストコード存在するが skip/skipIf で未実行、またはモック・偽陽性のみ / ⬜ = テスト不在
>
> **要件定義書**: `.claude/requirements/` 配下

### シナリオ検索（requirements-v1.md Section 5）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（28テスト通過） |
| searchScenarios | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（テスト全件 describe.skip） |
| toSearchParams | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（15テスト通過） |
| getAllSystems | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（DB未接続時に偽陽性パターン） |
| getAllTags | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（DB未接続時に偽陽性パターン） |

**テストファイル**:
- `src/app/(main)/scenarios/__tests__/searchFormSchema.test.ts`
- `src/app/(main)/scenarios/__tests__/searchScenarios.test.ts`
- `src/app/(main)/scenarios/__tests__/searchParams.test.ts`
- `src/app/(main)/scenarios/__tests__/masterData.test.ts`

---

### シナリオ登録（requirements-scenario-new.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| scenarioFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（30テスト通過） |
| createScenario | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト4件 it.skip） |
| getUserByDiscordId | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（正常系テスト it.skip） |
| checkScenarioNameDuplicate | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（describe.skip で全件スキップ） |
| checkDistributeUrlDuplicate | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（describe.skip で全件スキップ） |
| checkRateLimit | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（7テスト通過、DB不要） |
| createScenarioAction | ✅ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テストファイル不在） |

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
| getScenarioDetail | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| getScenarioReviews | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| getScenarioSessions | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| getScenarioVideoLinks | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| getUserScenarioPreference | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| getUserByDiscordId | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| toggleFavorite | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |
| togglePlayed | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト it.skip） |

**テストファイル**:
- `src/app/(main)/scenarios/[id]/__tests__/adapter.test.ts`

---

### セッション一覧（requirements-session-list.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（7テスト通過） |
| searchParamsParsers | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（toPublicSearchParams テスト6件通過、パーサー自体のテストなし） |
| searchPublicSessions | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（6件中5件 skipIf） |
| getUpcomingSessions | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（3件中2件 skipIf） |
| getHistorySessions | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（6件中5件 skipIf） |
| getCalendarSessions | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（4件中3件 skipIf） |
| getAllSystems | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（DB接続失敗時フォールバック） |

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
| sessionFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（37テスト通過） |
| createSession | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト8件 skipIf、型検証6件通過） |
| getSessionById | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト4件 skipIf） |
| updateSession | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| 日程調整機能 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| applyToSession | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト6件 skipIf、定数検証1件通過） |
| approveApplication | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト3件 skipIf） |
| rejectApplication | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト2件 skipIf） |
| withdrawFromSession | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト3件 skipIf） |
| cancelApplication | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト2件 skipIf） |
| cancelSession | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（統合テスト4件 skipIf） |

**テストファイル**:
- `src/app/(main)/sessions/new/__tests__/schema.test.ts`
- `src/app/(main)/sessions/new/__tests__/adapter.test.ts`
- `src/app/(main)/sessions/__tests__/participantAdapter.test.ts`

**実装ファイル**:
- `src/app/(main)/sessions/new/adapter.ts` - セッション作成・取得
- `src/app/(main)/sessions/participantAdapter.ts` - 参加申請管理

**TODO**:
- [ ] セッション募集フォームの日時入力で、`From` 入力完了時に `To` へ即フォーカス移動（`datetime-local` の自動補完で誤判定）。独自 `DateTimeInput` 作成後に再対応。

---

### 認証画面（requirements-auth.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| signupFormSchema (Step1) | ✅ | ✅ | ✅ | ✅ | ⬜ | Green完了（12テスト通過） |
| signupStep2Schema | ✅ | ✅ | ✅ | ✅ | ⬜ | Green完了（5テスト通過） |
| checkUserNameAvailability | ✅ | ✅ | ✅ | ⬜ | ⬜ | テスト設計済（モック）、実装はスタブ |
| registerUser (createUser) | ✅ | ✅ | ✅ | ✅ | ⬜ | Green完了（テストはモック、実装はServer Action済） |
| generateUserName | ✅ | ✅ | ✅ | ✅ | ⬜ | Green完了（6テスト通過） |
| SignupModal | ✅ | ✅ | ✅ | ✅ | ⬜ | Green完了（29テスト通過） |
| AuthRedirect | ✅ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（useDiscordAuth + AuthContext + callback）テスト未 |

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
| profileFormSchema | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（17テスト通過、要件未定義） |
| updateUserProfile | ⬜ | ✅ | 🔸 | ✅ | ⬜ | 実装済（テスト8件中6件 it.skip） |
| getUserById | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（要件・テスト未） |
| getUserByDiscordId (profile) | ⬜ | ⬜ | 🔸 | ✅ | ⬜ | 実装済（テスト2件中1件 skip） |
| updateProfile (Server Action) | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未） |
| ProfileEditFormWrapper | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未） |

**テストファイル**:
- `src/components/blocks/Profile/__tests__/schema.test.ts`
- `src/app/(main)/profile/__tests__/adapter.test.ts`

**実装ファイル**:
- `src/app/(main)/profile/page.tsx` — プロフィール編集ページ
- `src/app/(main)/profile/adapter.ts` — DB操作（getUserByDiscordId, updateUserProfile）
- `src/app/(main)/profile/actions.ts` — Server Action（updateProfile）
- `src/app/(main)/profile/_components/ProfileEditFormWrapper.tsx` — フォームラッパー
- `src/app/(main)/users/[id]/page.tsx` — ユーザー公開プロフィール
- `src/app/(main)/users/[id]/adapter.ts` — getUserById

---

### レビュー機能（requirements-review-ui.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| reviewFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（19テスト通過） |
| createReview | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト3件 it.skip） |
| updateReview | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト2件 it.skip） |
| deleteReview | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（主要テスト1件 it.skip） |

**テストファイル**:
- `src/app/(main)/scenarios/[id]/__tests__/schema.test.ts`
- `src/app/(main)/scenarios/[id]/__tests__/adapter.test.ts`

---

### フィードバック機能（requirements-feedback.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| feedbackFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（18テスト通過） |
| createFeedbackAction | ✅ | ✅ | 🔸 | ✅ | ⬜ | 実装済（actions.test.ts はスキーマテスト14件のみ通過、Server Action呼び出しテスト3件 it.skip） |
| FeedbackModal | ✅ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未） |
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
| SpeedDialFAB | ✅ | ✅ | ✅ | ✅ | ⬜ | 統合完了（14テスト通過） |
| useSpeedDial | ✅ | ✅ | ✅ | ✅ | ⬜ | 統合完了（6テスト通過） |
| shareCurrentPage | ✅ | ✅ | ✅ | ✅ | ⬜ | 統合完了（3テスト通過） |
| BottomNav統合 | ✅ | ✅ | ✅ | ✅ | ⬜ | 統合完了（専用テストなし、SpeedDialFAB経由で間接カバー） |
| QuickSearchModal | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済（Phase 2） |
| searchScenariosQuick | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済（Phase 2） |

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
| Button | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（23テスト通過） |
| Card | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（8テスト通過） |
| Chip | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（18テスト通過） |
| Modal | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（8テスト通過） |
| Select | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了（14テスト通過） |
| Input | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（23テスト通過） |
| Textarea | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（16テスト通過） |
| ToggleGroup | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（16テスト通過） |
| Avatar | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了（12テスト通過） |
| FormField | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未、Storybook あり） |

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

### DB接続・マイグレーション ✅
- [x] Supabase接続設定
- [x] Supabase JS Client（旧Drizzle ORM — Supabase JS Client に移行済み）
- [x] マイグレーション実行
- [x] シードデータ投入

### 認証設定 ✅
- [x] Supabase Auth設定
- [x] Discord OAuth連携
- [x] 認証ミドルウェア

### RLSポリシー（未実施）
- [ ] usersテーブル
- [ ] scenariosテーブル
- [ ] sessionsテーブル

### デプロイ設定 ✅
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
| `icon-migration.md` | ✅ 完了 | lucide-react/react-icons の import は 0件。@phosphor-icons/react に統一済み |
| `dashboard-redesign.md` | ほぼ完了 | HeroSection, UpcomingSessions, ActivityTimeline, NewScenarios, MiniCalendar, SystemNotice 実装済。**StatsSection, QuickActions 未実装** |
| `scenario-search-redesign.md` | Phase 0-3 実装済 | Phase 0（Pencil統一）、Phase 2（ドラフト状態 useFilterDraft）、Phase 3（SearchTopBar/SearchSidebar/MobileSearchBar）完了 |
| `select-redesign.md` | ✅ 完了 | Issue #1 マージ済（ValueText コンポーネント化、オーバーフロー対応） |
| `e2e-testing-plan.md` | ✅ 基盤完了 | E2Eテスト基盤構築済み |
| `e2e-test-expansion.md` | 未着手 | 前提条件の aria-current は実装済み |
| `e2e-scenario-import.md` | 未着手 | — |
| `components-folder-restructure.md` | ⬜ 未着手 | `_components/` フォルダ構成の刷新（Batch 1-10）。レビュー反映済み。[Issue #3](https://github.com/kotyabuchi/scenario-manager/issues/3) |
| `feedback-deferred-items.md` | 部分実装 | ActionSection 存在（削除・編集機能の一部が実装済みの可能性） |
| `import-url-detection.md` | 未着手 | — |
| `scenario-auto-import.md` | Step 5 完了、Step 6 未着手 | 下記セクション参照 |

---

## シナリオ自動インポート機能

**計画書**: `docs/plans/scenario-auto-import.md`

### 実装進捗

| ステップ | 内容 | 状態 |
|---------|------|------|
| Step 1 | DBスキーマ変更（source_type, source_url, source_fetched_at） | ✅ |
| Step 1.5 | HTMLパーサー PoC（cheerio + Edge Runtime） | ✅ |
| Step 2 | 外部サイトパーサー実装（url-validator, sanitizer, booth/talto-parser） | ✅ |
| Step 3 | インポート登録ページ（/scenarios/import） | ✅ |
| Step 4 | シナリオ一覧ページへの導線追加 | ✅ |
| Step 5 | UI改善（配布元リンク表示、出典情報） | ✅ |
| Step 6 | 利用規約・通報機能 | ⬜ |

> **Step 5 詳細**: 配布元リンク表示、ソースバッジ（Booth/TALTO）、インポートフォームソース情報バナー、readOnlyフィールド、著作権注意メッセージが全て実装済み。

### 利用規約調査（2026-02-10 完了）

| サイト | 規約確認 | robots.txt | リスク評価 | 事前連絡 |
|--------|:-------:|:----------:|-----------|:-------:|
| BOOTH（pixiv） | ✅ | ✅ 商品ページ制限なし | 低（2025年10月に「常識的なスクレイピング歓迎」方針） | ⬜ |
| TALTO（ココフォリア） | ✅ | ✅ /projects/* 許可 | 低〜中（「情報収集」条項の解釈に幅あり） | ⬜ |

**「商業目的」条項**: scenario-managerは管理ツールでありBOOTH/TALTOと競合しない。事実情報のメタデータ参照のみで「サービスの商業利用」には非該当 → リスク低

### 残タスク（リリース前）

- [ ] pixiv社（BOOTH）への事前連絡・許諾確認
- [ ] ココフォリア社（TALTO）への事前連絡・許諾確認
- [ ] 連絡結果に応じた対応（許諾→公開 / 条件付き→調整 / 拒否→パーサー無効化）

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
| 2026-02-23 | PROGRESS全規模監査実施、テスト状態の細分化（✅/🔸/⬜）、計画書進捗セクション追加 |

---

## 次のアクション

### 優先度A: テスト品質改善（横断的課題）
1. DB統合テストのskip問題を解決（Supabase Local or モック化）
2. 偽陽性テスト（`expect(true).toBe(true)`）を修正
3. `createScenarioAction` のテスト作成

### 優先度B: 未完了機能
1. ダッシュボード残り: StatsSection, QuickActions
2. セッション作成ボタンの配置改善（P1-016）
3. updateSession / 日程調整機能
4. `checkUserNameAvailability` のSupabase実装
5. SignupModal「好きなシステム」チップUI + `user_favorite_systems` テーブル

### 優先度C: セッション詳細 編集UI（バックエンド実装済み → UI層のみ）

| # | 対象 | 概要 | 状態 |
|---|------|------|------|
| 1 | ToolsSection | セッションリンクの一覧表示・追加・編集・削除UI | ✅ |
| 2 | キャラクターシート編集 | ParticipantCardにCS URL編集UIを追加 | ✅ |
| 3 | GMメモ インライン編集 | GMNotesSectionにインライン編集UIを追加 | ✅ |
| 4 | 基本情報編集 | BasicInfoSectionの編集フォーム（adapter/action/schemaも必要） | ✅ |

### 優先度D: 未完了タスク
1. シナリオ編集画面
2. RLSポリシー設定
3. シナリオ自動インポート Step 6: 利用規約・通報機能
4. BOOTH/TALTOへの事前連絡
5. UI/UXリファクタリング残タスク
6. FilterBottomSheet にスワイプダウンで閉じるジェスチャーを追加（ハンドルバーは見た目のみで未実装）

### 優先度D: 品質改善
1. `_components/` フォルダ構成の刷新（`docs/plans/components-folder-restructure.md`、Batch 1-10）— [Issue #3](https://github.com/kotyabuchi/scenario-manager/issues/3)
2. TDD Refactor（全機能でリファクタ未実施）
3. deploy.yml の dead env var 削除（`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`）
