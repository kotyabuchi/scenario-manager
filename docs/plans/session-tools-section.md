# セッション詳細 会場・ツールセクション 編集UI

## Context

セッション詳細画面 (`/sessions/[id]`) の ToolsSection は現在「準備中です」のプレースホルダー表示のみ。
バックエンド（Server Action、adapter、Zodスキーマ）は完全実装済みであり、フロントエンドの表示・編集UIを実装する。

ToolsSection はサイドバーに配置されるコンパクトなセクションで、セッションに関連するリンク（Discord サーバー、ココフォリア部屋URL 等）を管理する。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| 編集UI形式 | Modal ダイアログ（追加・編集共通） | 既存の WithdrawDialog 等と同じパターン。フォームフィールドが3つあり、インライン編集には窮屈 |
| 削除確認 | 削除ボタン押下後にインライン確認表示 | リンク削除は軽量操作。ダイアログを開くほどではない |
| 楽観的更新 | `useOptimistic` + `useTransition` | プロジェクトルール準拠 |
| Action実行の責務 | ToolsSection（親）に集約 | LinkFormDialog は `onSubmit(data)` でフォームデータを返すのみ。親が楽観的更新→Action実行→失敗時ロールバックを一元管理 |
| linkType セレクト | `Select` + `Controller` ラッパー | Select は `string[]` 型、schema は単一 enum。`Controller` で `value={[field.value]}` / `onValueChange={d => field.onChange(d.value[0])}` と変換 |
| linkType アイコン表示 | DISCORD → `DiscordLogo`, CCFOLIA → `GameController`, OTHER → `Link` | Phosphor Icons から適切なアイコンを選定 |
| スタイルファイル | `tools/styles.ts` を新規作成 | セクション固有スタイルは分離する方針 |
| Server Action | 既存の `upsertLinkAction`, `deleteLinkAction` をそのまま使用 | 新規バックエンド不要 |
| 権限制御 | `userRole === 'manager'` の場合のみ編集ボタン表示 | 現状と同じ。Server Action 側でも認可チェック済み |

## 前提条件

- バックエンド完全実装済み（追加変更不要）
- `SessionLinkTypes` enum が `src/db/enum.ts` に定義済み
- `Select`, `Input`, `Modal`, `Button`, `FieldError` コンポーネントが利用可能

---

## Batch 1: リンク一覧表示の実装

ToolsSection を「準備中」表示からリンク一覧表示に変更する。編集機能はまだ含めない。
ヘッダーの「編集」ボタンは Batch 2 で接続するまで `disabled` を維持する。

### Step 1-1. tools/styles.ts の作成

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/tools/styles.ts`（新規）
- 変更内容:
  - リンクアイテム表示用スタイル定義
  - リンクタイプアイコン用スタイル（DISCORD: 紫系, CCFOLIA: 青系, OTHER: グレー系）
  - 空状態スタイル（既存 `tools_empty` を参照可）
  - 「リンクを追加」ボタン用スタイル
  - 各リンクアイテムの行スタイル（アイコン、テキスト、アクションボタン）
  - 削除確認用のインライン確認バー
  - ダイアログフォーム用スタイル（`linkForm_field`, `linkForm_label`, `linkForm_optionalBadge`）

スタイルの命名は既存パターンに従い `linkItem_`, `linkForm_`, `deleteConfirm_` 等のプレフィックスを使用。

### Step 1-2. LinkItem コンポーネントの作成

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/tools/LinkItem.tsx`（新規）
- 変更内容:
  - Props: `link: SessionLink`, `isManager: boolean`, `onEdit: (link) => void`, `onDelete: (linkId) => void`, `isPending: boolean`
  - linkType に応じたアイコン表示（`DiscordLogo`, `GameController`, `Link`）
  - URL をリンクとして表示（`<a href={link.url} target="_blank" rel="noopener noreferrer">`）
  - ラベルがあればラベル表示、なければ linkType の日本語ラベル表示
  - manager の場合のみ、編集・削除ボタンを表示
  - 削除ボタン押下時にインライン確認表示（useState で管理）
  - `ArrowSquareOut` アイコンで外部リンクであることを示す

