# Radio コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Radio/*

---

## 1. 概要

### 1.1 目的
排他的な単一選択を行うラジオボタンコンポーネント。
選択肢から1つだけ選ぶ場合に使用する。

### 1.2 使用場所
- フォームでの単一選択
- 設定画面
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI RadioGroup
- スタイリング: PandaCSS

---

## 2. Props設計

### 2.1 RadioGroup Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `string` | - | 選択された値 |
| `defaultValue` | `string` | - | デフォルト値 |
| `onValueChange` | `(details) => void` | - | 値変更時のコールバック |
| `disabled` | `boolean` | `false` | グループ全体の無効状態 |
| `name` | `string` | - | フォーム用name属性 |
| `children` | `React.ReactNode` | - | Radio.Item要素 |

### 2.2 Radio.Item Props

| Prop | 型 | 説明 |
|------|-----|------|
| `value` | `string` | この項目の値 |
| `disabled` | `boolean` | この項目のみ無効 |
| `children` | `React.ReactNode` | ラベルテキスト |

### 2.3 型定義

```typescript
type RadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (details: { value: string }) => void;
  disabled?: boolean;
  name?: string;
  children: React.ReactNode;
};

type RadioItemProps = {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
};
```

---

## 3. Pencilデザイン詳細

### 3.1 Radio/Unchecked (EqdoR)
```
サークル:
  fill: #FFFFFF
  cornerRadius: 10px（円形）
  width: 20px
  height: 20px
  shadow: 0 1px blur:2px #00000015

ラベル:
  text: "Option", #374151, 14px, fontWeight: normal
  gap: 8px
```

### 3.2 Radio/Checked (PIvw4)
```
外側サークル:
  fill: #10B981（緑）
  cornerRadius: 10px
  width: 20px
  height: 20px

内側サークル:
  fill: #FFFFFF
  cornerRadius: 4px
  width: 8px
  height: 8px
  位置: 中央（x:6, y:6）

ラベル:
  text: "Option", #374151, 14px, fontWeight: normal
```

### 3.3 Radio/Disabled (HxgpM)
```
サークル:
  fill: #E5E7EB
  cornerRadius: 10px
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

| 状態 | サークル | ラベル | 備考 |
|------|---------|--------|------|
| unchecked | 白背景、影 | 通常色 | 通常状態 |
| checked | 緑背景、白内側サークル | 通常色 | 選択済み |
| hover | 背景色変化 | - | cursor: pointer |
| focus | フォーカスリング | - | 2px offset |
| disabled | グレー背景 | グレー | opacity: 0.5 |

### 4.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | グループにフォーカス移動 |
| 上下矢印 | 選択肢を移動 |
| 左右矢印 | 選択肢を移動 |
| Space | 現在の項目を選択 |

### 4.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| 背景色変化 | 150ms | ease-out |
| 内側サークル表示 | 150ms | ease-out |

---

## 5. アクセシビリティ

### 5.1 ARIA属性

Ark UI RadioGroupが自動で設定:
- `role="radiogroup"`
- `role="radio"`
- `aria-checked`
- `aria-disabled`

---

## 6. テスト観点

### 6.1 レンダリング

- [ ] 未選択状態で正しく表示される
- [ ] 選択状態で正しく表示される
- [ ] ラベルが表示される
- [ ] disabled状態で正しく表示される

### 6.2 インタラクション

- [ ] クリックで選択切り替え
- [ ] onValueChangeが呼ばれる
- [ ] 排他的に1つだけ選択される
- [ ] disabled時はクリック無効

### 6.3 キーボード操作

- [ ] Tabでフォーカスできる
- [ ] 矢印キーで選択移動
- [ ] Spaceで選択

### 6.4 アクセシビリティ

- [ ] role="radiogroup"が設定される
- [ ] role="radio"が各項目に設定される
- [ ] aria-checked属性が正しく設定される

---

## 7. 実装ファイル

### 7.1 ファイル構成

```
src/components/elements/radio/
├── radio.tsx           # コンポーネント本体
├── styles.ts           # スタイル定義
├── radio.stories.tsx   # Storybook
├── radio.test.tsx      # テスト
└── index.ts            # エクスポート
```

---

## 8. 使用例

```tsx
<RadioGroup
  value={selectedOption}
  onValueChange={(details) => setSelectedOption(details.value)}
>
  <Radio value="option1">オプション1</Radio>
  <Radio value="option2">オプション2</Radio>
  <Radio value="option3" disabled>オプション3（無効）</Radio>
</RadioGroup>
```

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| RadioGroup | コンポーネント | `src/components/elements/radio/radio.tsx` | 未実装 |
| Radio | コンポーネント | `src/components/elements/radio/radio.tsx` | 未実装 |

---

## 10. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Radio.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > Radio/*

次のフェーズ:
/gen-test Radio
```
