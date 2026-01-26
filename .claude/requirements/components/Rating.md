# Rating コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Rating/*

---

## 1. 概要

### 1.1 目的
星評価を表示・入力するコンポーネント。
シナリオ・セッションの評価表示・入力に使用する。

### 1.2 使用場所
- シナリオ詳細のレビュー
- レビュー投稿フォーム
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI RatingGroup（または独自実装）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `number` | `0` | 現在の評価値 |
| `max` | `number` | `5` | 最大星数 |
| `onValueChange` | `(value: number) => void` | - | 値変更時のコールバック |
| `readOnly` | `boolean` | `false` | 読み取り専用 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | サイズ |
| `allowHalf` | `boolean` | `false` | 半星を許可 |

---

## 3. Pencilデザイン詳細

### 3.1 Rating/Default (WLKoQ)
```
星アイコン（塗りつぶし）:
  star, 20px, #FBBF24（黄色）

星アイコン（空）:
  star, 20px, #E5E7EB（グレー）

gap: 4px

例: 3/5 → 3つ黄色、2つグレー
```

---

## 4. サイズバリエーション

| サイズ | アイコンサイズ | gap |
|--------|--------------|-----|
| `sm` | 16px | 2px |
| `md` | 20px | 4px |
| `lg` | 24px | 6px |

---

## 5. インタラクション

### 5.1 読み取り専用（readOnly=true）
- 表示のみ、クリック無効
- カーソルはdefault

### 5.2 編集可能（readOnly=false）
- 星クリックで値を設定
- ホバーで仮の値を表示
- カーソルはpointer

---

## 6. アクセシビリティ

- `role="radiogroup"` または `role="slider"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

---

## 7. テスト観点

- [ ] value通りの星が塗りつぶされる
- [ ] readOnlyで編集できない
- [ ] クリックでonValueChangeが呼ばれる
- [ ] 各サイズが正しく表示される
- [ ] allowHalfで半星が機能する

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Rating | コンポーネント | `src/components/elements/rating/rating.tsx` | 未実装 |
