# Pagination コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Pagination/*

---

## 1. 概要

### 1.1 目的
大量のデータをページ単位で表示する際のナビゲーションコンポーネント。
検索結果やリスト表示で使用する。

### 1.2 使用場所
- シナリオ一覧
- セッション一覧
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Pagination（または独自実装）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `page` | `number` | `1` | 現在のページ |
| `totalPages` | `number` | - | 総ページ数 |
| `onPageChange` | `(page: number) => void` | - | ページ変更時のコールバック |
| `siblingCount` | `number` | `1` | 現在ページの前後に表示するページ数 |

---

## 3. Pencilデザイン詳細

### 3.1 Pagination/Default (PibZm)
```
前へボタン:
  fill: #FFFFFF
  cornerRadius: 6px
  width: 36px
  height: 36px
  shadow: 0 1px blur:2px #0000000D
  アイコン: chevron-left, 16px, #6B7280

ページ番号（アクティブ）:
  fill: #10B981（緑）
  cornerRadius: 6px
  width: 36px
  height: 36px
  text: "1", #FFFFFF, 14px, fontWeight: 500

ページ番号（非アクティブ）:
  fill: #FFFFFF
  cornerRadius: 6px
  width: 36px
  height: 36px
  shadow: 0 1px blur:2px #0000000D
  text: "2", #374151, 14px, fontWeight: normal

省略記号:
  text: "...", #6B7280, 14px
  width: 36px
  height: 36px

次へボタン:
  同様に chevron-right

gap: 4px
```

---

## 4. キーボード操作

| キー | 動作 |
|------|------|
| Tab | ボタン間を移動 |
| Enter / Space | ページを選択 |

---

## 5. テスト観点

- [ ] 正しいページ数が表示される
- [ ] 現在のページがアクティブになる
- [ ] ページクリックでonPageChangeが呼ばれる
- [ ] 前へ/次へボタンが動作する
- [ ] 省略記号が適切に表示される
- [ ] 最初/最後のページで前へ/次へが無効になる

---

## 6. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Pagination | コンポーネント | `src/components/elements/pagination/pagination.tsx` | 未実装 |
