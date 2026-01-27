# Chip コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Chip/*

---

## 1. 概要

### 1.1 目的
タグ、カテゴリ、フィルター選択などを表示・操作するためのコンパクトなコンポーネント。
選択可能なチップ、表示専用のラベル、削除可能なチップなど複数のバリエーションを提供する。

### 1.2 使用場所
- `src/app/(main)/scenarios/_components/SearchPanel.tsx`: システム・タグ選択
- `src/app/(main)/scenarios/[id]/`: シナリオ詳細のタグ表示
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: なし（独自実装）
- スタイリング: PandaCSS

---

## 2. Props設計

### 2.1 必須Props

| Prop | 型 | 説明 |
|------|-----|------|
| `children` | `React.ReactNode` | チップのラベルテキスト |

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | `"selectable" \| "label" \| "outline" \| "more"` | `"label"` | スタイルバリアント |
| `status` | `"default" \| "error"` | `"default"` | カラーステータス |
| `size` | `"sm" \| "md"` | `"md"` | サイズ |
| `selected` | `boolean` | `false` | 選択状態（selectable用） |
| `disabled` | `boolean` | `false` | 無効状態 |
| `removable` | `boolean` | `false` | 削除ボタンを表示 |
| `onRemove` | `() => void` | - | 削除ボタンクリック時のコールバック |
| `onClick` | `() => void` | - | チップクリック時のコールバック |

### 2.3 型定義

```typescript
type ChipProps = {
  children: React.ReactNode;
  variant?: 'selectable' | 'label' | 'outline' | 'more';
  status?: 'default' | 'error';
  size?: 'sm' | 'md';
  selected?: boolean;
  disabled?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
};
```

---

## 3. Variants

### 3.1 variant（スタイルバリアント）

| 値 | 用途 | Pencilコンポーネント | 見た目 |
|-----|------|---------------------|--------|
| `selectable` | 選択可能なフィルター | Chip/Selectable | 緑背景、削除アイコン付き |
| `label` | 表示専用ラベル | Chip/Label | グレー背景 |
| `outline` | 枠線のみ | Chip/Outline | 白背景、グレー枠線 |
| `more` | 「もっと見る」表示 | Chip/More | グレー背景、「...」テキスト |

### 3.2 status（カラーステータス）

| 値 | 用途 | Pencilコンポーネント | 見た目 |
|-----|------|---------------------|--------|
| `default` | 標準 | Chip/Selectable | 緑系 |
| `error` | エラー・警告 | Chip/Error | 赤系 |

### 3.3 size

| 値 | 高さ | フォントサイズ | パディング | 角丸 |
|-----|------|--------------|-----------|------|
| `sm` | 24px | 11px | 0 8px | 4px |
| `md` | 28px | 12px | 0 10px | 6px |

---

## 4. Pencilデザイン詳細

### 4.1 Chip/Selectable (tDQ3l)
```
fill: #D1FAE5（淡い緑）
text: #065F46（濃い緑）, 12px, fontWeight: 500
cornerRadius: 6px
height: 28px
padding: 0 10px
gap: 6px
icon: x（削除）, 14px, #065F46
```

### 4.2 Chip/Label (RJKuC)
```
fill: #F3F4F6（グレー）
text: #4B5563, 11px, fontWeight: 500
cornerRadius: 4px
height: 24px
padding: 0 8px
```

### 4.3 Chip/More (VFyQq)
```
fill: #F3F4F6（グレー）
text: "...", #9CA3AF, 11px, fontWeight: 500
cornerRadius: 4px
height: 24px
padding: 0 8px
```

### 4.4 Chip/Error (Ly1Xn)
```
fill: #FEE2E2（淡い赤）
text: #DC2626（赤）, 12px, fontWeight: 500
cornerRadius: 6px
height: 28px
padding: 0 10px
gap: 6px
icon: x（削除）, 14px, #DC2626
```

### 4.5 Chip/Outline (AULQR)
```
fill: #FFFFFF
stroke: #D1D5DB, 1px
text: #6B7280, 12px, fontWeight: 500
cornerRadius: 6px
height: 28px
padding: 0 10px
gap: 6px
```

### 4.6 Chip/Disabled (x21Jf)
```
fill: #F3F4F6
text: #9CA3AF, 12px, fontWeight: 500
cornerRadius: 6px
height: 28px
padding: 0 10px
opacity: 'disabled'
```

---

## 5. インタラクション

### 5.1 状態

| 状態 | 見た目の変化 | 備考 |
|------|-------------|------|
| default | - | 通常状態 |
| hover | 背景色が少し暗く、translateY(-1px) | ui-design-system準拠 |
| focus | フォーカスリング表示 | 2px offset |
| selected | 選択時の色に変化 | selectable variantのみ |
| disabled | opacity: 'disabled' | cursor: not-allowed |

### 5.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| Enter / Space | onClick発火（クリック可能な場合） |
| Backspace / Delete | onRemove発火（removableの場合） |

### 5.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| 背景色変化 | {durations.normal} | {easings.ease-in-out} |
| transform | {durations.normal} | {easings.ease-in-out} |

---

## 6. アクセシビリティ

### 6.1 ARIA属性

```typescript
// 選択可能なチップ
<button
  role="checkbox"
  aria-checked={selected}
  aria-disabled={disabled}
>

// 表示専用ラベル
<span role="status">

// 削除ボタン
<button
  aria-label="削除"
>
```

