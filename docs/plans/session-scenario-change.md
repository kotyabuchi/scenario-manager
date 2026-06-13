# セッション シナリオ変更機能

## Context

セッション詳細画面の基本情報セクション（`BasicInfoSection`）では、セッション名・募集文・参加上限・初心者歓迎の編集が実装済みだが、**シナリオの変更機能が未実装**。`game_sessions.scenario_id`カラムは存在し、セッション作成時にはシナリオ選択UIが提供されているが、作成後に変更する手段がない。

GM がセッション詳細画面からシナリオを変更（または解除）できるようにする。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| UI配置 | BasicInfoSection のシナリオ表示部分に「変更」ボタンを追加 | 既存の編集パターン（鉛筆アイコン+編集ボタン）と統一 |
| シナリオ検索 | `sessions/new/` の `ScenarioSearchModal` を再利用 | 検索・フィルタ・選択UIが完成しているため |
| `invitedMembers` | 空配列を渡す | 編集時は既に参加者がいるので人数互換チェックは不要 |
| API設計 | `updateSessionScenario(sessionId, scenarioId \| null, expectedUpdatedAt)` | null で「シナリオ解除」に対応。楽観的ロック付き |
| 楽観的更新 | シナリオ変更はページ全体の情報（プレイ時間等）に影響するため、`revalidatePath` のみでUI更新 | 部分的な楽観的更新では整合性を保てない |
| フェーズ制限 | RECRUITING / PREPARATION フェーズのみ変更可能 | COMPLETED/CANCELLED 後のシナリオ変更は履歴・レビュー文脈を壊す |
| シナリオ解除 | 確認ダイアログを表示してから実行 | 誤操作で scenario_id=null になると復旧にシナリオ再検索が必要 |
| エラー表示 | Conflict/権限不足/その他エラーをUI上に表示。isPending で二重送信防止 | 無言失敗を避ける |
| スマートフィルタ | `invitedMembers=[]` 時はスマートフィルタをデフォルトOFFにする | 空配列ではフィルタが形骸化するため |
| ScenarioSearchModal共通化 | 本機能では `sessions/new` から直接 import。共通化は別タスク | スコープを超えるため段階的に対応 |

## 前提条件

- `game_sessions.scenario_id` カラムが nullable で存在する（確認済み）
- `ScenarioSearchModal` が `sessions/new/` に実装済み（再利用可能）
- `BasicInfoEditForm` で基本情報の編集パターンが確立済み

---

## Batch 1: バックエンド（Adapter + Action + Schema + テスト）

### Step 1-1. Adapter関数の追加

- 対象ファイル: `src/app/(main)/sessions/[id]/adapter.ts`
- 変更内容:
  - `updateSessionScenario(sessionId: string, scenarioId: string | null, expectedUpdatedAt: string): Promise<Result<void>>` を追加
  - 楽観的ロック（`updated_at` 一致チェック）
  - `scenario_id` を更新（null の場合はシナリオ解除）

### Step 1-2. Zodスキーマの追加

- 対象ファイル: `src/app/(main)/sessions/[id]/schema.ts`
- 変更内容:
  - `sessionScenarioSchema` を追加: `{ scenarioId: z.string().trim().min(1).nullable() }`
  - null 時はシナリオ解除、非null時は空文字/空白を弾く

### Step 1-3. Server Actionの追加

- 対象ファイル: `src/app/(main)/sessions/[id]/actions.ts`
- 変更内容:
  - `updateScenarioAction(sessionId, expectedUpdatedAt, scenarioId)` を追加
  - 認証・認可チェック（`isSessionManager`）
  - **フェーズガード**: RECRUITING / PREPARATION 以外は拒否（`getSessionPhase` で確認）
  - Zodバリデーション
  - `updateSessionScenario` 呼び出し
  - FK違反（存在しない scenarioId）時はユーザー向けエラーメッセージを返す
  - `revalidatePath`

### Step 1-4. Adapterテストの追加

- 対象ファイル: `src/app/(main)/sessions/[id]/__tests__/adapter.test.ts`
- 変更内容:
  - `updateSessionScenario` の describe ブロックを追加
  - テストケース: 正常系（scenarioId設定）、null でシナリオ解除、楽観的ロック Conflict、存在しないsessionId、存在しないscenarioId（FK違反）

### Review Checkpoint: Batch 1

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] コミット作成

## Batch 2: フロントエンド（UIコンポーネント）

### Step 2-1. BasicInfoSection にシナリオ変更ボタンを追加

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx`
- 変更内容:
  - シナリオ表示部分に「変更」ボタンを追加（GM のみ表示、`showEditButton` が true の場合）
  - クリックで ScenarioSearchModal を開く（`invitedMembers=[]`, スマートフィルタはデフォルトOFF）
  - 選択時に `updateScenarioAction` を呼び出し（`isPending` で二重送信防止）
  - 「シナリオ解除」ボタンも追加（シナリオが設定されている場合）
  - **解除時は確認ダイアログ**（シナリオ名を表示）を挟んでから実行
  - エラー表示: Conflict → 「他の操作と競合しました。ページを更新してください」、権限不足 → 「この操作を行う権限がありません」
  - Ark UI Modal のフォーカス復帰は自動処理されるため追加対応不要

### Step 2-2. スタイルの追加

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/styles.ts` または `sessions/[id]/styles.ts`
- 変更内容:
  - シナリオ変更ボタン用のスタイル（既存の `editButton` パターンを参考）

### Step 2-3. systems データの受け渡し

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx` または `page.tsx`
- 変更内容:
  - ScenarioSearchModal が必要とする `systems` データ（システム一覧）の取得・受け渡し
  - `getAllSystems()` を page.tsx で取得し props で渡す（既存パターン）

### Review Checkpoint: Batch 2

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/codex-debate --diff`（最終 Batch のため必須）
- [ ] `/react-doctor`（React コンポーネント変更のため必須）
- [ ] 指摘修正
- [ ] コミット作成

---

## ファイル一覧

### 新規ファイル

なし

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/sessions/[id]/adapter.ts` | `updateSessionScenario` 関数を追加 |
| `src/app/(main)/sessions/[id]/schema.ts` | `sessionScenarioSchema` を追加 |
| `src/app/(main)/sessions/[id]/actions.ts` | `updateScenarioAction` を追加 |
| `src/app/(main)/sessions/[id]/__tests__/adapter.test.ts` | `updateSessionScenario` テストを追加 |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx` | シナリオ変更ボタン + モーダル連携を追加 |
| `src/app/(main)/sessions/[id]/styles.ts`（または `_components/styles.ts`） | シナリオ変更ボタン用スタイル |
| `src/app/(main)/sessions/[id]/page.tsx`（または `SessionDetailContent.tsx`） | systems データの取得・受け渡し |

## 検証方法

### 自動テスト

```bash
pnpm vitest run "src/app/(main)/sessions/[id]/__tests__/adapter.test.ts"
```

### 手動テスト

- [ ] GM でセッション詳細を開き、シナリオ変更ボタンが表示される
- [ ] シナリオ検索モーダルでシナリオを選択・変更できる
- [ ] シナリオ解除時に確認ダイアログが表示される
- [ ] シナリオ解除（null に設定）できる
- [ ] 非GM ユーザーではシナリオ変更ボタンが表示されない
- [ ] COMPLETED/CANCELLED セッションでは変更ボタンが非表示 or エラー
- [ ] 変更後にプレイ時間目安の表示が更新される
- [ ] 変更中（isPending）はボタンが無効化される
- [ ] Conflict エラー時にエラーメッセージが表示される
