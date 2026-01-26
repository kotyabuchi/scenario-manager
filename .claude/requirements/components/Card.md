# Card コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Card/*

---

## 1. 概要

### 1.1 目的
情報をカード形式で表示するコンポーネント。
シナリオ一覧、セッション一覧などで使用する。

### 1.2 使用場所
- シナリオ一覧
- セッション一覧
- ユーザー一覧
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: 独自実装
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `children` | `React.ReactNode` | - | カードのコンテンツ |
| `as` | `React.ElementType` | `"div"` | ルート要素 |
| `onClick` | `() => void` | - | クリック時のコールバック |
| `href` | `string` | - | リンク先（Link化） |

---

## 3. Pencilデザイン詳細

### 3.1 Card/Default (3sQ7e)
```
コンテナ:
  fill: #FFFFFF
  cornerRadius: 12px
  shadow: 0 4px blur:16px #0000000F
  width: 320px
  clip: true（オーバーフロー非表示）
  layout: vertical

サムネイル領域:
  height: 160px
  width: fill_container
  fill: gradient(#E5E7EB → #D1D5DB, 135deg)

  システムバッジ:
    position: 左上(0, 0)
    fill: #10B981
    cornerRadius: [0, 0, 8, 0]（右下のみ）
    padding: 6px 12px
    text: "System", #FFFFFF, 11px, fontWeight: 600

  ブックマークボタン:
    position: 右上(280, 12)
    fill: #00000040
    cornerRadius: 14px（円形）
    width: 28px, height: 28px
    icon: bookmark, 16px, #FFFFFF

コンテンツ領域:
  padding: 16px
  gap: 12px
  layout: vertical
  width: fill_container

  タイトル:
    text: "Card Title"
    fill: #1F2937
    fontSize: 16px
    fontWeight: 600

  メタ情報:
    gap: 16px
    layout: horizontal

    プレイヤー数:
      icon: users, 14px, #6B7280
      text: "3-5人", #6B7280, 13px
      gap: 6px

    プレイ時間:
      icon: clock-3, 14px, #6B7280
      text: "4-6時間", #6B7280, 13px
      gap: 6px

  タグ群:
    gap: 6px
    layout: horizontal
    width: fill_container

    タグ:
      fill: #F3F4F6
      cornerRadius: 4px
      height: 24px
      padding: 0 8px
      text: "Tag1", #4B5563, 11px, fontWeight: 500
```

---

## 4. サブコンポーネント

### 4.1 CardThumbnail
```typescript
type CardThumbnailProps = {
  src?: string
  alt?: string
  children?: React.ReactNode // オーバーレイ要素
}
```

### 4.2 CardContent
```typescript
type CardContentProps = {
  children: React.ReactNode
}
```

### 4.3 CardTitle
```typescript
type CardTitleProps = {
  children: React.ReactNode
  as?: 'h2' | 'h3' | 'h4'
}
```

### 4.4 CardMeta
```typescript
type CardMetaProps = {
  children: React.ReactNode
}
```

### 4.5 CardTags
```typescript
type CardTagsProps = {
  children: React.ReactNode
}
```

---

## 5. インタラクション

### 5.1 ホバー
```
hover:
  shadow: 0 8px blur:24px #00000015
  transform: translateY(-2px)
  transition: 150ms ease-out
```

### 5.2 クリック可能時
- `cursor: pointer`
- ホバーエフェクト強調

---

## 6. レスポンシブ

| 画面幅 | カード幅 |
|--------|---------|
| モバイル | 100% |
| タブレット | 50% |
| デスクトップ | 320px固定 |

---

## 7. テスト観点

- [ ] 正しくレンダリングされる
- [ ] サムネイルが表示される
- [ ] タイトルが表示される
- [ ] メタ情報が表示される
- [ ] タグが表示される
- [ ] クリック時にonClickが呼ばれる
- [ ] hrefがある場合Linkになる
- [ ] ホバースタイルが適用される

---

## 8. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Card | コンポーネント | `src/components/elements/card/card.tsx` | 未実装 |
| CardThumbnail | サブコンポーネント | `src/components/elements/card/card.tsx` | 未実装 |
| CardContent | サブコンポーネント | `src/components/elements/card/card.tsx` | 未実装 |
| CardTitle | サブコンポーネント | `src/components/elements/card/card.tsx` | 未実装 |
| CardMeta | サブコンポーネント | `src/components/elements/card/card.tsx` | 未実装 |
| CardTags | サブコンポーネント | `src/components/elements/card/card.tsx` | 未実装 |
