# Tooltip コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Tooltip/*

---

## 1. 概要

### 1.1 目的
要素にホバーした際に追加情報を表示するツールチップコンポーネント。
ボタンの説明、省略されたテキストの全文表示などに使用する。

### 1.2 使用場所
- アイコンボタンの説明
- 省略テキストの全文表示
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Tooltip
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `content` | `React.ReactNode` | - | ツールチップの内容 |
| `children` | `React.ReactNode` | - | トリガー要素 |
| `placement` | `Placement` | `"top"` | 表示位置 |
| `delay` | `number` | `300` | 表示遅延（ms） |

---

## 3. Pencilデザイン詳細

### 3.1 Tooltip/Default (hLf9u)
```
コンテナ:
  fill: #1F2937（ダーク）
  cornerRadius: 6px
  padding: 6px 10px

テキスト:
  text: #FFFFFF, 12px, fontWeight: normal

矢印:
  fill: #1F2937
  width: 8px
  height: 4px
```

---

## 4. テスト観点

- [ ] ホバーで表示される
- [ ] 指定した内容が表示される
- [ ] placement通りの位置に表示される
- [ ] ホバー解除で非表示になる
- [ ] delay後に表示される

---

## 5. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Tooltip | コンポーネント | `src/components/elements/tooltip/tooltip.tsx` | 未実装 |
