# Textarea コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Textarea/*

---

## 1. 概要

### 1.1 目的
複数行のテキストを入力するためのテキストエリアコンポーネント。
シナリオ概要、セッション説明などの入力に使用する。

### 1.2 使用場所
- シナリオ登録フォーム
- セッション作成フォーム
- レビュー投稿
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: 独自実装（HTML textarea）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `string` | - | 入力値 |
| `defaultValue` | `string` | - | デフォルト値 |
| `onChange` | `(e) => void` | - | 値変更時のコールバック |
| `label` | `string` | - | ラベル |
| `placeholder` | `string` | - | プレースホルダー |
| `required` | `boolean` | `false` | 必須 |
| `disabled` | `boolean` | `false` | 無効化 |
| `error` | `string` | - | エラーメッセージ |
| `rows` | `number` | `4` | 行数 |
| `maxLength` | `number` | - | 最大文字数 |

---

## 3. Pencilデザイン詳細

### 3.1 Textarea/Default (GLSit)
```
コンテナ:
  layout: vertical
  gap: 8px
  width: 240px

ラベル:
  text: "Label"
  fill: #374151
  fontSize: 13px
  fontWeight: 500

テキストエリア:
  fill: #F3F4F6
  cornerRadius: 8px
  padding: 12px
  height: 100px
  width: fill_container

  プレースホルダー:
    text: "Placeholder..."
    fill: #9CA3AF
    fontSize: 14px
```

### 3.2 Textarea/Required (xykv2)
```
ラベル行:
  gap: 4px

  ラベル:
    text: "Label"
    fill: #374151
    fontSize: 13px
    fontWeight: 500

  アスタリスク:
    text: "*"
    fill: #EF4444
    fontSize: 13px
    fontWeight: 500

テキストエリア:
  （Defaultと同じ）
```

### 3.3 Textarea/Filled (v08bW)
```
テキストエリア:
  fill: #F3F4F6

  テキスト:
    text: "入力されたテキストがここに表示されます..."
    fill: #1F2937
    fontSize: 14px
    textGrowth: fixed-width
```

### 3.4 Textarea/Error (pWrhp)
```
コンテナ:
  gap: 4px

ラベル + テキストエリア:
  gap: 8px

テキストエリア:
  fill: #FEF2F2（淡い赤）
  stroke: #EF4444, 1px, inside

エラーメッセージ:
  text: "エラーメッセージ"
  fill: #EF4444
  fontSize: 12px
```

### 3.5 Textarea/Disabled (1xn2X)
```
コンテナ:
  opacity: 'disabled'

テキストエリア:
  fill: #E5E7EB

  プレースホルダー:
    text: "Disabled..."
    fill: #9CA3AF
```

---

## 4. 状態一覧

| 状態 | 背景色 | ボーダー | テキスト色 |
|------|--------|---------|----------|
| default | #F3F4F6 | なし | #1F2937 |
| filled | #F3F4F6 | なし | #1F2937 |
| error | #FEF2F2 | #EF4444 1px | #1F2937 |
| disabled | #E5E7EB | なし | #9CA3AF |
| focus | #F3F4F6 | フォーカスリング | #1F2937 |

---

## 5. インタラクション

### 5.1 フォーカス
- フォーカスリング表示
- プレースホルダーはフォーカスで消えない（値入力で消える）

### 5.2 リサイズ
- `resize: vertical` でユーザーが高さを調整可能
- 最小高さは `rows` prop で指定

---

## 6. アクセシビリティ

- `<label>` と `<textarea>` を関連付け
- `aria-required` for 必須
- `aria-invalid` for エラー
- `aria-describedby` for エラーメッセージ

---

## 7. テスト観点

- [ ] デフォルト状態で正しく表示される
- [ ] ラベルが表示される
- [ ] プレースホルダーが表示される
- [ ] 必須マーク(*)が表示される（required=true）
- [ ] エラーメッセージが表示される（error指定時）
- [ ] エラー時のスタイルが適用される
- [ ] disabled時に入力できない
- [ ] 値の入力と変更が正しく動作する
- [ ] onChangeが呼ばれる

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Textarea | コンポーネント | `src/components/elements/textarea/textarea.tsx` | 未実装 |
