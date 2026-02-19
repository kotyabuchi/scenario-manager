# Select コンポーネントリデザイン（チェックボックス・グルーピング表示）

## Context

GitHub Issue #1 に基づくセレクトボックスのリデザイン。現在のセレクトはアイテム間に gap があり、右側にチェックマークを表示する標準的なデザイン。以下3点の改善を行う:

1. Content の gap を 0 にしてアイテム間を密着させる
2. マルチセレクトで連続選択されたアイテムをグルーピング表示（角丸除去）
3. チェックマークを右側から左側に移動。マルチセレクト時は未選択に空チェックボックス（Square）、選択時にチェックマーク（Check）を表示

対象コンポーネントは `src/components/elements/select/` で、プロジェクト全体で14箇所（マルチ7箇所・シングル7箇所）から使用されている。

### 利用箇所

**マルチセレクト（7箇所）:**
- `SearchTopBar.tsx` — システムフィルタ
- `MobileSearchBar.tsx` — システムフィルタ（モバイル）
- `SearchPanel.tsx` — システム + フェーズフィルタ
- `FilterPanel.tsx` — システム + 役割 + ステータスフィルタ

**シングルセレクト（7箇所）:**
- `ScenariosContent.tsx` — ソート
- `UpcomingTab.tsx` / `PublicTab.tsx` / `HistoryTab.tsx` — ソート
- `FeedbackContent.tsx` — ソート
- `AdminSection.tsx` — ステータス
- `ScenarioForm.tsx` / `ImportScenarioForm.tsx` — システム

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| グルーピングロジック | CSS `:has()` + 隣接兄弟セレクタ（JS ロジック不要） | Ark UI の `[data-state=checked]` を活用。コンポーネントの複雑性を増やさない |
| マルチセレクトのスコーピング | Content 要素に `data-multiple` 属性を付与し CSS で参照 | レシピのバリアント追加より軽量。既存 variant 構造を汚さない |
| チェックアイコン | `Check` + `Square` (Phosphor Icons) | 選択時は Check、未選択時は Square。`data-icon` 属性で CSS 表示切替 |
| シングルセレクトの扱い | チェックボックスアイコンは非表示。`ItemIndicator` も廃止 | 選択状態は背景色（`_selected`）で表現済み |
| スタイル定義の配置 | レシピ（`select.ts`）に集約 | ネストセレクタでレシピ内に記述可能 |

## 前提条件

- ブラウザの `:has()` セレクタ対応（Chrome 105+, Firefox 121+, Safari 15.4+）
- Ark UI Select の `[data-state="checked"]` 属性が正しく付与されること（既存テストで確認済み）

---

## Batch 1: レシピ・コンポーネントの変更

### Step 1-1. レシピ (`select.ts`) の更新

- 対象ファイル: `src/styles/recipes/select.ts`
- 変更内容:

**content スロット:**
- `gap: '1'` → `gap: '0'`
- `p: '1'` はそのまま維持
- `overflow: 'hidden'` を追加（角丸クリッピング用）

**item スロット:**
- `justifyContent: 'space-between'` → `gap: '8px'`（左側アイコン + テキストの横並び）
- `borderRadius: '4px'` はそのまま維持
- content 内の先頭・末尾アイテムの角丸を content の角丸に合わせる:
  ```
  '&:first-child': { borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }
  '&:last-child': { borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }
  ```
- マルチセレクト時のグルーピング用セレクタを追加:
  ```
  '[data-multiple] &[data-state=checked]:has(+ [data-state=checked])':
    → borderBottomLeftRadius: 0, borderBottomRightRadius: 0
  '[data-multiple] [data-state=checked] + &[data-state=checked]':
    → borderTopLeftRadius: 0, borderTopRightRadius: 0
  ```
- チェックボックスアイコン表示切替:
  ```
  '& [data-icon=unchecked]': display: 'inline-flex'
  '& [data-icon=checked]': display: 'none'
  '&[data-state=checked] [data-icon=unchecked]': display: 'none'
  '&[data-state=checked] [data-icon=checked]': display: 'inline-flex'
  ```

### Step 1-2. Select コンポーネント (`select.tsx`) の更新

- 対象ファイル: `src/components/elements/select/select.tsx`
- 変更内容:

1. **import 変更**: `Check` は維持、`Square` を追加
2. **Content に `data-multiple` 属性を付与**: `multiple` が true の場合のみ
3. **アイテムのレンダリング変更**:
   - `ItemIndicator` を削除
   - マルチセレクト時のみ、ItemText の前にチェックアイコンを追加:
     ```tsx
     {multiple && (
       <span>
         <Square size={16} data-icon="unchecked" aria-hidden="true" />
         <Check size={16} data-icon="checked" aria-hidden="true" />
       </span>
     )}
     ```
4. **不要な import 削除**: `ItemIndicator`

### Step 1-3. PandaCSS コード再生成

- コマンド: `pnpm prepare`

---

## Batch 2: テスト・Storybook の更新

### Step 2-1. ユニットテストの更新

- 対象ファイル: `src/components/elements/select/select.test.tsx`
- 変更内容:

1. **既存テスト修正**: 「選択済みアイテムにチェックアイコンが表示される」テストを、マルチセレクト用のチェックボックスアイコンテストに変更
2. **新規テスト追加**:
   - マルチセレクトモードでチェックボックスアイコンが表示されること
   - シングルセレクトモードでチェックボックスアイコンが表示されないこと

### Step 2-2. Storybook の更新

- 対象ファイル: `src/components/elements/select/select.stories.tsx`
- 変更内容:

1. **グルーピング確認用ストーリー追加**: 初期値で連続する複数アイテムを選択状態にした「MultipleWithSelection」ストーリー

---

## ファイル一覧

### 新規ファイル

なし

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/styles/recipes/select.ts` | content gap/padding、item レイアウト、グルーピング CSS、チェックボックス切替 CSS |
| `src/components/elements/select/select.tsx` | data-multiple 追加、ItemIndicator 廃止、チェックボックスアイコン追加 |
| `src/components/elements/select/select.test.tsx` | チェックアイコンテスト修正、マルチセレクトテスト追加 |
| `src/components/elements/select/select.stories.tsx` | グルーピング確認用ストーリー追加 |

## 検証方法

### 自動テスト

```bash
pnpm vitest run src/components/elements/select/select.test.tsx
pnpm check
```

### 手動テスト（Storybook）

- [ ] マルチセレクトでチェックボックスアイコンが左側に表示される
- [ ] シングルセレクトでチェックボックスアイコンが表示されない
- [ ] チェック時に Square → CheckSquare (fill) に切り替わる
- [ ] 連続チェックアイテムの間の角丸が除去されグルーピング表示になる
- [ ] 非連続チェック（1番目と3番目のみ）ではグルーピングされない
- [ ] アイテム間の隙間がない（gap: 0）
- [ ] キーボード操作（矢印キー、Enter、Escape）が正常
- [ ] disabled アイテムの表示が崩れない
