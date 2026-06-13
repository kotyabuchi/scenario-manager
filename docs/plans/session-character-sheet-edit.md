# ParticipantCard キャラクターシートURL編集UI

## Context

セッション詳細画面 `/sessions/[id]` の ParticipantsSection で、参加者のキャラクターシート（CS）URL は現在バッジ表示のみ（「CS提出済」/「CS未提出」）。参加者本人がこの画面からCSのURLを登録・編集・削除できるUIが必要。バックエンド（adapter, Server Action, Zodスキーマ）は完全に実装済みのため、フロントエンドUIの追加のみ。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| UI方式 | インライン展開式（バッジクリックで入力欄表示） | 単一フィールドの編集にモーダルは重すぎる。カード内で完結する |
| コンポーネント分離 | `CharacterSheetEdit` を新規Client Componentとして作成 | ParticipantCard本体はServer Componentのまま維持。isCurrentUser時のみClient Component差し込み |
| フォーム管理 | React Hook Form + Zod (`characterSheetSchema`) | プロジェクト規約に準拠 |
| 楽観的更新 | `useOptimistic` + `useTransition` | 既存ToolsSectionと同パターン。UX向上 |
| 権限チェック | `isCurrentUser` prop で表示制御 + Server Action側で認可 | 二重チェックでセキュリティ確保 |
| KEEPER制限 | UI側で `participantType !== 'KEEPER'` の場合のみ編集UI表示。Server Action側にKEEPER制限は追加しない | バックエンド変更はスコープ外。既知リスクとして受容し、BE側制約は別タスクとする |
| SPECTATOR対応 | SPECTATORもCS編集可能。ただしCS未登録時は「CS未提出」警告ではなく「登録」ボタンのみ表示 | データモデル上SPECTATORもCSURLを持てる。ただし登録は任意（PLは必須感、SPECTATORは任意感を出す） |
| 空文字送信 | URL削除として扱う（`characterSheetSchema`が`z.literal('')`を許可）。楽観的更新値は `null` に正規化する | 既存スキーマの仕様どおり。表示判定は `characterSheetUrl` の null チェックで行われるため |
| スタイル | `styles.ts` に `participants_csEdit*` プレフィックスで追加 | 既存の命名規則に従う |

## 前提条件

- `session_participants` テーブルに `character_sheet_url` カラムが存在する（確認済み）
- `updateCharacterSheetAction` Server Actionが実装済み（確認済み）
- `characterSheetSchema` Zodスキーマが定義済み（確認済み）
- マイグレーション不要

---

## Batch 1: キャラクターシートURL編集UI

ParticipantCard の右側（CS状態表示エリア）を、本人の場合のみ編集可能なClient Componentに差し替える。

### Step 1-1. CharacterSheetEdit Client Component 新規作成

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/participants/CharacterSheetEdit.tsx`（新規）
- 変更内容:
  - `'use client'` ディレクティブ付きClient Component
  - Props: `sessionId: string`, `characterSheetUrl: string | null`, `participantType: string`, `isSessionCreator: boolean`
  - 状態管理:
    - `isEditing: boolean` (useState) — 編集モード切替
    - `useTransition` — Server Action呼び出し
    - `useOptimistic` — characterSheetUrl の楽観的更新
  - フォーム: `useForm<CharacterSheetValues>` + `zodResolver(characterSheetSchema)`
  - 通常モード表示:
    - `isSessionCreator` の場合: 先頭に「主催者」ラベルを表示（既存 CharacterSheetStatus の挙動を維持）
    - URL あり: 「CS提出済」バッジ + URL リンク + 編集ボタン（PencilSimple）
    - URL なし（PLAYER）: 「CS未提出」バッジ + 「登録」ボタン
    - URL なし（SPECTATOR）: 「登録」ボタンのみ（未提出警告なし）
  - 編集モード表示:
    - `Input` コンポーネント (type="url", placeholder="https://...")
    - 「保存」ボタン + 「キャンセル」ボタン
    - `FieldError` でバリデーションエラー表示
    - サーバーエラー表示
  - 送信処理:
    - `startTransition` 内で楽観的更新 → `updateCharacterSheetAction` 呼び出し
    - 楽観的更新値: URLが空文字の場合は `null` に正規化（表示判定が null チェックのため）
    - 成功時: `isEditing` を false に
    - 失敗時: サーバーエラーメッセージを表示（楽観的更新は自動ロールバック）
  - 削除: 入力欄を空にして保存 = URL削除（楽観的更新は `null`、Server Actionには空文字を渡す）

### Step 1-2. ParticipantCard の変更

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/participants/ParticipantCard.tsx`（変更）
- 変更内容:
  - Props に `sessionId: string` を追加
  - 右側の `CharacterSheetStatus` 呼び出し部分を条件分岐:
    - `isCurrentUser === true` かつ `participantType !== 'KEEPER'` の場合: `<CharacterSheetEdit>` を使用（`isSessionCreator` も渡す）
    - それ以外: 既存の `<CharacterSheetStatus>` をそのまま使用

