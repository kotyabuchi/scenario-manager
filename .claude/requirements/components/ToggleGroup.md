# ToggleGroup コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > ToggleGroup/*

---

## 1. 概要

### 1.1 目的
複数の選択肢から1つまたは複数を選択するトグルボタングループ。
表示モードの切り替え（グリッド/リスト/テーブル）などに使用する。

### 1.2 使用場所
- 一覧表示モード切り替え
- フィルタオプション
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI ToggleGroup
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `string \| string[]` | - | 選択中の値 |
| `defaultValue` | `string \| string[]` | - | デフォルトの選択値 |
| `onValueChange` | `(details) => void` | - | 値変更時のコールバック |
| `multiple` | `boolean` | `false` | 複数選択を許可 |
| `disabled` | `boolean` | `false` | 無効化 |
| `items` | `ToggleItem[]` | - | トグルアイテムの配列 |

```typescript
type ToggleItem = {
  value: string
  icon: React.ReactNode
  label?: string // アクセシビリティ用
}
```

---

## 3. Pencilデザイン詳細

### 3.1 ToggleGroup/Default (Npb4u)
```
コンテナ:
  fill: #F3F4F6（グレー背景）
  cornerRadius: 8px
  padding: 4px
  gap: 4px

アクティブアイテム:
  fill: #FFFFFF
  cornerRadius: 6px
  shadow: 0 1px blur:2px #0000000D
  width: 40px
  height: 40px

  アイコン:
    size: 20px
    fill: #1F2937（濃いグレー）
    例: menu (lucide)

非アクティブアイテム:
  fill: transparent
  width: 40px
  height: 40px

  アイコン:
    size: 20px
    fill: #9CA3AF（薄いグレー）
    例: list, layout-grid, table (lucide)
```

---

## 4. インタラクション

### 4.1 状態

| 状態 | アイコン色 | 背景 | 影 |
|------|----------|------|-----|
| active | #1F2937 | #FFFFFF | あり |
| inactive | #9CA3AF | transparent | なし |
| hover | #6B7280 | #E5E7EB | なし |
| disabled | #D1D5DB | transparent | なし |

### 4.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | グループにフォーカス |
| 矢印キー | アイテム間を移動 |
| Enter / Space | アイテムを選択 |

---

## 5. アクセシビリティ

- `role="group"` または `role="radiogroup"`（単一選択時）
- 各アイテムに `aria-pressed` または `aria-checked`
- アイコンのみの場合は `aria-label` 必須

---

## 6. テスト観点

- [ ] アクティブなアイテムが正しくスタイリングされる
- [ ] クリックでアイテムが選択される
- [ ] onValueChangeが呼ばれる
- [ ] multiple=trueで複数選択できる
- [ ] キーボードで操作できる
- [ ] disabled時は操作できない

---

## 7. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| ToggleGroup | コンポーネント | `src/components/elements/toggle-group/toggle-group.tsx` | 未実装 |
