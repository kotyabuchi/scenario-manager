# UIコンポーネント挙動パターン

各コンポーネントの詳細なインタラクション・挙動仕様。
新規コンポーネント実装時や挙動修正時に参照すること。

---

## NumberInput

### ホイールスクロール操作
- **対象**: 増減ボタン（Control部分）の上
- **上スクロール**: 値をインクリメント
- **下スクロール**: 値をデクリメント
- **画面スクロール防止**: `e.preventDefault()` で画面全体のスクロールを抑制

### 実装パターン
```typescript
// useNumberInputContext で increment/decrement を取得
const context = useNumberInputContext();

const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    context.increment();
  } else if (e.deltaY > 0) {
    context.decrement();
  }
}, [context]);

// Control に onWheel を設定
<ArkNumberInput.Control onWheel={handleWheel}>
```

### Ark UI構造
```
Root
  ├── Label
  └── wrapper (視覚レイアウト用div)
        ├── Input (Controlの外)
        └── Control (ボタンのみ)
              ├── IncrementTrigger (ChevronUp)
              └── DecrementTrigger (ChevronDown)
```

---

## DatePicker

### キーボード操作（Ark UI標準）
- **Escape**: ポップオーバーを閉じる
- **矢印キー**: カレンダー内の日付移動
- **Enter/Space**: 日付選択

### マウス操作
- **カレンダーアイコンクリック**: ポップオーバーを開く
- **Xボタンクリック**: 選択をクリア（値がある場合のみ表示）
- **外側クリック**: ポップオーバーを閉じる（Ark UI標準）

### ビュー切り替え
- **日 → 月 → 年**: ヘッダーの年月表示をクリック
- **年 → 月 → 日**: 年/月を選択

### 実装上の注意
- ポップオーバーは `Portal` でbody直下にレンダリング
- Xボタン（ClearTrigger）は `value.length > 0` の時のみ表示
- デフォルトロケール: `ja-JP`

---

## Select / Combobox

### キーボード操作（Ark UI標準）
- **矢印上下**: 選択肢を移動
- **Enter/Space**: 選択確定
- **Escape**: ドロップダウンを閉じる
- **文字入力（Combobox）**: フィルタリング

### マウス操作
- **トリガークリック**: ドロップダウンを開閉
- **選択肢クリック**: 選択確定
- **外側クリック**: ドロップダウンを閉じる

---

## RadioGroup

### キーボード操作（Ark UI標準）
- **矢印左右/上下**: 選択を移動
- **Space**: 選択確定（フォーカス中のラジオボタン）

---

## FileUpload

### ドラッグ&ドロップ
- **ファイルをドロップゾーンにドラッグ**: ハイライト表示
- **ドロップ**: ファイルをアップロード

### クリック操作
- **ドロップゾーンクリック**: ファイル選択ダイアログを開く

---

## Modal

### キーボード操作
- **Escape**: モーダルを閉じる
- **Tab**: フォーカストラップ（モーダル内でループ）

### マウス操作
- **オーバーレイクリック**: モーダルを閉じる（設定による）

---

## 共通パターン

### フォーカス管理
- インタラクティブ要素は全てフォーカス可能
- フォーカスリングは `focusRing` トークンを使用
- モーダル/ドロップダウンはフォーカストラップを実装

### 無効状態
- `disabled` prop で無効化
- 視覚的に `opacity: 0.5` + `cursor: not-allowed`
- キーボード/マウス操作を無効化

### トランジション
- 状態変化は `transition: all 150ms ease-out` を基本とする
- ホバー/フォーカス/選択状態の切り替えに適用
