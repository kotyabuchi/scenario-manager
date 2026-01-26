# SimpleFooter コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > SimpleFooter/*

---

## 1. 概要

### 1.1 目的
内部ページで使用するシンプルなフッターコンポーネント。
コピーライト表示のみのミニマルなデザイン。

### 1.2 使用場所
- 内部ページ（認証後のページ）
- 再利用性: 高（レイアウトコンポーネントとして1箇所で使用）

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: 独自実装
- スタイリング: PandaCSS
- 配置: `src/components/blocks/`

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `year` | `number` | `new Date().getFullYear()` | コピーライト年 |

---

## 3. Pencilデザイン詳細

### 3.1 SimpleFooter/Default (3IKRN)
```
コンテナ:
  fill: #FFFFFF
  height: 48px
  width: 1440px（フル幅）
  alignItems: center
  justifyContent: center
  layout: vertical

コピーライト:
  text: "© 2026 シナプレ管理くん"
  fill: #9CA3AF
  fontSize: 12px
```

---

## 4. レスポンシブ対応

- 全画面幅で中央揃え
- 高さは固定（48px）

---

## 5. アクセシビリティ

- `<footer>` 要素を使用
- `role="contentinfo"` は暗黙的に適用

---

## 6. テスト観点

- [ ] 正しくレンダリングされる
- [ ] コピーライトテキストが表示される
- [ ] 年が正しく表示される
- [ ] footer要素が使用されている

---

## 7. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| SimpleFooter | コンポーネント | `src/components/blocks/simple-footer/simple-footer.tsx` | 実装済み |
