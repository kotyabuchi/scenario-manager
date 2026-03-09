# 参加申請承認画面モックデザイン適合リファクタ

## Context

セッション参加申請承認画面（`/sessions/[id]/applications`）の既存実装を、モックデザイン（`docs/designs/mocks/セッション/参加申請承認画面/`）に合わせてリファクタリングする。主な差分は7項目あり、UI層のみの変更でadapter.ts/actions.tsのロジックは変更不要。既存のプロジェクトコンポーネント（`Pagination`, `Progress`, `Select`, `Input`, `Avatar`, `Badge`）を最大限活用する。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| パンくず | ページ固有の `_components/Breadcrumb.tsx` として新規作成 | 共通コンポーネントにするには使用箇所が1つのみで時期尚早 |
| プログレスバー | 既存の `Progress` コンポーネント（bar variant）を活用 | `value={confirmed}` `max={maxPlayer}` で利用可能 |
| 検索・ソート・フィルター | クライアントサイドで `useState` 管理 | 申請数は少量のためサーバーサイド・nuqs不要 |
| ソートSelect | 既存の `Select` コンポーネント（minimal variant）を活用 | プロジェクトの統一UIを使用 |
| 検索Input | 既存の `Input` コンポーネント（prefix付き）を活用 | `MagnifyingGlass` アイコンをprefixに設定 |
| ページネーション | 既存の `Pagination` コンポーネントを活用 | 自作不要 |
| アバター | 既存の `Avatar` コンポーネントを活用 | 現在のカスタムアバター実装を置き換え |
| タブUI廃止 | フィルターをSelectに変更、ARIAタブ実装を削除 | モックデザインに準拠 |
| ユーザー統計 | UI表示のみ実装、値は `-` 表示 + ツールチップ「今後対応予定」 | DB未対応のため後日対応。`0` は事実値と誤認されるため `-` 表示 |
| ボタンラベル | 「拒否する」「承認する」に統一 | モックデザイン仕様 |
| カードアクセントバー | `card_root` にCSS `borderLeft` で実装 | 左サイドの細いprimaryカラーバー |

## 前提条件

- adapter.ts / actions.ts のロジック変更不要（UI層のみ）
- 既存コンポーネント（`Pagination`, `Progress`, `Select`, `Input`, `Avatar`, `Badge`）が正常に動作すること
- PandaCSSのセマンティックトークンが利用可能であること

---

## Batch 1: パンくず・ヘッダー・統計表示のリファクタ

ヘッダー周辺をモックデザインに合わせる。パンくずナビゲーション新規作成、統計表示をプログレスバー形式に変更。

### Step 1-1. パンくずコンポーネント新規作成

- 新規: `src/app/(main)/sessions/[id]/applications/_components/Breadcrumb.tsx`
- `<nav aria-label="Breadcrumb">` + `<ol>` でセマンティックに実装
- リンク項目: ホーム(`/`), マイセッション(`/sessions` — セッション一覧ページ), セッション名(`/sessions/[id]`), 参加申請一覧（現在地、`aria-current="page"`）
- Props: `sessionId: string`, `sessionName: string`
- Phosphor Icons の `CaretRight` をセパレータに使用
- **Server Component として実装**（状態を持たないため `'use client'` 不要）
- 新規: `Breadcrumb.stories.tsx`

### Step 1-2. ヘッダー・統計表示のリファクタ

- 変更: `ApplicationApprovalContent.tsx`
- ヘッダー構成変更:
  - 左側: セッション名 + `Badge`（variant="success"）で「募集中」表示
  - 右側: 「現在の参加予定者数 N/M名」テキスト + `Progress`コンポーネント（bar variant）
- 既存の統計バッジ行を削除し `Progress` に置き換え
- `maxPlayer` が null の場合: テキストを「現在の参加予定者数 N名」に分岐し、`Progress` は完全非表示
- `maxPlayer` がある場合: テキストを「現在の参加予定者数 N/M名」とし、`Progress` の `value={confirmed}` `max={maxPlayer}` で表示

