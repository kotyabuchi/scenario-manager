# Skeleton コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Skeleton/*

---

## 1. 概要

### 1.1 目的
コンテンツ読み込み中のプレースホルダーを表示するスケルトンコンポーネント。
ユーザーに読み込み中であることを視覚的に伝える。

### 1.2 使用場所
- シナリオ一覧読み込み中
- ユーザープロフィール読み込み中
- 各種データ取得中
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: 独自実装
- スタイリング: PandaCSS

---

## 2. Props設計

### 2.1 基本Skeleton

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | `"text" \| "circle" \| "rectangle"` | `"text"` | 形状バリアント |
| `width` | `string \| number` | `"100%"` | 幅 |
| `height` | `string \| number` | - | 高さ |
| `lines` | `number` | `1` | テキスト行数（variant="text"時） |
| `animate` | `boolean` | `true` | アニメーション有効 |

### 2.2 プリセットコンポーネント

- `SkeletonText` - テキスト用スケルトン
- `SkeletonAvatar` - アバター + テキスト用スケルトン
- `SkeletonCard` - カード用スケルトン

---

## 3. Pencilデザイン詳細

### 3.1 Skeleton/Text (QvJbz)
```
コンテナ:
  layout: vertical
  gap: 8px
  width: 200px

行1:
  width: fill_container
  height: 16px
  cornerRadius: 4px
  fill: gradient(#E5E7EB → #F3F4F6 → #E5E7EB)

行2:
  width: 160px
  height: 16px
  cornerRadius: 4px
  fill: gradient(#E5E7EB → #F3F4F6 → #E5E7EB)

行3:
  width: 120px
  height: 16px
  cornerRadius: 4px
  fill: gradient(#E5E7EB → #F3F4F6 → #E5E7EB)
```

### 3.2 Skeleton/Avatar (yceor)
```
コンテナ:
  layout: horizontal
  gap: 12px
  alignItems: center

円形アバター:
  width: 48px, height: 48px
  cornerRadius: 24px（円形）
  fill: gradient(#E5E7EB → #F3F4F6 → #E5E7EB)

テキスト部分:
  layout: vertical
  gap: 6px

  行1:
    width: 120px
    height: 14px
    cornerRadius: 4px

  行2:
    width: 80px
    height: 12px
    cornerRadius: 4px
```

### 3.3 Skeleton/Card (9qOiF)
```
コンテナ:
  fill: #FFFFFF
  cornerRadius: 12px
  shadow: 0 4px blur:16px #0000000F
  width: 240px
  layout: vertical

画像プレースホルダー:
  width: fill_container
  height: 120px
  fill: gradient(#E5E7EB → #F3F4F6 → #E5E7EB)

コンテンツ:
  padding: 16px
  gap: 12px
  layout: vertical

  タイトル:
    width: 160px
    height: 18px
    cornerRadius: 4px

  メタ:
    layout: horizontal
    gap: 12px

    メタ1: width: 60px, height: 14px
    メタ2: width: 60px, height: 14px

  タグ:
    layout: horizontal
    gap: 6px

    タグ1: width: 48px, height: 20px
    タグ2: width: 48px, height: 20px
```

---

## 4. アニメーション

```css
/* シマー効果 */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

background: linear-gradient(
  90deg,
  #E5E7EB 0%,
  #F3F4F6 50%,
  #E5E7EB 100%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

---

## 5. サイズバリエーション（テキスト用）

| サイズ | 高さ | 用途 |
|--------|------|------|
| sm | 12px | キャプション |
| md | 16px | 本文 |
| lg | 20px | 見出し |
| xl | 24px | タイトル |

---

## 6. テスト観点

- [ ] テキストスケルトンが正しく表示される
- [ ] アバタースケルトンが正しく表示される
- [ ] カードスケルトンが正しく表示される
- [ ] widthが正しく適用される
- [ ] heightが正しく適用される
- [ ] lines指定で複数行が表示される
- [ ] animate=falseでアニメーションが停止する
- [ ] アクセシビリティ属性が設定される（aria-busy, aria-label）

---

## 7. アクセシビリティ

- `aria-busy="true"` on 読み込み中のコンテナ
- `aria-label="読み込み中"` or 適切なラベル
- `role="progressbar"` （オプション）

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Skeleton | コンポーネント | `src/components/elements/skeleton/skeleton.tsx` | 未実装 |
| SkeletonText | プリセット | `src/components/elements/skeleton/skeleton.tsx` | 未実装 |
| SkeletonAvatar | プリセット | `src/components/elements/skeleton/skeleton.tsx` | 未実装 |
| SkeletonCard | プリセット | `src/components/elements/skeleton/skeleton.tsx` | 未実装 |
