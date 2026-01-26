# NumberInput コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > NumberInput/*

---

## 1. 概要

### 1.1 目的
数値を入力するためのコンポーネント。
上下ボタンで値を増減でき、直接入力も可能。

### 1.2 使用場所
- プレイ人数入力
- プレイ時間入力
- 数量入力
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI NumberInput
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `number` | - | 現在の値 |
| `defaultValue` | `number` | - | デフォルト値 |
| `onValueChange` | `(details) => void` | - | 値変更時のコールバック |
| `min` | `number` | - | 最小値 |
| `max` | `number` | - | 最大値 |
| `step` | `number` | `1` | 増減ステップ |
| `label` | `string` | - | ラベル |
| `disabled` | `boolean` | `false` | 無効化 |
| `required` | `boolean` | `false` | 必須 |

---

## 3. Pencilデザイン詳細

### 3.1 NumberInput/Default (9jT6U)
```
コンテナ:
  layout: vertical
  gap: 8px
  width: 200px

ラベル:
  text: "Label"
  fill: #374151
  fontSize: 13px
  fontWeight: 500

入力ボックス:
  fill: #FFFFFF
  cornerRadius: 8px
  shadow: 0 1px blur:3px #0000001A
  height: 44px
  width: fill_container

  値表示:
    padding: 0 12px
    text: "3"
    fill: #1F2937
    fontSize: 14px

  ボタン群:
    width: 32px
    layout: vertical

    上ボタン:
      fill: #F9FAFB
      cornerRadius: [0, 8, 0, 0]（右上のみ）
      height: 22px
      icon: chevron-up, 14px, #6B7280

    下ボタン:
      fill: #F9FAFB
      cornerRadius: [0, 0, 8, 0]（右下のみ）
      height: 22px
      icon: chevron-down, 14px, #6B7280
```

---

## 4. インタラクション

### 4.1 上下ボタン
- 上ボタンクリック: 値が`step`増加
- 下ボタンクリック: 値が`step`減少
- 長押し: 連続的に値が変化

### 4.2 直接入力
- 数値のみ入力可能
- フォーカス時に全選択

### 4.3 キーボード操作

| キー | 動作 |
|------|------|
| 上矢印 | 値を増加 |
| 下矢印 | 値を減少 |
| Page Up | 大きく増加（step * 10） |
| Page Down | 大きく減少（step * 10） |
| Home | 最小値に設定 |
| End | 最大値に設定 |

---

## 5. バリデーション

- `min`を下回る値は`min`に補正
- `max`を超える値は`max`に補正
- 非数値入力は無視

---

## 6. アクセシビリティ

- `role="spinbutton"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` または `aria-labelledby`
- 上下ボタンに適切なラベル

---

## 7. テスト観点

- [ ] 初期値が正しく表示される
- [ ] 上ボタンで値が増加する
- [ ] 下ボタンで値が減少する
- [ ] min以下にならない
- [ ] max以上にならない
- [ ] 直接入力できる
- [ ] キーボードで操作できる
- [ ] disabled時は操作できない
- [ ] onValueChangeが呼ばれる

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| NumberInput | コンポーネント | `src/components/elements/number-input/number-input.tsx` | 未実装 |
