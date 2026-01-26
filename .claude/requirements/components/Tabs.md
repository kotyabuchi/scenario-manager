# Tabs コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Tabs/*

---

## 1. 概要

### 1.1 目的
コンテンツを複数のタブで切り替えて表示するコンポーネント。
ページ内でのセクション切り替えに使用する。

### 1.2 使用場所
- シナリオ詳細画面のセクション切り替え
- 設定画面のカテゴリ切り替え
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Tabs
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `string` | - | 選択されたタブの値 |
| `defaultValue` | `string` | - | デフォルト選択タブ |
| `onValueChange` | `(details) => void` | - | タブ変更時のコールバック |
| `variant` | `"default" \| "underline"` | `"default"` | スタイルバリアント |
| `items` | `TabItem[]` | - | タブ項目の配列 |

```typescript
type TabItem = {
  value: string;
  label: string;
  disabled?: boolean;
  content: React.ReactNode;
};
```

---

## 3. Pencilデザイン詳細

### 3.1 Tabs/Default (JnzSU)
```
コンテナ:
  fill: #F3F4F6
  cornerRadius: 8px
  padding: 4px

アクティブタブ:
  fill: #FFFFFF
  cornerRadius: 6px
  shadow: 0 1px blur:2px #0000000D
  text: #1F2937, 14px, fontWeight: 500
  height: 36px
  padding: 0 16px

非アクティブタブ:
  fill: transparent
  text: #6B7280, 14px, fontWeight: normal
  height: 36px
  padding: 0 16px
```

### 3.2 Tabs/Underline (N5U5l)
```
コンテナ:
  fill: transparent

アクティブタブ:
  text: #10B981, 14px, fontWeight: 500
  padding: 12px 16px
  下線: #10B981, height: 2px, cornerRadius: 1px

非アクティブタブ:
  text: #6B7280, 14px, fontWeight: normal
  padding: 12px 16px
  下線: #E5E7EB, height: 2px, cornerRadius: 1px
```

---

## 4. キーボード操作

| キー | 動作 |
|------|------|
| Tab | タブリストにフォーカス |
| 左右矢印 | タブ間を移動 |
| Enter / Space | タブを選択 |

---

## 5. テスト観点

- [ ] デフォルトスタイルで正しく表示される
- [ ] アンダーラインスタイルで正しく表示される
- [ ] タブクリックでコンテンツが切り替わる
- [ ] onValueChangeが呼ばれる
- [ ] キーボードで操作できる
- [ ] disabledタブはクリックできない

---

## 6. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Tabs | コンポーネント | `src/components/elements/tabs/tabs.tsx` | 未実装 |