### Step 1-3. ParticipantsSection の変更

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/participants/ParticipantsSection.tsx`（変更）
- 変更内容:
  - `sessionId` prop を `string`（必須）に変更（現在は `string | undefined`）
  - `ParticipantCard` に `sessionId` prop を渡す
  - 呼び出し元（`SessionDetailContent.tsx`）も必須に対応済みか確認

### Step 1-4. スタイル追加

- 対象ファイル: `src/app/(main)/sessions/[id]/styles.ts`（変更）
- 変更内容: `participants_csEdit*` プレフィックスで以下を追加
  - `participants_csEditWrap`: 通常モードのラッパー
  - `participants_csEditButton`: 編集/登録ボタン
  - `participants_csLink`: URL リンク
  - `participants_csEditForm`: 編集フォーム
  - `participants_csEditInputRow`: 入力行
  - `participants_csEditActions`: アクションボタン群

### Review Checkpoint: Batch 1

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] コミット作成

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `src/app/(main)/sessions/[id]/_components/sections/participants/CharacterSheetEdit.tsx` | CS URL編集Client Component |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/sessions/[id]/_components/sections/participants/ParticipantCard.tsx` | sessionId prop追加、isCurrentUser時にCharacterSheetEditを使用 |
| `src/app/(main)/sessions/[id]/_components/sections/participants/ParticipantsSection.tsx` | ParticipantCardにsessionIdを渡す |
| `src/app/(main)/sessions/[id]/styles.ts` | participants_csEdit* スタイル追加 |

## 検証方法

### 自動テスト

```bash
pnpm check
pnpm vitest
```

### 手動テスト

- [ ] 本人がPLの場合: CS未提出バッジに「登録」ボタンが表示される
- [ ] 「登録」ボタンクリックで入力欄が展開される
- [ ] 有効なURLを入力して「保存」→ 即座にバッジが「CS提出済」に変わる（楽観的更新）
- [ ] CS提出済の場合: URL へのリンク + 編集ボタンが表示される
- [ ] 入力欄を空にして「保存」→ URL削除（バッジが「CS未提出」に戻る）
- [ ] 不正なURLを入力 → バリデーションエラー表示
- [ ] 他ユーザーのカードには編集UIが表示されない
- [ ] KEEPERのカードには編集UIが表示されない
- [ ] SPECTATORのカード: 「登録」ボタン表示（「CS未提出」バッジなし）
- [ ] 主催者かつPLの場合: 「主催者」ラベル + CS編集UIが両方表示される
- [ ] Server Action失敗時にエラーメッセージ表示 + 楽観的更新ロールバック

### 未検証範囲（別タスクでテスト追加予定）

- CharacterSheetEdit の単体テスト（成功/失敗/空文字削除/キャンセル時の状態復帰）
- Server Action側のKEEPER制限（現在はUI側のみで制御、BE制約は別タスク）
