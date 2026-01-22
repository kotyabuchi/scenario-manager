# プロジェクト進捗管理

> **このファイルは複数のClaude Codeインスタンスで共有されます**
> タスク着手時は `⬜` → `🔄` に、完了時は `✅` に変更してください

---

## TDD開発フロー

```
/requirements → /gen-test → /implement-tests → /refactor
    ↓              ↓              ↓               ↓
 要件定義        Red           Green          Refactor
```

| スキル | フェーズ | 説明 |
|--------|---------|------|
| `/requirements` | 要件定義 | 仕様策定 → `.claude/requirements/` |
| `/gen-test` | Red | 失敗するテストを書く |
| `/implement-tests` | Green | テストを通す最小実装 |
| `/refactor` | Refactor | テスト維持しながら品質改善 |
| `/fix-bug` | バグ修正 | 再現テスト作成 → 修正 → 検証 |

---

## TDD進捗

> **凡例**: ⬜ 未着手 / 🔄 作業中 / ✅ 完了
>
> **要件定義書**: `.claude/requirements/` 配下

### シナリオ検索（requirements-v1.md Section 5）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| searchScenarios | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| toSearchParams | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getAllSystems | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getAllTags | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |

**テストファイル**:
- `src/app/(main)/scenarios/__tests__/searchFormSchema.test.ts`
- `src/app/(main)/scenarios/__tests__/searchScenarios.test.ts`
- `src/app/(main)/scenarios/__tests__/searchParams.test.ts`
- `src/app/(main)/scenarios/__tests__/masterData.test.ts`

---

### シナリオ登録（requirements-v1.md Section 4）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| scenarioFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| createScenario | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getUserByDiscordId | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |

**テストファイル**:
- `src/app/(main)/scenarios/new/__tests__/schema.test.ts`
- `src/app/(main)/scenarios/new/__tests__/adapter.test.ts`

---

### シナリオ詳細（requirements-v1.md Section 10）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| getScenarioDetail | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getScenarioReviews | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getScenarioSessions | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getScenarioVideoLinks | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getUserScenarioPreference | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getUserByDiscordId | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| toggleFavorite | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| togglePlayed | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |

**テストファイル**:
- `src/app/(main)/scenarios/[id]/__tests__/adapter.test.ts`

---

### セッション一覧（requirements-v1.md Section 11）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchPublicSessions | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getUpcomingSessions | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getHistorySessions | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getCalendarSessions | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| getAllSystems | ✅ | ✅ | ✅ | ✅ | ⬜ | 完了 |

**テストファイル**:
- `src/app/(main)/sessions/__tests__/adapter.test.ts`

---

### セッション管理（requirements-session-flow.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| sessionFormSchema | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| createSession | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| updateSession | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| 日程調整機能 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| 参加申請機能 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |

---

### プロフィール

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| profileFormSchema | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（要件・テスト未） |
| updateUserProfile | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（要件・テスト未） |
| getUserById | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（要件・テスト未） |

---

### レビュー機能（requirements-review-ui.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| reviewFormSchema | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| createReview | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| updateReview | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| deleteReview | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |

---

### フィードバック機能（requirements-feedback.md）

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| feedbackFormSchema | ✅ | ⬜ | ⬜ | 🔄 | ⬜ | 実装中 |
| createFeedback | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| getFeedbackList | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
| toggleFeedbackVote | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |

---

### 基盤コンポーネント

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| Button | ⬜ | ✅ | ✅ | ✅ | ⬜ | 完了 |
| Card | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未） |
| Chip | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未） |
| Modal | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | 実装済（テスト未） |

**テストファイル**:
- `src/components/elements/button/button.test.tsx`

---

## インフラ・設定（TDD対象外）

### DB接続・マイグレーション ✅
- [x] Supabase接続設定
- [x] Drizzle ORM設定
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
- [x] Hyperdrive設定
- [x] GitHub Actions

---

## UI/UXリファクタリング

**レビュー日**: 2026-01-19
**詳細レポート**: [UI_REVIEW_REPORT.md](../UI_REVIEW_REPORT.md)

| 優先度 | 完了 | 残り |
|--------|------|------|
| P0: 致命的 | 12件 | 0件 |
| P1: 重要 | 12件 | 6件 |
| P2: 推奨 | 0件 | 8件 |

**P1残タスク**:
- [ ] P1-006: ルートページCTAボタンの階層明確化
- [ ] P1-007: Login/Signupボタンをヘッダー右上に移動
- [ ] P1-014: フォームのエラー表示を追加
- [ ] P1-016: セッション作成ボタンの配置を改善
- [ ] P1-017: ホームページのダッシュボード実装

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

---

## 次のアクション

### 優先度A: テスト追加
既存実装のテストカバレッジを向上:
1. `createScenario` のテスト作成
2. シナリオ詳細系関数のテスト作成
3. セッション一覧系関数のテスト作成

### 優先度B: 新機能実装（TDDで）
1. レビュー機能（/gen-test → /implement-tests）
2. フィードバック機能の完成
3. セッション管理機能

### 優先度C: 未完了タスク
1. シナリオ編集画面
2. RLSポリシー設定
3. UI/UXリファクタリング残タスク
