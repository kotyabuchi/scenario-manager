# Checkbox コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Checkbox/*

---

## 1. 概要

### 1.1 目的
複数選択可能なチェックボックスコンポーネント。
フィルター条件、同意確認、設定項目などで使用する。

### 1.2 使用場所
- フォームでの複数選択
- 設定画面
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Checkbox
- スタイリング: PandaCSS

---

## 2. Props設計

### 2.1 必須Props

なし（すべてオプショナル）

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `checked` | `boolean` | `false` | チェック状態 |
| `defaultChecked` | `boolean` | `false` | デフォルトチェック状態 |
| `onCheckedChange` | `(details) => void` | - | チェック状態変更時のコールバック |
| `disabled` | `boolean` | `false` | 無効状態 |
| `children` | `React.ReactNode` | - | ラベルテキスト |
| `name` | `string` | - | フォーム用name属性 |
| `value` | `string` | - | フォーム用value属性 |

### 2.3 型定義

```typescript
type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (details: { checked: boolean }) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  name?: string;
  value?: string;
};
```

---

## 3. Pencilデザイン詳細

### 3.1 Checkbox/Unchecked (KbXFX)
```
ボックス:
  fill: #FFFFFF
  cornerRadius: 4px
  width: 20px
  height: 20px
  shadow: 0 1px blur:2px #00000015

ラベル:
  text: #374151, 14px, fontWeight: normal
  gap: 8px
```

### 3.2 Checkbox/Checked (5SRxl)
```
ボックス:
  fill: #10B981（緑）
  cornerRadius: 4px
  width: 20px
  height: 20px

チェックアイコン:
  check, 14px, #FFFFFF

ラベル:
  text: #374151, 14px, fontWeight: normal
```

### 3.3 Checkbox/Disabled (91IF1)
```
ボックス:
  fill: #E5E7EB
  cornerRadius: 4px
  width: 20px
  height: 20px

ラベル:
  text: #9CA3AF, 14px

全体:
  opacity: 0.5
```

---

## 4. インタラクション

### 4.1 状態

| 状態 | ボックス | ラベル | 備考 |
|------|---------|--------|------|
| unchecked | 白背景、影 | 通常色 | 通常状態 |
| checked | 緑背景、チェックマーク | 通常色 | チェック済み |
| hover | 背景色変化 | - | cursor: pointer |
| focus | フォーカスリング | - | 2px offset |
| disabled | グレー背景 | グレー | opacity: 0.5 |

### 4.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| Space | チェック切り替え |

### 4.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| 背景色変化 | 150ms | ease-out |
| チェックマーク表示 | 150ms | ease-out |

---

## 5. アクセシビリティ

### 5.1 ARIA属性

Ark UI Checkboxが自動で設定:
- `role="checkbox"`
- `aria-checked`
- `aria-disabled`

### 5.2 ラベルとの関連付け

```typescript
<Checkbox.Root>
  <Checkbox.Control />
  <Checkbox.Label>{children}</Checkbox.Label>
  <Checkbox.HiddenInput />
</Checkbox.Root>
```

---

## 6. テスト観点

### 6.1 レンダリング

- [ ] 未チェック状態で正しく表示される
- [ ] チェック状態で正しく表示される
- [ ] ラベルが表示される
- [ ] disabled状態で正しく表示される

### 6.2 インタラクション

- [ ] クリックでチェック切り替え
- [ ] onCheckedChangeが呼ばれる
- [ ] disabled時はクリック無効

### 6.3 キーボード操作

- [ ] Tabでフォーカスできる
- [ ] Spaceでチェック切り替え

### 6.4 アクセシビリティ

- [ ] role="checkbox"が設定される
- [ ] aria-checked属性が正しく設定される

---

## 7. 実装ファイル

### 7.1 ファイル構成

```
src/components/elements/checkbox/
├── checkbox.tsx           # コンポーネント本体
├── styles.ts              # スタイル定義
├── checkbox.stories.tsx   # Storybook
├── checkbox.test.tsx      # テスト
└── index.ts               # エクスポート
```

---

## 8. 使用例

```tsx
<Checkbox
  checked={isAgreed}
  onCheckedChange={(details) => setIsAgreed(details.checked)}
>
  利用規約に同意する
</Checkbox>
```

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Checkbox | コンポーネント | `src/components/elements/checkbox/checkbox.tsx` | 未実装 |

---

## 10. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Checkbox.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > Checkbox/*

次のフェーズ:
/gen-test Checkbox
```
