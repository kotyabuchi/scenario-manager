# DatePicker コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > DatePicker/*

---

## 1. 概要

### 1.1 目的
日付を選択するためのカレンダー付き入力コンポーネント。
セッション日程の選択などに使用する。

### 1.2 使用場所
- セッション作成フォーム
- スケジュール登録
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI DatePicker
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `Date \| null` | - | 選択された日付 |
| `defaultValue` | `Date` | - | デフォルトの日付 |
| `onValueChange` | `(details) => void` | - | 日付変更時のコールバック |
| `label` | `string` | - | ラベル |
| `placeholder` | `string` | `"日付を選択"` | プレースホルダー |
| `required` | `boolean` | `false` | 必須 |
| `disabled` | `boolean` | `false` | 無効化 |
| `error` | `string` | - | エラーメッセージ |
| `min` | `Date` | - | 選択可能な最小日付 |
| `max` | `Date` | - | 選択可能な最大日付 |
| `locale` | `string` | `"ja-JP"` | ロケール |

---

## 3. Pencilデザイン詳細

### 3.1 DatePicker/Default (RgpLm)
```
コンテナ:
  layout: vertical
  gap: 8px
  width: 200px

ラベル:
  text: "日付"
  fill: #374151
  fontSize: 13px
  fontWeight: 500

入力ボックス:
  fill: #F3F4F6
  cornerRadius: 8px
  height: 44px
  padding: 0 12px
  justifyContent: space_between
  alignItems: center

  プレースホルダー:
    text: "日付を選択"
    fill: #9CA3AF
    fontSize: 14px

  アイコン:
    icon: calendar (lucide)
    size: 16px
    fill: #6B7280
```

### 3.2 DatePicker/Required (aH1vT)
```
ラベル行:
  gap: 4px

  ラベル:
    text: "日付"
    fill: #374151

  アスタリスク:
    text: "*"
    fill: #EF4444
```

### 3.3 DatePicker/Selected (vn4i8)
```
入力ボックス:
  text: "2025年1月25日"
  fill: #1F2937
  fontSize: 14px
```

### 3.4 DatePicker/Open (0FEc8)
```
入力ボックス（フォーカス時）:
  stroke: #10B981, 2px, inside
  icon: calendar, #10B981

カレンダードロップダウン:
  fill: #FFFFFF
  cornerRadius: 8px
  shadow: 0 4px blur:16px #00000015
  padding: 16px
  gap: 12px
  width: fill_container

  ヘッダー:
    justifyContent: space_between
    width: fill_container

    前月ボタン:
      icon: chevron-left, 20px, #6B7280

    月表示:
      text: "2025年 1月"
      fill: #1F2937
      fontSize: 14px
      fontWeight: 600

    次月ボタン:
      icon: chevron-right, 20px, #6B7280

  曜日ヘッダー:
    justifyContent: space_between

    日曜: fill: #EF4444
    月〜金: fill: #6B7280
    土曜: fill: #3B82F6
    fontSize: 12px, fontWeight: 500

  日付グリッド:
    gap: 4px
    layout: vertical

    日付セル:
      width: 28px, height: 28px
      cornerRadius: 6px
      alignItems: center
      justifyContent: center

    選択日:
      fill: #10B981
      text: #FFFFFF

    今日:
      stroke: #10B981

    他月の日:
      fill: transparent
      text: #9CA3AF
```

### 3.5 DatePicker/Disabled (8qcAC)
```
コンテナ:
  opacity: 0.5

入力ボックス:
  fill: #E5E7EB
  icon: calendar, #9CA3AF
```

### 3.6 DatePicker/Error (LO2rJ)
```
入力ボックス:
  fill: #FEF2F2
  stroke: #EF4444, 1px, inside
  icon: calendar, #EF4444

エラーメッセージ:
  text: "エラーメッセージ"
  fill: #EF4444
  fontSize: 12px
```

---

## 4. キーボード操作

| キー | 動作 |
|------|------|
| Enter / Space | カレンダーを開く/日付を選択 |
| Escape | カレンダーを閉じる |
| 矢印キー | 日付間を移動 |
| Page Up/Down | 月を移動 |
| Home/End | 月初/月末に移動 |

---

## 5. アクセシビリティ

- `role="dialog"` for カレンダーポップアップ
- `aria-label` for 日付セル
- `aria-selected` for 選択日
- `aria-current="date"` for 今日
- フォーカストラップ（カレンダー開時）

---

## 6. 日付フォーマット

| ロケール | 表示形式 | 例 |
|----------|---------|-----|
| ja-JP | YYYY年M月D日 | 2025年1月25日 |
| en-US | MMM D, YYYY | Jan 25, 2025 |

---

## 7. テスト観点

- [ ] デフォルト状態で正しく表示される
- [ ] カレンダーが開く
- [ ] 日付を選択できる
- [ ] 選択日が入力ボックスに表示される
- [ ] onValueChangeが呼ばれる
- [ ] 月を移動できる
- [ ] 必須マークが表示される（required=true）
- [ ] エラー状態が正しく表示される
- [ ] disabled時は操作できない
- [ ] キーボードで操作できる
- [ ] min/max範囲外の日付は選択できない

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| DatePicker | コンポーネント | `src/components/elements/date-picker/date-picker.tsx` | 未実装 |
