# セッションフロー E2E テスト拡充計画

## Context

セッションフロー機能のE2Eテストカバレッジに大きなギャップがある。現在はセッション作成・詳細表示・ダイアログ開閉のみがカバーされており、ユーザーの主要操作パスであるスケジュール提出・日程確定・フェーズ遷移が未テスト。本計画で GM 単独で検証可能な全ユースケースをカバーする。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| テストファイル構成 | サブページ構造テスト + ライフサイクル通しテスト | 独立テスト + フェーズ依存テストの分離 |
| 日程確定テスト | ライフサイクル内で募集締切後に実施 | PREPARATION フェーズのみアクセス可（`scheduleFlowGuards.ts:74`） |
| 「募集を締める」 | ダイアログなし、直接 Server Action 呼び出し | `SessionActions.tsx:108` で `updateSessionPhaseAction` 直接実行 |
| キャンセル操作 | DotsThree メニュー → Menu.Item で開く | `SessionActions.tsx:221` `aria-label="その他の操作"` |
| 既存PO拡張 | `session-detail-page.ts` にメソッド追加 | フェーズステッパー・メニュー操作用 |
| テスト実行環境 | デスクトップ viewport（デフォルト 1280x720）前提 | モバイルビューポートテストは別計画で追加 |
| ライフサイクルテスト | `test.describe.configure({ mode: 'serial' })` | フェーズ遷移の順序依存性のため並列実行不可 |
| datetime-local 入力 | `page.fill(selector, 'YYYY-MM-DDTHH:mm')` 形式 | 30分刻み値を使用（バリデーション整合性） |

## 前提条件

- `e2e/helpers/cleanup.ts` の `cleanupE2ESessions()` を拡張し、`session_availability_time_blocks` と `game_schedule_time_blocks` テーブルの削除を追加する必要がある（Batch 1 で対応）

---

## Batch 1: Page Object 3クラス + ヘルパー追加 + cleanup 拡張

### Step 1-0. cleanupE2ESessions の拡張

`e2e/helpers/cleanup.ts` の `cleanupE2ESessions()` に以下のテーブル削除を追加（`session_participants` 削除の前に実行）:

```typescript
// 可用枠・確定日程の関連テーブルを削除
await supabase
  .from('session_availability_time_blocks')
  .delete()
  .in('session_id', sessionIds);
await supabase
  .from('game_schedule_time_blocks')
  .delete()
  .in('session_id', sessionIds);
```

### Step 1-1. AvailabilityPage の作成

`e2e/pages/availability-page.ts` を新規作成。

主要 Locator:
- `pageTitle`: `heading level:1` → "スケジュールを提出"
- `startInput`: `getByLabel('開始')` (datetime-local)
- `endInput`: `getByLabel('終了')` (datetime-local)
- `addButton`: `button 名:追加`
- `editorErrorAlert`: `role:alert`
- `saveButton`: `button 名:/提出を保存/`
- `successMessage`: `text:スケジュールを保存しました。`
- `emptyScheduleMessage`: `text:まだスケジュールがありません`
- `scheduleCountText`: 件数表示（`N件`）

メソッド:
- `goto(sessionId)`: navigate
- `addTimeBlock(start, end)`: `page.fill()` で datetime-local に `YYYY-MM-DDTHH:mm` 形式の値を設定 → 追加ボタンクリック
- `save()`: 保存ボタンクリック

### Step 1-2. ScheduleConfirmPage の作成

`e2e/pages/schedule-confirm-page.ts` を新規作成。

主要 Locator:
- `pageTitle`: heading → "日程を確定する"
- `calendarTitle`: text "日程確定カレンダー"
- `emptyConfirmedMessage`: text "おすすめ一覧から候補を選択してください。"
- `emptyRecommendationMessage`: text "スケジュールが不足しています"
- `confirmButton`: `button 名:/日程を確定/`

メソッド: `goto(sessionId)`

### Step 1-3. ApplicationsPage の作成

`e2e/pages/applications-page.ts` を新規作成。

主要 Locator:
- `tabAll` / `tabPending` / `tabConfirmed`: `#tab-all` / `#tab-pending` / `#tab-confirmed`
- `tabPanel`: `#tabpanel-applications`
- 空状態: 各タブのメッセージテキスト

メソッド: `goto(sessionId)`

### Step 1-4. datetime ヘルパーの作成

`e2e/helpers/datetime.ts` を新規作成。

```typescript
/** 翌週の datetime-local 形式文字列を生成 */
getNextWeekDateTimeLocal(dayOffset, hour, minute): string
```

テスト実行日に依存しない未来日時を生成。

---

