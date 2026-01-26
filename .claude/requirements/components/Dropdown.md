# Dropdown コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Dropdown/*

---

## 1. 概要

### 1.1 目的
ドロップダウンメニューを表示するコンポーネント。
ソート順の選択、アクションメニューなどに使用する。

### 1.2 使用場所
- シナリオ一覧のソート選択
- アクションメニュー
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Menu
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `items` | `DropdownItem[]` | - | メニュー項目 |
| `value` | `string` | - | 選択中の値 |
| `onValueChange` | `(value: string) => void` | - | 値変更時のコールバック |
| `trigger` | `React.ReactNode` | - | トリガー要素 |
| `placement` | `Placement` | `"bottom-start"` | 表示位置 |

```typescript
type DropdownItem = {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
}
```

---

## 3. Pencilデザイン詳細

### 3.1 Dropdown/Menu (eoPa4)
```
コンテナ:
  fill: #FFFFFF
  cornerRadius: 8px
  shadow: 0 4px blur:16px #00000015
  padding: 4px
  width: 160px
  layout: vertical

選択中アイテム:
  fill: #F0FDF4（淡い緑）
  cornerRadius: 6px
  height: 36px
  padding: 0 12px
  justifyContent: space_between
  alignItems: center

  テキスト:
    text: "新着順"
    fill: #10B981（緑）
    fontSize: 13px

  チェックアイコン:
    icon: check (lucide)
    size: 14px
    fill: #10B981

通常アイテム:
  fill: transparent
  cornerRadius: 6px
  height: 36px
  padding: 0 12px
  alignItems: center

  テキスト:
    text: "高評価順" / "プレイ時間順" / "人数順"
    fill: #374151
    fontSize: 13px
```

---

## 4. インタラクション

### 4.1 状態

| 状態 | 背景色 | テキスト色 | アイコン |
|------|--------|----------|---------|
| default | transparent | #374151 | なし |
| hover | #F3F4F6 | #374151 | なし |
| selected | #F0FDF4 | #10B981 | check |
| disabled | transparent | #9CA3AF | なし |

### 4.2 キーボード操作

| キー | 動作 |
|------|------|
| Enter / Space | メニューを開く / アイテムを選択 |
| Escape | メニューを閉じる |
| 上下矢印 | アイテム間を移動 |
| Home / End | 最初/最後のアイテムに移動 |

---

## 5. アクセシビリティ

- `role="menu"` for メニューコンテナ
- `role="menuitem"` for 各アイテム
- `aria-checked` for 選択状態
- `aria-disabled` for 無効状態
- フォーカス管理（開いた時に最初のアイテムにフォーカス）

---

## 6. テスト観点

- [ ] トリガークリックでメニューが開く
- [ ] アイテムが正しく表示される
- [ ] 選択中のアイテムにチェックが表示される
- [ ] アイテムクリックでonValueChangeが呼ばれる
- [ ] メニュー外クリックで閉じる
- [ ] Escapeキーで閉じる
- [ ] キーボードで操作できる
- [ ] disabledアイテムは選択できない

---

## 7. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Dropdown | コンポーネント | `src/components/elements/dropdown/dropdown.tsx` | 未実装 |
