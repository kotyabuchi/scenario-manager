# Switch コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Switch/*

---

## 1. 概要

### 1.1 目的
オン/オフを切り替えるトグルスイッチコンポーネント。
設定項目のオン/オフ、機能の有効/無効などに使用する。

### 1.2 使用場所
- 設定画面
- フィルター条件
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Switch
- スタイリング: PandaCSS

---

## 2. Props設計

### 2.1 必須Props

なし（すべてオプショナル）

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `checked` | `boolean` | `false` | オン状態 |
| `defaultChecked` | `boolean` | `false` | デフォルトオン状態 |
| `onCheckedChange` | `(details) => void` | - | 状態変更時のコールバック |
| `disabled` | `boolean` | `false` | 無効状態 |
| `children` | `React.ReactNode` | - | ラベルテキスト |
| `name` | `string` | - | フォーム用name属性 |

### 2.3 型定義

```typescript
type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (details: { checked: boolean }) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  name?: string;
};
```

---

## 3. Pencilデザイン詳細

### 3.1 Switch/Off (AiM46)
```
トラック:
  fill: #E5E7EB（グレー）
  cornerRadius: 12px
  width: 44px
  height: 24px

サム（つまみ）:
  fill: #FFFFFF
  cornerRadius: 10px（円形）
  width: 20px
  height: 20px
  位置: x:2, y:2（左寄せ）
  shadow: 0 1px blur:2px #00000020

ラベル:
  text: "Label", #374151, 14px, fontWeight: normal
  gap: 8px
```

### 3.2 Switch/On (vB4VH)
```
トラック:
  fill: #10B981（緑）
  cornerRadius: 12px
  width: 44px
  height: 24px

サム（つまみ）:
  fill: #FFFFFF
  cornerRadius: 10px
  width: 20px
  height: 20px
  位置: x:22, y:2（右寄せ）
  shadow: 0 1px blur:2px #00000020

ラベル:
  text: "Label", #374151, 14px, fontWeight: normal
```

### 3.3 Switch/Disabled (i1s84)
```
トラック:
  fill: #E5E7EB

サム:
  fill: #FFFFFF
  位置: x:2, y:2（Off状態と同じ）
  影なし

ラベル:
  text: #9CA3AF, 14px

全体:
  opacity: 'disabled'
```

---

## 4. インタラクション

### 4.1 状態

| 状態 | トラック | サム位置 | 備考 |
|------|---------|----------|------|
| off | グレー | 左 | 通常状態 |
| on | 緑 | 右 | オン状態 |
| hover | 背景色変化 | - | cursor: pointer |
| focus | フォーカスリング | - | 2px offset |
| disabled | グレー | 左 | opacity: 'disabled' |

### 4.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| Space | オン/オフ切り替え |
| Enter | オン/オフ切り替え |

### 4.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| トラック背景色 | {durations.fast} | {easings.ease-out} |
| サム位置 | {durations.fast} | {easings.ease-out} |

---

## 5. アクセシビリティ

### 5.1 ARIA属性

Ark UI Switchが自動で設定:
- `role="switch"`
- `aria-checked`
- `aria-disabled`

---

## 6. テスト観点

### 6.1 レンダリング

- [ ] オフ状態で正しく表示される
- [ ] オン状態で正しく表示される
- [ ] ラベルが表示される
- [ ] disabled状態で正しく表示される

### 6.2 インタラクション

- [ ] クリックでオン/オフ切り替え
- [ ] onCheckedChangeが呼ばれる
- [ ] disabled時はクリック無効

### 6.3 キーボード操作

- [ ] Tabでフォーカスできる
- [ ] Spaceで切り替え
- [ ] Enterで切り替え

### 6.4 アクセシビリティ

- [ ] role="switch"が設定される
- [ ] aria-checked属性が正しく設定される

---

## 7. 実装ファイル

### 7.1 ファイル構成

```
src/components/elements/switch/
├── switch.tsx           # コンポーネント本体
├── styles.ts            # スタイル定義
├── switch.stories.tsx   # Storybook
├── switch.test.tsx      # テスト
└── index.ts             # エクスポート
```

---

## 8. 使用例

```tsx
<Switch
  checked={isEnabled}
  onCheckedChange={(details) => setIsEnabled(details.checked)}
>
  通知を有効にする
</Switch>
```

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Switch | コンポーネント | `src/components/elements/switch/switch.tsx` | 未実装 |

---

## 10. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Switch.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > Switch/*

次のフェーズ:
/gen-test Switch
```