### Step 1-3. page.tsx からパンくず呼び出し・戻るリンク置き換え

- 変更: `page.tsx`
- `ArrowLeft` 戻るリンクを削除し `Breadcrumb` コンポーネントに置き換え
- `sessionId` と `sessionName` を渡す

### Step 1-4. styles.ts のヘッダー関連スタイル更新

- 変更: `styles.ts`
- 削除: `approval_backLink`, `approval_statsRow`, `approval_statsBadge*`
- 追加: パンくず用スタイル（`breadcrumb_*`）、ヘッダー統計エリア用スタイル（`approval_statsArea`, `approval_statsValue`）

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] 指摘修正・コミット

---

## Batch 2: フィルターバー（検索・ソート・フィルター）の実装

タブUIを廃止し、検索入力 + ソートSelect + フィルターSelectのバー形式に変更する。

### Step 2-1. FilterBar コンポーネント新規作成

- 新規: `src/app/(main)/sessions/[id]/applications/_components/FilterBar.tsx`
- 白背景カード内に横並びレイアウト:
  - 検索: `Input`（prefix `MagnifyingGlass`、placeholder「名前で検索...」）
  - ソート: `Select`（申請日時新しい順/古い順/名前順）
  - フィルター: `Select`（すべて/承認待ち/承認済み）
- Props: `searchQuery`, `onSearchChange`, `sortValue`, `onSortChange`, `filterValue`, `onFilterChange`
- 新規: `FilterBar.stories.tsx`

### Step 2-2. ApplicationApprovalContent にフィルターバー統合

- 変更: `ApplicationApprovalContent.tsx`
- `useState` で `searchQuery`, `sortValue`, `filterValue` を管理
- タブUI関連のコード全削除: `activeTab` state, `FILTER_TABS`, `handleTabKeyDown`, ARIAタブマークアップ
- フィルタリングロジック:
  - `filterValue` による status フィルタ
  - `searchQuery` による名前検索（userName, `nickname ?? ''` で null 安全な部分一致）
  - `sortValue` によるソート（`appliedAt` null 時は末尾固定、userName asc）
  - **null ガード**: `isNil` を使用して `nickname`, `appliedAt` の null/undefined を安全に処理

### Step 2-3. styles.ts のフィルター関連スタイル更新

- 変更: `styles.ts`
- 削除: `approval_filterTabs`, `approval_filterTab*`
- 追加: `filterBar_container`, `filterBar_searchArea`, `filterBar_selectArea`

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] 指摘修正・コミット

---

## Batch 3: カードデザイン刷新

ApplicationCard をモックデザインに合わせて全面リニューアルする。

### Step 3-1. ApplicationCard のマークアップ・構造変更

- 変更: `ApplicationCard.tsx`
- `Avatar` コンポーネントに置き換え（`application.user.image` を `src` に渡す）
- 統計行追加: `<hr>` 区切り + 「セッション参加: - | GM経験: -」（値は `-` 表示、ツールチップで「今後対応予定」と表示。TODOコメント + GitHub Issue で管理）
- メッセージを引用ブロック風に変更: 左ボーダー + 背景 + `Quotes` アイコン
- ボタンラベル: 「拒否する」（アイコンなし）、「承認する」（`Check` アイコン付き）
- カードルートに左サイドアクセントバー追加

### Step 3-2. styles.ts のカード関連スタイル更新

- 変更: `styles.ts`
- `card_root` に `borderLeft` 追加
- `card_avatar`, `card_avatarInner` 削除（Avatar で代替）
- 新規: `card_statsRow`, `card_statItem`, `card_quoteMessage`, `card_quoteIcon`
- `card_rejectButton` 微調整（アイコンなし対応）

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] 指摘修正・コミット

---

## Batch 4: ページネーション追加・Storybook更新・loading.tsx修正

ページネーション統合、全Storybookの更新、ローディングスケルトンの修正。

