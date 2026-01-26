# Badge コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Badge/*

---

## 1. 概要

### 1.1 目的
ステータスや状態を視覚的に伝えるバッジコンポーネント。
シナリオの公開状態、セッションの状態表示などに使用する。

### 1.2 使用場所
- シナリオ一覧のステータス表示
- セッション一覧の状態表示
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: 独自実装（シンプルな表示コンポーネント）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | `"success" \| "warning" \| "error" \| "neutral"` | `"neutral"` | バリアント |
| `children` | `React.ReactNode` | - | バッジのラベル |
| `showDot` | `boolean` | `true` | ドットアイコンを表示 |

---

## 3. Pencilデザイン詳細

### 3.1 Badge/Success (L4C3w)
```
コンテナ:
  fill: #D1FAE5（淡い緑）
  cornerRadius: 12px
  padding: 4px 10px
  gap: 4px

ドット:
  width: 6px, height: 6px
  cornerRadius: 3px（円形）
  fill: #10B981（緑）

テキスト:
  text: "Active"
  fill: #065F46（濃い緑）
  fontSize: 12px
  fontWeight: 500
```

### 3.2 Badge/Warning (NAP0F)
```
コンテナ:
  fill: #FEF3C7（淡い黄色）

ドット:
  fill: #F59E0B（オレンジ）

テキスト:
  text: "Pending"
  fill: #92400E（濃い茶色）
```

### 3.3 Badge/Error (JKO9z)
```
コンテナ:
  fill: #FEE2E2（淡い赤）

ドット:
  fill: #EF4444（赤）

テキスト:
  text: "Error"
  fill: #991B1B（濃い赤）
```

### 3.4 Badge/Neutral (iCKDp)
```
コンテナ:
  fill: #F3F4F6（グレー）

ドット:
  fill: #6B7280（グレー）

テキスト:
  text: "Draft"
  fill: #374151（濃いグレー）
```

---

## 4. バリエーション

| variant | 背景色 | ドット色 | テキスト色 | 用途 |
|---------|--------|----------|------------|------|
| `success` | #D1FAE5 | #10B981 | #065F46 | 公開中、完了 |
| `warning` | #FEF3C7 | #F59E0B | #92400E | 保留中、準備中 |
| `error` | #FEE2E2 | #EF4444 | #991B1B | エラー、中止 |
| `neutral` | #F3F4F6 | #6B7280 | #374151 | 下書き、非公開 |

---

## 5. テスト観点

- [ ] success variantが正しく表示される
- [ ] warning variantが正しく表示される
- [ ] error variantが正しく表示される
- [ ] neutral variantが正しく表示される
- [ ] childrenが正しく表示される
- [ ] showDot=falseでドットが非表示になる
- [ ] デフォルトでドットが表示される

---

## 6. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Badge | コンポーネント | `src/components/elements/badge/badge.tsx` | 未実装 |
