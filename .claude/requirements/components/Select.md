# Select コンポーネント 要件定義書

**作成日**: 2026-01-25（2026-01-26更新）
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Select/*, Dropdown/*

---

## 1. 概要

### 1.1 目的
Selectコンポーネントのドロップダウン部分をui-design-systemに準拠したスタイルに改善する。
特に選択肢のホバー状態と選択済み状態の視覚的表現を緑のアンダートーンを持つパレットに統一する。

### 1.2 使用場所
- フォーム内の選択入力（システム選択、カテゴリ選択など）
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Select
- カスタマイズ: スタイルのみ変更（機能は維持）

---

## 2. 改善対象

### 2.1 現状の問題点
- ホバー時の背景色がグレー系（緑のアンダートーンなし）
- 選択済み状態の背景色がデザインシステムと不整合
- ドロップダウンの内部Paddingが未統一

### 2.2 改善箇所

| 箇所 | 現状 | 改善後 |
|------|------|--------|
| ドロップダウンPadding | `py: 4px` | `p: 4px`（上下左右統一） |
| アイテムホバー背景 | `menu.itemBgHover`（グレー系） | `oklch(0.98 0.03 150)`（primary.50相当） |
| アイテム選択済み背景 | `menu.itemBgSelected` | `oklch(0.95 0.05 150)`（primary.100相当） |
| アイテム選択済みテキスト | `menu.itemTextSelected` | `oklch(0.40 0.15 160)`（primary.800相当） |
| ハイライト（キーボード） | `menu.itemBgHover` | ホバーと同じ |

---

## 3. スタイル仕様

### 3.1 ドロップダウンコンテナ（select_content）

```typescript
{
  bg: 'white', // または 'menu.bg'
  borderRadius: '8px',
  boxShadow: 'menu.default', // 現状維持
  p: '4px', // 上下左右統一
  outline: 'none',
  maxH: '300px',
  overflowY: 'auto',
}
```

### 3.2 アイテム（select_item）

```typescript
{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', // 左: テキスト、右: チェック
  px: '12px',
  py: '8px',
  fontSize: '14px',
  color: 'menu.itemText', // または neutral.700相当
  cursor: 'pointer',
  borderRadius: '4px', // アイテム自体にも角丸
  transition: 'background-color 100ms ease-out',

  // ホバー状態
  _hover: {
    bg: 'oklch(0.98 0.03 150)', // primary.50相当
  },

  // キーボードハイライト状態
  _highlighted: {
    bg: 'oklch(0.98 0.03 150)', // ホバーと同じ
  },

  // 選択済み状態
  _selected: {
    bg: 'oklch(0.95 0.05 150)', // primary.100相当
    color: 'oklch(0.40 0.15 160)', // primary.800相当
    fontWeight: '500',
  },

  // 無効状態
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    _hover: {
      bg: 'transparent',
    },
  },
}
```

### 3.3 チェックアイコン（select_itemIndicator）

```typescript
{
  color: 'oklch(0.40 0.15 160)', // primary.800相当
  // または 'primary.default' トークン
}
```

---

## 4. カラートークン対応

ui-design-systemのカラーパレットに準拠:

| 用途 | OKLCH値 | トークン名（推奨） |
|------|---------|-------------------|
| ホバー背景 | `oklch(0.98 0.03 150)` | `primary.50` |
| 選択済み背景 | `oklch(0.95 0.05 150)` | `primary.100` |
| 選択済みテキスト | `oklch(0.40 0.15 160)` | `primary.800` |
| チェックアイコン | `oklch(0.40 0.15 160)` | `primary.800` |

**注意**: セマンティックトークン `menu.itemBgHover` 等を更新するか、直接OKLCH値を使用するかはトークン設計方針に従う。

---

## 5. インタラクション

### 5.1 状態遷移

| 状態 | 見た目 |
|------|--------|
| default | 白背景、neutral.700テキスト |
| hover | primary.50背景 |
| highlighted（キーボード） | primary.50背景（hoverと同じ） |
| selected | primary.100背景、primary.800テキスト、fontWeight: 500 |
| selected + hover | primary.100背景を維持 |
| disabled | opacity: 0.5、カーソル変更 |

### 5.2 キーボード操作（Ark UI標準）

| キー | 動作 |
|------|------|
| 矢印上下 | 選択肢を移動（ハイライト） |
| Enter/Space | 選択確定 |
| Escape | ドロップダウンを閉じる |

---

## 6. アクセシビリティ

### 6.1 コントラスト確認

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| primary.50背景 + neutral.700テキスト | 約8:1 | ✅ |
| primary.100背景 + primary.800テキスト | 約7:1 | ✅ |
| 白背景 + neutral.700テキスト | 約9:1 | ✅ |

### 6.2 ARIA属性（Ark UI標準）
- `role="listbox"`: ドロップダウン
- `role="option"`: 各アイテム
- `aria-selected`: 選択状態

---

## 7. テスト観点

### 7.1 スタイル（視覚的）

- [ ] ドロップダウンのpaddingが4px（上下左右）
- [ ] アイテムのpaddingが px:12px, py:8px
- [ ] アイテム間のgapが適切（paddingで調整）
- [ ] 角丸が8px（ドロップダウン）

### 7.2 インタラクション

- [ ] ホバー時に背景色がprimary.50に変わる
- [ ] キーボードハイライト時に背景色がprimary.50に変わる
- [ ] 選択済みアイテムの背景色がprimary.100
- [ ] 選択済みアイテムのテキスト色がprimary.800
- [ ] 選択済みアイテムのfontWeightが500
- [ ] チェックアイコンの色がprimary.800
- [ ] 無効アイテムのopacityが0.5

### 7.3 既存テストの維持

- [ ] プレースホルダー表示
- [ ] 選択値表示
- [ ] ドロップダウン開閉
- [ ] disabled状態
- [ ] 複数選択

---

## 8. 実装メモ

### 8.1 変更ファイル

```
src/components/elements/select/
├── select.tsx     # 変更なし
├── styles.ts      # スタイル変更
├── select.test.tsx # 必要に応じてスタイルテスト追加
└── select.stories.tsx # 変更なし
```

### 8.2 トークン更新（オプション）

セマンティックトークンを更新する場合:

```typescript
// src/styles/semanticTokens.ts
menu: {
  itemBgHover: 'oklch(0.98 0.03 150)',      // primary.50相当
  itemBgSelected: 'oklch(0.95 0.05 150)',   // primary.100相当
  itemTextSelected: 'oklch(0.40 0.15 160)', // primary.800相当
}
```

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 備考 |
|------|------|-------------|------|
| select_content | css | `src/components/elements/select/styles.ts` | padding変更 |
| select_item | css | `src/components/elements/select/styles.ts` | ホバー・選択状態変更 |
| select_itemIndicator | css | `src/components/elements/select/styles.ts` | 色変更 |

---

## 10. チェックリスト

要件定義完了確認:

- [x] ui-design-systemメモリを参照した
- [x] 改善対象を特定した
- [x] 色はOKLCH形式でhue 150のアンダートーンを使用
- [x] インタラクション（hover/selected/highlighted/disabled）を定義した
- [x] アクセシビリティ（コントラスト比）を確認した
- [x] テスト観点を整理した
- [ ] PROGRESS.mdを更新（次ステップ）

---

## 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Select.md
📊 PROGRESS.md: 要更新

次のフェーズ:
/gen-test Select
```
