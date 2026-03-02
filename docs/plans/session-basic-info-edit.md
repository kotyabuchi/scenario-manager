# セッション基本情報 インライン編集

## Context

セッション詳細ページ `/sessions/[id]` の基本情報セクション（`BasicInfoSection`）は現在読み取り専用で、編集ボタンは `disabled` 状態。#2 CharacterSheetEdit と #3 GMNotesSection ではバックエンドが実装済みだったためUI層のみの変更で済んだが、#4 はバックエンド（schema, adapter, action）もフロントエンドも両方必要。

編集対象フィールド:
1. `sessionName` — 必須、1-100文字
2. `sessionDescription` — 必須、1-500文字
3. `maxParticipantCount` — 整数、0-20（DBではkeeper込みの合計値。Zod上限は20）
4. `isBeginnerFriendly` — boolean

対象外:
- `scenarioId` — シナリオ検索/選択UIが必要で複雑すぎる
- 日程関連 — schedule flowで管理
- `keeper_id` — 別フローで管理

現在の BasicInfoSection にはセッション名と募集文の表示領域がないため、表示も追加する。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| UI方式 | インライン展開式（表示→フォーム切り替え） | GMNotesSection, CharacterSheetEdit と同一パターン |
| コンポーネント分割 | 編集フォームを `BasicInfoEditForm.tsx` に分離 | BasicInfoSection（203行）に編集ロジックを全部入れると肥大化（推定350行超）するため |
| フォーム管理 | React Hook Form + Zod (`sessionBasicInfoSchema`) | プロジェクト規約（`form-rules.md`）に準拠 |
| 楽観的更新 | `useOptimistic` でフォームデータ全体をオブジェクトとして管理 | 複数フィールドを個別に `useOptimistic` するのは冗長 |
| 楽観的ロック | `expectedUpdatedAt` で `updated_at` 一致チェック | `updateSessionPhase`, `completeSession` と同一パターン |
| Switch/NumberInput の RHF連携 | `Controller` でラップ | `OtherSection.tsx` で確立済みのパターン |
| 空文字列→null 正規化 | 不要 | `sessionName`, `sessionDescription` は NOT NULL かつ Zod の `min(1)` で弾かれる |
| remaining_seat_count 同期 | `max_participant_count` 更新時に delta 方式で原子的に更新 | DBトリガーは `session_participants` 変更時のみ発火。`max` 直接更新には追従しないため |
| maxParticipantCount 範囲 | Zod: min(0), max(20)。動的下限（現参加者数以下不可）は Server Action で検証 | DBでの値はkeeper込み合計。作成フォームの `recruitedPlayerCount`(0-10) とは意味が異なる |
| DateTimeFormat hydration | `Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', ... })` でSSR/CSR同一結果を保証 | Client Component化に伴うhydration不整合を防止 |
| `updatedAt` の受け渡し | `session.updatedAt` を直接参照 | `SessionDetail` は `GameSession` を extends しており `updatedAt` を持つ |
| スキーマ配置 | `schema.ts` に追記 | 既存の `sessionMemoSchema` 等と同一ファイル |

## 前提条件

- マイグレーション不要（DBカラムは既に存在）
- `game_sessions.updated_at` はトリガーで自動更新
- `isSessionManager` 関数が実装済み（`participantAdapter.ts`）

## Batch 1: バックエンド（schema, adapter, action）

Zodスキーマ、DBアダプター関数、Server Actionを追加する。

**見積もり**: 3ファイル変更、約90行追加

### Step 1-1. Zodスキーマ追加

- 対象: `src/app/(main)/sessions/[id]/schema.ts`（変更）
- `sessionBasicInfoSchema` を新規定義
  - `sessionName`: string, min(1), max(100)
  - `sessionDescription`: string, min(1), max(500)
  - `maxParticipantCount`: number, int, min(0), max(20)
  - `isBeginnerFriendly`: boolean
- 型エクスポート: `SessionBasicInfoValues`

### Step 1-2. Adapter関数追加

- 対象: `src/app/(main)/sessions/[id]/adapter.ts`（変更）
- `updateSessionBasicInfo` 関数追加
  - 楽観的ロック: `.eq('updated_at', expectedUpdatedAt)` で競合検出
  - 更新カラム: `session_name`, `session_description`, `max_participant_count`, `is_beginner_friendly`, `remaining_seat_count`
  - `remaining_seat_count` はdelta方式で原子的に更新:
    ```sql
    remaining_seat_count = remaining_seat_count + (new_max - max_participant_count)
    ```
  - negativeチェック: `remaining_seat_count + (new_max - max_participant_count) >= 0` が不成立なら「参加上限を現在の参加者数以下に設定できません」エラー
  - Supabase JS Clientは生SQL非対応のため、`.rpc()` でDB関数を呼ぶか、2段階（SELECT→UPDATE）で実装
  - パターン: `updateSessionPhase` / `completeSession` と同一の楽観的ロック

### Step 1-3. Server Action追加

- 対象: `src/app/(main)/sessions/[id]/actions.ts`（変更）
- `updateBasicInfoAction` 関数追加
  - フロー: 認証 → 認可（`isSessionManager`） → Zodバリデーション → adapter呼び出し → `revalidatePath`
  - 引数: `sessionId`, `expectedUpdatedAt`, `data: SessionBasicInfoValues`