### Step 1-3. ToolsSection の更新（表示のみ）

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/tools/ToolsSection.tsx`（変更）
- 変更内容:
  - 「準備中です」メッセージを削除
  - `links` が空の場合: 空状態メッセージ「リンクはまだ追加されていません」
  - `links` がある場合: `LinkItem` をリスト表示
  - ヘッダーの「編集」ボタンは `disabled` のまま維持（Batch 2 で置換）
  - スタイル import を `./styles` に変更（共通スタイルは引き続き `../../../styles` から）

### Review Checkpoint: Batch 1

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] コミット作成（`feat(sessions): ToolsSection のリンク一覧表示を実装`）

---

## Batch 2: リンク追加・編集・削除UIの実装

### Step 2-1. LinkFormDialog コンポーネントの作成

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/tools/LinkFormDialog.tsx`（新規）
- 変更内容:
  - Props: `sessionId: string`, `open: boolean`, `onOpenChange: (details: { open: boolean }) => void`, `editingLink?: SessionLink`, `onSubmit: (data: SessionLinkValues) => void`, `isPending: boolean`, `serverError: string | null`
  - **Action 呼び出しは行わない** — フォームデータを `onSubmit` で親に返すのみ（楽観的更新の責務は親に集約）
  - `react-hook-form` + `zodResolver(sessionLinkSchema)` でフォーム管理
  - フォームフィールド:
    1. **リンクタイプ** (`linkType`): `Select` + `Controller` で接続。`value={[field.value]}` / `onValueChange={d => field.onChange(d.value[0])}` で型変換
    2. **URL** (`url`): `Input` コンポーネント。placeholder は「https://...」
    3. **ラベル** (`label`): `Input` コンポーネント。任意。placeholder は「表示名（省略時はリンクタイプ名）」
  - **editingLink 変更時の reset**: `open` または `editingLink` が変わったら `reset()` を呼ぶ（追加時は空、編集時は既存値）
  - 編集モード時: `defaultValues` に既存リンクデータをセット、`linkId` をフォームデータに含める
  - エラー表示: フィールド単位の `FieldError` + 親から渡される `serverError`

### Step 2-2. ToolsSection に楽観的更新と編集UIを統合

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/sections/tools/ToolsSection.tsx`（変更）
- 変更内容:
  - `'use client'` ディレクティブを追加
  - `useOptimistic` で `links` の楽観的状態管理:
    - `type OptimisticAction = { type: 'add', link: SessionLink } | { type: 'update', link: SessionLink } | { type: 'delete', linkId: string }`
    - reducer で add / update / delete を処理
  - `useTransition` で非同期操作の pending 状態管理
  - ダイアログ開閉: `useState<boolean>` + `useState<SessionLink | undefined>` (editingLink)
  - ヘッダーの disabled 編集ボタン → `Plus` アイコンの「追加」ボタンに変更（manager のみ表示、`disabled` 解除）
  - **Action 実行は親で一元管理**:
    - `handleAddOrUpdate(data)`: 楽観的更新 → `startTransition` 内で `upsertLinkAction` → 失敗時は自動ロールバック + `serverError` をセット
    - `handleDelete(linkId)`: 楽観的に削除 → `startTransition` 内で `deleteLinkAction` → 失敗時は自動ロールバック + エラー通知
  - `LinkItem` の `onEdit` → ダイアログを編集モードで開く
  - `LinkItem` の `onDelete` → `handleDelete` を呼び出し
  - `LinkFormDialog` の `onSubmit` → `handleAddOrUpdate` を呼び出し
  - **エラー通知**: Action 失敗時に `serverError` state をセットし、ダイアログ内またはセクション内にエラーメッセージを表示

### Review Checkpoint: Batch 2

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（ファイル数 > 5 のため必須）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成（`feat(sessions): ToolsSection の追加・編集・削除UIを実装`）

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `src/app/(main)/sessions/[id]/_components/sections/tools/styles.ts` | ToolsSection 固有のスタイル定義 |
| `src/app/(main)/sessions/[id]/_components/sections/tools/LinkItem.tsx` | リンクアイテム表示コンポーネント |
| `src/app/(main)/sessions/[id]/_components/sections/tools/LinkFormDialog.tsx` | リンク追加・編集用モーダルダイアログ |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/sessions/[id]/_components/sections/tools/ToolsSection.tsx` | リンク一覧表示、楽観的更新、ダイアログ統合 |

## 検証方法

### 自動テスト

```bash
pnpm check
pnpm vitest
```

### 手動テスト

- [ ] manager ロールでセッション詳細を表示し、「追加」ボタンが表示されること
- [ ] participant / guest ロールでは「追加」ボタン・編集・削除ボタンが表示されないこと
- [ ] 「追加」ボタン押下でダイアログが開くこと
- [ ] リンクタイプ（Discord / ココフォリア / その他）を選択できること
- [ ] 無効なURL入力時にバリデーションエラーが表示されること
- [ ] リンク追加後、楽観的に一覧に反映されること
- [ ] 既存リンクの編集ボタンでダイアログが編集モードで開き、既存値がセットされていること
- [ ] 別のリンクの編集に切り替えた場合、フォーム値がリセットされること
- [ ] リンク編集後、楽観的に一覧が更新されること
- [ ] 削除ボタン押下でインライン確認が表示されること
- [ ] 削除確認後、楽観的にリンクが一覧から消えること
- [ ] リンクが 0 件の場合、空状態メッセージが表示されること
- [ ] リンクの URL をクリックで新しいタブで開くこと
- [ ] Server Action 失敗時にエラーメッセージが表示され、楽観的更新がロールバックされること
