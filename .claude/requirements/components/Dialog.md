# Dialog コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Dialog/*

---

## 1. 概要

### 1.1 目的
モーダルダイアログを表示するコンポーネント。
確認ダイアログ、フォーム入力、情報表示などに使用する。

### 1.2 使用場所
- 削除確認ダイアログ
- フォーム入力ダイアログ
- 詳細情報表示
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Dialog
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `open` | `boolean` | - | ダイアログの開閉状態 |
| `onOpenChange` | `(details: OpenChangeDetails) => void` | - | 開閉状態変更時のコールバック |
| `title` | `string` | - | ダイアログのタイトル |
| `children` | `React.ReactNode` | - | ダイアログのコンテンツ |
| `footer` | `React.ReactNode` | - | フッター領域（ボタン等） |
| `closeOnOutsideClick` | `boolean` | `true` | 外側クリックで閉じる |
| `closeOnEscape` | `boolean` | `true` | Escapeキーで閉じる |

---

## 3. Pencilデザイン詳細

### 3.1 Dialog/Default (1CkXc)
```
コンテナ:
  fill: #FFFFFF
  cornerRadius: 12px
  shadow: 0 8px blur:24px #00000020
  padding: 24px
  gap: 16px
  width: 709px（可変）

ヘッダー:
  width: fill_container
  justifyContent: space_between
  alignItems: center

  タイトル:
    text: "Dialog Title"
    fill: #1F2937
    fontSize: 18px
    fontWeight: 600

  閉じるボタン:
    icon: x (lucide)
    size: 20px
    fill: #9CA3AF

コンテンツ:
  text: 説明テキスト
  fill: #6B7280
  fontSize: 14px

フッター:
  width: fill_container
  justifyContent: end
  gap: 12px

  キャンセルボタン:
    fill: #FFFFFF
    cornerRadius: 8px
    height: 40px
    padding: 0 16px
    shadow: 0 1px blur:2px #0000000D
    text: "Cancel", #374151, 14px, fontWeight: 500

  確認ボタン:
    fill: #10B981（緑）
    cornerRadius: 8px
    height: 40px
    padding: 0 16px
    text: "Confirm", #FFFFFF, 14px, fontWeight: 500
```

---

## 4. サブコンポーネント

### 4.1 DialogHeader
```typescript
type DialogHeaderProps = {
  children: React.ReactNode
  onClose?: () => void
  showCloseButton?: boolean
}
```

### 4.2 DialogContent
```typescript
type DialogContentProps = {
  children: React.ReactNode
}
```

### 4.3 DialogFooter
```typescript
type DialogFooterProps = {
  children: React.ReactNode
}
```

---

## 5. キーボード操作

| キー | 動作 |
|------|------|
| Escape | ダイアログを閉じる |
| Tab | フォーカス移動（ダイアログ内でトラップ） |

---

## 6. アクセシビリティ

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` でタイトルと関連付け
- フォーカストラップ
- 開いた時に最初のフォーカス可能要素にフォーカス
- 閉じた時にトリガー要素にフォーカスを戻す

---

## 7. オーバーレイ

```
背景オーバーレイ:
  fill: #00000040（半透明黒）
  position: fixed
  inset: 0
```

---

## 8. テスト観点

- [ ] openがtrueの時に表示される
- [ ] openがfalseの時に非表示になる
- [ ] タイトルが正しく表示される
- [ ] 閉じるボタンでonOpenChangeが呼ばれる
- [ ] Escapeキーで閉じる
- [ ] 外側クリックで閉じる（closeOnOutsideClick=true）
- [ ] 外側クリックで閉じない（closeOnOutsideClick=false）
- [ ] フォーカストラップが機能する
- [ ] フッターが正しく表示される

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Dialog | コンポーネント | `src/components/elements/dialog/dialog.tsx` | 未実装 |
