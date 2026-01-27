# TagsInput コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > TagsInput/*

---

## 1. 概要

### 1.1 目的
複数のタグを入力・選択するためのコンポーネント。
シナリオのタグ付け、検索フィルタなどに使用する。

### 1.2 使用場所
- シナリオ登録フォーム
- シナリオ検索フィルタ
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI TagsInput（または独自実装）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `string[]` | - | 選択されたタグ |
| `defaultValue` | `string[]` | `[]` | デフォルトのタグ |
| `onValueChange` | `(details) => void` | - | タグ変更時のコールバック |
| `label` | `string` | - | ラベル |
| `placeholder` | `string` | `"タグを追加..."` | プレースホルダー |
| `required` | `boolean` | `false` | 必須 |
| `disabled` | `boolean` | `false` | 無効化 |
| `error` | `string` | - | エラーメッセージ |
| `suggestions` | `string[]` | - | サジェストリスト |
| `maxTags` | `number` | - | 最大タグ数 |
| `allowCustom` | `boolean` | `true` | カスタムタグの追加を許可 |

---

## 3. Pencilデザイン詳細

### 3.1 TagsInput/Default (pt4gt)
```
コンテナ:
  layout: vertical
  gap: 8px
  width: 320px

ラベル:
  text: "Tags"
  fill: #374151
  fontSize: 13px
  fontWeight: 500

入力ボックス:
  fill: #F3F4F6
  cornerRadius: 8px
  padding: 8px
  gap: 6px
  alignItems: center

  タグ:
    fill: #FFFFFF
    cornerRadius: 4px
    shadow: 0 1px blur:2px #0000000D
    padding: 4px 8px
    gap: 6px
    alignItems: center

    テキスト:
      text: "ホラー"
      fill: #374151
      fontSize: 13px

    閉じるボタン:
      icon: x, 12px, #9CA3AF

  プレースホルダー:
    text: "タグを追加..."
    fill: #9CA3AF
    fontSize: 14px
```

### 3.2 TagsInput/Required (DcBXT)
```
ラベル行:
  gap: 4px

  ラベル:
    text: "Tags"
    fill: #374151

  アスタリスク:
    text: "*"
    fill: #EF4444
```

### 3.3 TagsInput/Disabled (XpsfA)
```
コンテナ:
  opacity: 'disabled'

入力ボックス:
  fill: #E5E7EB

タグの閉じるボタン:
  非表示または無効
```

### 3.4 TagsInput/Error (9dKHN)
```
入力ボックス:
  fill: #FEF2F2
  stroke: #EF4444, 1px, inside

エラーメッセージ:
  text: "エラーメッセージ"
  fill: #EF4444
  fontSize: 12px
```

### 3.5 TagsInput/Focused (sz8j6)
```
入力ボックス:
  stroke: #10B981, 2px, inside

カーソル:
  fill: #10B981
  width: 2px
  height: 16px

入力テキスト:
  text: "探"
  fill: #1F2937
  fontSize: 14px

サジェストドロップダウン:
  fill: #FFFFFF
  cornerRadius: 8px
  shadow: 0 4px blur:16px #00000015
  padding: 4px
  width: fill_container

  マッチアイテム:
    fill: #F0FDF4
    cornerRadius: 6px
    height: 36px
    padding: 0 12px
    justifyContent: space_between

    テキスト: "探索", #10B981, 13px
    マッチラベル: "マッチ", #10B981, 11px, opacity: 0.7

  通常アイテム:
    fill: transparent
    cornerRadius: 6px
    height: 36px
    padding: 0 12px

    テキスト: "探偵", #374151, 13px
```

---

## 4. インタラクション

### 4.1 タグ追加
- Enter キーで確定
- カンマで区切って複数追加
- サジェストからクリックで選択

### 4.2 タグ削除
- タグの×ボタンをクリック
- Backspaceで最後のタグを削除

### 4.3 キーボード操作

| キー | 動作 |
|------|------|
| Enter | タグを確定 |
| Backspace | 最後のタグを削除（入力が空の時） |
| 上下矢印 | サジェスト内を移動 |
| Escape | サジェストを閉じる |

---

## 5. サジェスト機能

- 入力に応じてフィルタリング
- 部分一致でマッチ
- マッチ部分をハイライト
- 最大表示件数を制限（例: 5件）

---

## 6. アクセシビリティ

- `role="listbox"` for サジェストリスト
- `aria-expanded` for ドロップダウン状態
- `aria-selected` for 選択中のサジェスト
- タグに `role="option"` and `aria-selected`

---

## 7. テスト観点

- [ ] デフォルト状態で正しく表示される
- [ ] タグが表示される
- [ ] タグを追加できる
- [ ] タグを削除できる
- [ ] サジェストが表示される
- [ ] サジェストから選択できる
- [ ] onValueChangeが呼ばれる
- [ ] 必須マークが表示される（required=true）
- [ ] エラー状態が正しく表示される
- [ ] disabled時は操作できない
- [ ] maxTagsで追加制限される
- [ ] キーボードで操作できる

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| TagsInput | コンポーネント | `src/components/elements/tags-input/tags-input.tsx` | 未実装 |