### Review Checkpoint: Batch 1

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] コミット作成

## Batch 2: フロントエンド（表示追加 + 編集UI）

BasicInfoSection に表示領域を追加し、インライン編集UIを実装する。

**見積もり**: 3ファイル変更、1ファイル新規、約250行追加/変更

### Step 2-1. BasicInfoEditForm コンポーネント新規作成

- 対象: `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoEditForm.tsx`（新規）
- `'use client'` Client Component
- Props: `sessionId`, `initialValues`, `expectedUpdatedAt`, `onSaved`, `onCancel`, `onOptimisticUpdate`
- React Hook Form + Zod + `useTransition`
- フォームフィールド:
  - セッション名: `<Input {...register('sessionName')} />`
  - 募集文: `<Textarea rows={4} {...register('sessionDescription')} />` + 文字数カウント
  - 参加上限数: `<Controller>` + `<NumberInput>` （ヒント: "0 = 制限なし"）
  - 初心者歓迎: `<Controller>` + `<Switch>`
- 送信: `startTransition` 内で `onOptimisticUpdate(data)` → `updateBasicInfoAction` → 成功時 `onSaved()` / 失敗時 `setServerError`
- try/catch + `?.message ?? '基本情報の更新に失敗しました'` パターン
- キャンセルボタン: `disabled={isPending}`

### Step 2-2. BasicInfoSection を Client Component に変更

- 対象: `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx`（変更）
- `'use client'` ディレクティブ追加
- `useOptimistic` でフォームデータ全体をオブジェクトとして管理
- 編集ボタン: `disabled` 削除、`onClick` 追加、`isEditing` 中は非表示
- **表示追加**:
  - セッション名表示
  - 募集文表示
  - 参加上限表示（0の場合「制限なし」）
  - 初心者歓迎バッジ
- **編集モード**: `isEditing` 時にフォームコンポーネントに切り替え

### Step 2-3. スタイル追加

- 対象: `src/app/(main)/sessions/[id]/styles.ts`（変更）
- 追加スタイル:
  - `basicInfo_sessionName` — セッション名表示
  - `basicInfo_description` — 募集文表示（pre-wrap）
  - `basicInfo_beginnerBadge` — 初心者歓迎バッジ
  - `basicInfoEdit_form` — 編集フォーム全体
  - `basicInfoEdit_charCount` — 文字数カウント
  - `basicInfoEdit_error` — サーバーエラー
  - `basicInfoEdit_actions` — アクションボタン群
  - `basicInfoEdit_switchRow` — Switch行

### Review Checkpoint: Batch 2

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] コミット作成

## ファイル一覧

### 新規

| ファイル | 用途 |
|---------|------|
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoEditForm.tsx` | 基本情報編集フォーム |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/sessions/[id]/schema.ts` | `sessionBasicInfoSchema` + 型追加（約15行） |
| `src/app/(main)/sessions/[id]/adapter.ts` | `updateSessionBasicInfo` 関数追加（約35行） |
| `src/app/(main)/sessions/[id]/actions.ts` | `updateBasicInfoAction` 関数追加（約40行） |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx` | Client Component化、表示追加、編集モード |
| `src/app/(main)/sessions/[id]/styles.ts` | `basicInfo_*`, `basicInfoEdit_*` スタイル追加 |

## 検証方法

### 自動テスト

```bash
pnpm check
pnpm vitest run src/app/(main)/sessions/
```

### 手動テスト

- [ ] managerロールで編集ボタンが有効
- [ ] フォーム編集モード切り替えが動作
- [ ] 既存値がフォームにプリセット
- [ ] 各フィールドの編集→保存→楽観的更新
- [ ] Zodバリデーションエラー表示
- [ ] 文字数カウントのリアルタイム更新
- [ ] キャンセルで元の表示モードに復帰
- [ ] Server Action失敗時のエラー表示 + ロールバック
- [ ] 保存中にキャンセルボタンが無効化
- [ ] participant/guestロールでは編集ボタン非表示
- [ ] 楽観的ロック競合時のエラー表示

## 設計上の注意点

1. **DateTimeFormat hydration**: BasicInfoSection を Client Component 化する際、`Intl.DateTimeFormat` の `timeZone` を `'Asia/Tokyo'` に固定すること。SSR/CSR間の表示揺れを防止する。

2. **remaining_seat_count の原子的更新**: Supabase JS Client は生SQLの `remaining_seat_count + (new_max - max_participant_count)` を直接記述できない。以下の方式で対応:
   - 先に SELECT で現在の `max_participant_count` と `remaining_seat_count` を取得
   - アプリケーション側で `new_remaining = remaining + (new_max - old_max)` を計算
   - `new_remaining < 0` なら即座にエラー返却
   - UPDATE で `max_participant_count` と `remaining_seat_count` を同時更新（楽観的ロックで競合防止）

3. **NumberInput の RHF連携**: `Controller` でラップし、`value` を `String()` に変換、`onValueChange` で `field.onChange(details.valueAsNumber)` として数値に戻す。

## 未検証範囲

- シナリオ変更UI（別チケットで対応）
- 日程編集（schedule flowで管理）
- keeper変更（別フローで管理）
- `remaining_seat_count` の既存不整合修復（現時点では不整合は存在しないが、将来の安全弁として再計算RPCを検討）
