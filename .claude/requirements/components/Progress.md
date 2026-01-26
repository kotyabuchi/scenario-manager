# Progress コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Progress/*

---

## 1. 概要

### 1.1 目的
進捗状況を視覚的に表示するコンポーネント。
バー形式とサークル形式の2種類を提供する。

### 1.2 使用場所
- ファイルアップロード進捗
- タスク完了率
- ローディング表示
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Progress（または独自実装）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `number` | `0` | 現在の値（0-100） |
| `max` | `number` | `100` | 最大値 |
| `variant` | `"bar" \| "circle"` | `"bar"` | 表示形式 |
| `showValue` | `boolean` | `true` | 値を表示するか |
| `label` | `string` | - | ラベルテキスト |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | サイズ（circle用） |

---

## 3. Pencilデザイン詳細

### 3.1 Progress/Bar (Z6EiA)
```
ラベル行:
  左: "Progress", #374151, 13px, fontWeight: normal
  右: "65%", #10B981, 13px, fontWeight: 500
  justifyContent: space-between
  gap: 4px

トラック:
  fill: #E5E7EB
  cornerRadius: 4px
  height: 8px
  width: 100%（fill_container）

フィル:
  fill: #10B981
  cornerRadius: 4px
  height: 8px
  width: 65%（value%）

全体幅: 240px（例）
```

### 3.2 Progress/Circle (Z7IY7)
```
背景サークル:
  fill: #E5E7EB
  cornerRadius: 32px
  width: 64px
  height: 64px

フォアグラウンドサークル:
  fill: #FFFFFF
  cornerRadius: 28px
  width: 56px
  height: 56px
  位置: 中央（x:4, y:4）

値テキスト:
  text: "65%", #10B981, 14px, fontWeight: 600
  位置: 中央
```

---

## 4. テスト観点

- [ ] バー形式で正しく表示される
- [ ] サークル形式で正しく表示される
- [ ] value=0で空の状態が表示される
- [ ] value=100で完全に埋まる
- [ ] ラベルが表示される
- [ ] パーセント表示が正しい

---

## 5. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Progress | コンポーネント | `src/components/elements/progress/progress.tsx` | 未実装 |