### 6.2 コントラスト確認

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| Selectable背景(#D1FAE5) + テキスト(#065F46) | 約5:1 | ✅ |
| Label背景(#F3F4F6) + テキスト(#4B5563) | 約6:1 | ✅ |
| Error背景(#FEE2E2) + テキスト(#DC2626) | 約4.5:1 | ✅ |
| Outline枠線(#D1D5DB) + 白背景 | 約1.5:1 | ⚠️（UIコンポーネント基準は3:1） |

### 6.3 フォーカス管理

- クリック可能なチップ（onClick指定時）はフォーカス可能
- 削除ボタンは独立してフォーカス可能
- disabled時はフォーカス不可

---

## 7. エラーケース・境界値

### 7.1 children

| ケース | 挙動 |
|--------|------|
| 短いテキスト | 通常表示 |
| 長いテキスト | 省略なし、そのまま表示 |
| 空文字 | 高さは維持、空のチップとして表示 |

### 7.2 状態の組み合わせ

| ケース | 挙動 |
|--------|------|
| disabled + selected | disabled表示を優先（選択解除不可） |
| removable + disabled | 削除ボタン非表示 |
| more variant | childrenは無視、「...」固定表示 |

---

## 8. テスト観点

### 8.1 レンダリング

- [ ] 必須Propsのみで正しくレンダリングされる
- [ ] variant="selectable"が正しく表示される
- [ ] variant="label"が正しく表示される
- [ ] variant="outline"が正しく表示される
- [ ] variant="more"が正しく表示される
- [ ] status="default"が正しく表示される
- [ ] status="error"が正しく表示される
- [ ] size="sm"が正しいサイズで表示される
- [ ] size="md"が正しいサイズで表示される

### 8.2 インタラクション

- [ ] クリック時にonClickが呼ばれる
- [ ] disabled時はonClickが呼ばれない
- [ ] removable=trueで削除ボタンが表示される
- [ ] 削除ボタンクリック時にonRemoveが呼ばれる
- [ ] selected=trueで選択状態のスタイルになる

### 8.3 キーボード操作

- [ ] Tabでフォーカスできる（onClick指定時）
- [ ] Enter/Spaceでクリックできる
- [ ] Backspace/Deleteで削除できる（removable時）

### 8.4 アクセシビリティ

- [ ] 選択可能チップにrole="checkbox"が設定される
- [ ] aria-checked属性が正しく設定される
- [ ] disabled時にaria-disabled="true"
- [ ] 削除ボタンにaria-label="削除"

### 8.5 エラーケース

- [ ] 空のchildrenでもクラッシュしない
- [ ] variant="more"でchildrenが無視される

---

## 9. 実装ファイル

### 9.1 ファイル構成

```
src/components/elements/chip/
├── chip.tsx             # コンポーネント本体
├── styles.ts            # スタイル定義
├── chip.stories.tsx     # Storybook
├── chip.test.tsx        # テスト
└── index.ts             # エクスポート
```

### 9.2 Storybookストーリー

| ストーリー名 | 説明 |
|-------------|------|
| Default | 基本的なラベルチップ |
| Selectable | 選択可能なチップ |
| Selected | 選択済み状態 |
| Removable | 削除ボタン付き |
| Error | エラー状態 |
| Outline | 枠線スタイル |
| More | 「もっと見る」チップ |
| Disabled | 無効状態 |
| Sizes | サイズ比較 |
| TagList | タグ一覧での使用例 |

---

## 10. 使用例

### 10.1 基本的な使用法

```tsx
<Chip>タグ名</Chip>
```

### 10.2 選択可能なチップ

```tsx
<Chip
  variant="selectable"
  selected={isSelected}
  onClick={() => setIsSelected(!isSelected)}
>
  クトゥルフ神話TRPG
</Chip>
```

### 10.3 削除可能なチップ

```tsx
<Chip
  variant="selectable"
  removable
  onRemove={() => handleRemove(tag.id)}
>
  {tag.name}
</Chip>
```

### 10.4 エラー状態

```tsx
<Chip variant="selectable" status="error" removable onRemove={handleClear}>
  無効なタグ
</Chip>
```

### 10.5 タグ一覧での使用

```tsx
<div className={styles.tagList}>
  {tags.slice(0, 5).map(tag => (
    <Chip key={tag.id} variant="label" size="sm">
      {tag.name}
    </Chip>
  ))}
  {tags.length > 5 && (
    <Chip variant="more" size="sm" onClick={handleShowAll} />
  )}
</div>
```

---

## 11. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Chip | コンポーネント | `src/components/elements/chip/chip.tsx` | 未実装 |
| chip_* | css | `src/components/elements/chip/styles.ts` | 未実装 |

---

## 12. チェックリスト

要件定義完了確認:

- [x] Pencilデザインを確認した
- [x] ui-design-systemメモリを参照した
- [x] すべてのPropsを定義した
- [x] すべてのvariantsを定義した
- [x] インタラクション（hover/focus/active/disabled）を定義した
- [x] キーボード操作を定義した
- [x] アクセシビリティ要件を定義した
- [x] エラーケース・境界値を定義した
- [x] テスト観点を整理した

---

## 13. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Chip.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > Chip/*

現在の状態:
- コンポーネント未実装

次のフェーズ:
/gen-test Chip
```