## Batch 2: サブページ構造テスト

### Step 2-1. session-subpages.spec.ts の作成

`e2e/auth/session-subpages.spec.ts` を新規作成。セッション作成後、各サブページの構造を検証。

**テスト一覧:**

申請管理ページ（`/sessions/[id]/applications`）:
- ページタイトル表示
- 3タブ（すべて / 承認待ち / 承認済み）表示
- すべてタブが初期選択
- タブ切り替え動作
- 空状態メッセージ表示
- a11y 違反なし

スケジュール提出ページ（`/sessions/[id]/availability`）:
- ページタイトル "スケジュールを提出" 表示
- カレンダー + 追加フォーム表示
- 空状態メッセージ表示
- 時間帯を追加 → 件数表示更新
- 保存 → 成功メッセージ表示
- 保存後リロード → 追加したスケジュールが表示されている（永続化確認）
- a11y 違反なし

日程確定ページ（RECRUITING フェーズ → リダイレクト確認のみ）:
- RECRUITING フェーズでアクセス → `/sessions/[id]` にリダイレクト

### Step 2-2. SessionDetailPage へのメソッド追加

`e2e/pages/session-detail-page.ts` に追加:
- `phaseSection`: `section[aria-label="セッション進行フェーズ"]`
- `moreActionsButton`: `button[aria-label="その他の操作"]`
- `clickMoreActionsMenu()`: DotsThree メニューを開く
- `getPhaseText()`: 現在のフェーズテキストを取得

---

## Batch 3: フェーズ遷移ライフサイクルテスト

### Step 3-1. session-lifecycle.spec.ts の作成

`e2e/auth/session-lifecycle.spec.ts` を新規作成。セッションのライフサイクルを一連のフローでテスト。

**重要**: `test.describe.configure({ mode: 'serial' })` でテストを逐次実行する。`fullyParallel: true` 環境でフェーズ遷移の順序依存性を保証するため。

**テスト構成:**

RECRUITING フェーズ:
- フェーズステッパーに「募集中」が表示される
- 「募集を締める」ボタンが表示される
- 「申請管理」「スケジュールを提出」リンクが表示される
- 「キャンセル」がメニュー内に表示される

スケジュール提出（RECRUITING フェーズ内）:
- スケジュール提出ページに遷移
- 時間帯を1件追加（`page.fill()` で datetime-local に未来日時を設定）
- 保存 → 成功メッセージ確認

募集締切（RECRUITING → PREPARATION）:
- セッション詳細に戻る
- 「募集を締める」クリック → 成功メッセージ「募集を締めました。準備フェーズに移行しました」
- フェーズステッパーが「準備中」に更新

日程確定（PREPARATION フェーズ）:
- 日程確定ページにアクセス可能
- 日程確定ページの構造確認（カレンダー、確定候補パネル）
- おすすめ候補にGM自身のスケジュールが表示される（requiredUsers=1 のため全員参加可）
- 候補をクリック → 確定候補パネルに追加
- 「日程を確定」クリック → 成功メッセージ確認

キャンセル操作:
- セッション詳細に戻る
- DotsThree メニュー → キャンセル → ダイアログ表示
- 理由入力 + 確認テキスト「キャンセル」入力 → 実行
- フェーズが「キャンセル」に変更（enum label: `SessionPhases.CANCELLED.label` = 'キャンセル'）

---

## ファイル一覧

| ファイル | 種別 | 内容 |
|---------|------|------|
| `e2e/helpers/cleanup.ts` | 変更 | time_blocks テーブル削除追加 |
| `e2e/pages/availability-page.ts` | 新規 | スケジュール提出 PO |
| `e2e/pages/schedule-confirm-page.ts` | 新規 | 日程確定 PO |
| `e2e/pages/applications-page.ts` | 新規 | 申請管理 PO |
| `e2e/helpers/datetime.ts` | 新規 | datetime-local ヘルパー |
| `e2e/auth/session-subpages.spec.ts` | 新規 | サブページ構造テスト |
| `e2e/auth/session-lifecycle.spec.ts` | 新規 | ライフサイクルテスト（serial） |
| `e2e/pages/session-detail-page.ts` | 変更 | フェーズ・メニュー操作追加 |

## 検証方法

`/exec-plan` 前提で、各 Batch 完了後に `pnpm check` + `pnpm vitest` + `/review-diff` が自動実行される。

```bash
# 新規テスト実行
pnpm exec playwright test e2e/auth/session-subpages.spec.ts
pnpm exec playwright test e2e/auth/session-lifecycle.spec.ts

# 全 E2E テスト
pnpm exec playwright test

# lint/型チェック
pnpm check
```
