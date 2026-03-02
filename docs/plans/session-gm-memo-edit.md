# GMメモ インライン編集UI

## Context

セッション詳細ページ `/sessions/[id]` の GMメモセクション（`GMNotesSection`）は現在読み取り専用で、編集ボタンは `disabled` 状態。バックエンドは完全に実装済み（`updateMemoAction`, `updateSessionMemo`, `sessionMemoSchema`, テスト, 認可チェック）であり、UI層のインライン編集機能のみ未実装。これはセッション詳細ページ編集UIの #3 タスクにあたる。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| UI方式 | インライン展開式（編集ボタンクリックで表示モードからtextarea編集モードへ切り替え） | 単一テキストフィールドの編集にモーダルは重すぎる。CharacterSheetEditと同一パターン |
| コンポーネント分割 | `GMNotesSection.tsx` を `'use client'` に変更し、直接インライン編集ロジックを内包 | 別コンポーネント分離（例: GMNotesEdit + GMNotesDisplay）も検討したが、単一セクションの表示/編集切り替えであり、CharacterSheetEditのように別コンポーネントから差し込む構造ではないため、シンプルに1ファイル内で完結させる |
| フォーム管理 | React Hook Form + Zod (`sessionMemoSchema`) | プロジェクト規約(`form-rules.md`)に準拠 |
| 楽観的更新 | `useOptimistic` + `useTransition` | `react-rules.md`に準拠。CharacterSheetEditと同一パターン |
| Props変更 | `sessionId: string` を追加 | Server Action呼び出しに必要 |
| 空文字送信 | メモクリアとして扱う。adapter で空文字→null に正規化して DB に保存 | `sessionMemoSchema`は`z.string().max(2000)`で空文字を許可。adapter の `updateSessionMemo` で `memo \|\| null` に正規化。CharacterSheetEdit (#2) と同一パターン |
| 保存中のキャンセル | `isPending` 中はキャンセルボタンを無効化 | 保存中にキャンセルするとエラー状態が見えなくなるリスクを防止 |
| 文字数表示 | textarea下部に現在文字数/2000を表示 | 2000文字上限があるため、ユーザーがリアルタイムに確認できるようにする |
| スタイル | `styles.ts` に `memo_edit*` プレフィックスで追加 | 既存 `memo_*` の命名規則に従う |

## 前提条件

- `updateMemoAction` Server Actionが実装済み（`actions.ts` L79-115）
- `sessionMemoSchema` Zodスキーマが定義済み（`schema.ts` L4-6）
- `SessionMemoValues` 型が `schema.ts` からエクスポート済み
- `Textarea` コンポーネントが `src/components/elements/textarea/` に存在
- マイグレーション不要

---

## Batch 1: GMメモ インライン編集UI

GMNoteSectionをClient Componentに変更し、インライン編集機能を追加する。

### Step 1-1. GMNotesSection を Client Component に変更しインライン編集ロジック追加

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/gm-notes/GMNotesSection.tsx`（変更）
- 変更内容:
  - ファイル先頭に `'use client'` ディレクティブ追加
  - Props型に `sessionId: string` を追加
  - 状態管理:
    - `isEditing: boolean` (`useState`) — 編集モード切替
    - `useTransition` — Server Action呼び出しの非同期管理
    - `useOptimistic(memo)` — メモテキストの楽観的更新
    - `serverError: string | null` (`useState`) — サーバーエラー表示
  - フォーム: `useForm<SessionMemoValues>({ resolver: zodResolver(sessionMemoSchema), defaultValues: { memo: memo ?? '' } })`
  - `watch('memo')` で文字数カウントをリアルタイム取得
  - 編集ボタン:
    - `disabled` を削除し、`onClick={() => setIsEditing(true)}` を追加
    - `aria-label` を `"GMメモを編集"` に変更（「準備中」を削除）
  - 編集モード表示（`isEditing === true`のとき、`<hr>` 以下を差し替え）:
    - `<form onSubmit={handleSubmit(onSubmit)}>` でラップ
    - `<Textarea>` コンポーネント（`rows={6}`, `placeholder="メモを入力..."`, `{...register('memo')}`）
    - `<FieldError error={errors.memo} />` でバリデーションエラー表示
    - サーバーエラー表示: `!isNil(serverError)` の場合 `<p className={styles.memo_editError}>{serverError}</p>`
    - 文字数カウント: `<span className={styles.memo_editCharCount}>{watchedMemo.length} / 2000</span>`
    - アクションボタン群: キャンセル（`Button variant="ghost" size="sm" disabled={isPending}` + `X`アイコン）+ 保存（`Button variant="solid" size="sm" loading={isPending} loadingText="保存中..."`）
  - 通常モード表示（`isEditing === false`のとき）:
    - 既存と同じだが `memo` ではなく `optimisticMemo` を使用して表示
  - 送信処理 (`onSubmit`):
    - `setServerError(null)`
    - `startTransition(async () => { ... })`内で:
      - `setOptimisticMemo(data.memo || null)` — 楽観的更新（空文字はnullに正規化して表示判定に合わせる）
      - try/catch で `updateMemoAction(sessionId, data.memo)` を呼び出し
      - 成功時: `setIsEditing(false)`, `reset({ memo: data.memo })`
      - 失敗時: `setServerError(result.error?.message ?? 'メモの更新に失敗しました')`
      - catch: `setServerError('メモの更新に失敗しました')`
  - キャンセル処理 (`handleCancel`):
    - `setIsEditing(false)`
    - `setServerError(null)`
    - `reset({ memo: memo ?? '' })` — 元の値にリセット
  - TODO コメント `// TODO(human): Phase 2でインライン編集機能を実装予定` を削除

### Step 1-2. SessionDetailContent の Props 更新

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx`（変更）
- 変更内容:
  - `GMNotesSection` の呼び出しに `sessionId={session.gameSessionId}` を追加

### Step 1-3. adapter の空文字→null 正規化

- 対象ファイル: `src/app/(main)/sessions/[id]/adapter.ts`（変更）
- 変更内容:
  - `updateSessionMemo` の `.update({ session_memo: memo })` を `.update({ session_memo: memo || null })` に変更
  - CharacterSheetEdit (#2) の `character_sheet_url: url || null` と同一パターン

### Step 1-4. スタイル追加

- 対象ファイル: `src/app/(main)/sessions/[id]/styles.ts`（変更）
- 変更内容: `memo_edit*` プレフィックスで以下のスタイルを追加
  - `memo_editForm` — 編集フォーム（flex column, gap:3）
  - `memo_editFooter` — テキストエリア下部情報行（flex, justify-between）
  - `memo_editCharCount` — 文字数カウント（fontSize:xs, color:text.secondary）
  - `memo_editError` — サーバーエラー（fontSize:xs, color:error.text）
  - `memo_editActions` — アクションボタン群（flex, justify-end, gap:2）

---

## ファイル一覧

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/sessions/[id]/_components/sections/gm-notes/GMNotesSection.tsx` | `'use client'`化、`sessionId` prop追加、インライン編集ロジック追加 |
| `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx` | GMNotesSectionに `sessionId` propを渡す |
| `src/app/(main)/sessions/[id]/adapter.ts` | `updateSessionMemo` で空文字→null 正規化 |
| `src/app/(main)/sessions/[id]/styles.ts` | `memo_edit*` スタイル5件追加 |

## 検証方法

### 自動テスト

```bash
pnpm check
pnpm vitest run src/app/(main)/sessions/[id]/__tests__/
```

### 手動テスト

- [ ] managerロールでGMメモセクションが表示される
- [ ] 編集ボタンが有効状態で表示される（disabled でない）
- [ ] 編集ボタンクリックでtextarea編集モードに切り替わる
- [ ] 既存メモがtextareaにプリセットされている
- [ ] メモを編集して「保存」→ 即座に表示が更新される（楽観的更新）
- [ ] 空のtextareaで「保存」→ メモクリア（「メモはありません」表示に戻る）
- [ ] 2001文字入力 → Zodバリデーションエラー表示
- [ ] 文字数カウントがリアルタイムに更新される
- [ ] 「キャンセル」ボタンで元の表示モードに戻り、入力内容が破棄される
- [ ] Server Action失敗時にエラーメッセージ表示 + 楽観的更新ロールバック
- [ ] participant / guest ロールではGMメモセクション自体が非表示（既存動作維持）
- [ ] 保存中にキャンセルボタンが無効化される

### Review Checkpoint: Batch 1

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest run src/app/(main)/sessions/[id]/__tests__/` 通過
- [ ] コミット作成

## 未検証範囲

- GMNotesSection のコンポーネントテスト（編集遷移、失敗時表示、キャンセル復元、文字数表示、2000字超過）は別タスクとする
  - 対象ケース: 成功保存 / 失敗時エラー表示 / 空文字保存 / キャンセル復元 / 2001文字バリデーション / 文字数カウント表示
  - 完了条件: 上記6ケースをカバーするコンポーネントテストが通過すること