### Step 4-1. ApplicationApprovalContent にページネーション統合

- 変更: `ApplicationApprovalContent.tsx`
- `useState` で `currentPage` 管理（初期値 1）
- 定数 `ITEMS_PER_PAGE = 6`（2列 x 3行）
- フィルタ・ソート後の配列をスライスでページ分割
- **ページ補正**: 検索/フィルター/ソート変更時に `currentPage` を 1 にリセット。さらに楽観的更新（承認/拒否）後もデータ件数変化に応じて `Math.min(currentPage, totalPages)` でクランプし、空ページ化を防止
- `Pagination` コンポーネント配置（`totalPages <= 1` なら非表示）

### Step 4-2. 状態遷移テスト追加（Vitest）

- 新規: `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.test.tsx`
- テストケース:
  - フィルター変更時に `currentPage` が 1 にリセットされる
  - 検索クエリ変更時に `currentPage` が 1 にリセットされる
  - ソート変更時に `currentPage` が 1 にリセットされる
  - フィルタリングで 0 件になった場合の空状態表示
  - ページネーションの表示/非表示（totalPages <= 1 で非表示）

### Step 4-3. Storybook 全面更新

- 変更: `ApplicationApprovalContent.stories.tsx`
- 既存5 stories を新Props対応に更新
- 新規追加: `WithPagination`（8件以上）、`WithSearch`（検索確認用）

### Step 4-4. loading.tsx の修正

- 変更: `loading.tsx`
- タブスケルトン → フィルターバースケルトンに変更
- パンくずスケルトン追加、ページネーションスケルトン追加

### Step 4-5. styles.ts のページネーション・ローディング関連更新

- 変更: `styles.ts`
- `approval_pagination` 追加
- `loading_tabs` → `loading_filterBar` に変更、`loading_breadcrumb` / `loading_pagination` 追加

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（最終Batch必須）
- [ ] 指摘修正・コミット

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `sessions/[id]/applications/_components/Breadcrumb.tsx` | パンくずナビゲーション |
| `sessions/[id]/applications/_components/Breadcrumb.stories.tsx` | パンくず Storybook |
| `sessions/[id]/applications/_components/FilterBar.tsx` | 検索・ソート・フィルターバー |
| `sessions/[id]/applications/_components/FilterBar.stories.tsx` | フィルターバー Storybook |
| `sessions/[id]/applications/_components/ApplicationApprovalContent.test.tsx` | 状態遷移テスト |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `applications/page.tsx` | 戻るリンク → パンくず |
| `applications/styles.ts` | タブ削除、パンくず・フィルター・カード刷新・ページネーション追加 |
| `applications/_components/ApplicationApprovalContent.tsx` | タブ廃止、フィルターバー統合、ヘッダー刷新、ページネーション |
| `applications/_components/ApplicationCard.tsx` | カードデザイン刷新 |
| `applications/_components/ApplicationApprovalContent.stories.tsx` | 新Props対応、新Story追加 |
| `applications/loading.tsx` | スケルトン更新 |

## 検証方法

### 自動テスト

```bash
pnpm vitest run src/app/(main)/sessions/[id]/applications/
pnpm check
```

### 手動テスト

- [ ] パンくず表示（セッション詳細へのリンクが動作）
- [ ] プログレスバー（maxPlayerあり/なし）
- [ ] 検索バー（名前部分一致）
- [ ] ソート（申請日時順・名前順）
- [ ] フィルター（全て/承認待ち/承認済み）
- [ ] カードデザイン（アクセントバー、アバター、統計行、引用メッセージ）
- [ ] ボタンラベル「拒否する」「承認する」
- [ ] 楽観的更新（承認/拒否でUI即座反映）
- [ ] ページネーション（6件超でページ切り替え）
- [ ] フィルター変更時ページ1リセット
- [ ] ローディングスケルトン
- [ ] Storybook全stories正常レンダリング
- [ ] キーボードナビゲーション
