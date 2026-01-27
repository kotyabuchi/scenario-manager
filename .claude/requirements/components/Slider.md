# Slider コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義（実装済みからの逆引き）
**Pencilデザイン**: docs/designs/scenarios.pen > Scenarios / 検索画面（詳細条件展開）

---

## 1. 概要

### 1.1 目的
範囲選択や単一値選択のためのスライダーコンポーネント。
検索条件（プレイ人数、プレイ時間）などで数値範囲を直感的に選択できるUIを提供する。

### 1.2 使用場所
- `src/app/(main)/scenarios/_components/SearchPanel.tsx`: プレイ人数・プレイ時間の検索条件
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Slider
- カスタマイズ: レイアウト構造の変更、範囲ラベル機能の追加

---

## 2. Props設計

### 2.1 必須Props

| Prop | 型 | 説明 |
|------|-----|------|
| なし | - | すべてのPropsはオプショナル（デフォルト値あり） |

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `value` | `number[]` | - | 現在の値（制御コンポーネント用） |
| `defaultValue` | `number[]` | `[min]` or `[min, max]` | デフォルト値 |
| `onValueChange` | `(details: SliderValueChangeDetails) => void` | - | 値変更時のコールバック |
| `min` | `number` | `0` | 最小値 |
| `max` | `number` | `100` | 最大値 |
| `step` | `number` | `1` | ステップ値 |
| `label` | `string` | - | ラベル（上部に表示） |
| `showValue` | `boolean` | `false` | 選択値を表示（下部中央） |
| `formatValue` | `(value: number) => string` | `String(v)` | 値のフォーマット関数 |
| `markers` | `SliderMarker[]` | - | トラック上のマーカー |
| `disabled` | `boolean` | `false` | 無効状態 |
| `name` | `string` | - | input要素のname属性 |
| `range` | `boolean` | `false` | 範囲スライダー（2つのサム） |
| `minLabel` | `string` | - | 最小値ラベル（トラック上部左側） |
| `maxLabel` | `string` | - | 最大値ラベル（トラック上部右側） |

### 2.3 型定義

```typescript
type SliderMarker = {
  value: number;
  label?: string;
};

type SliderProps = {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (details: SliderValueChangeDetails) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  markers?: SliderMarker[];
  disabled?: boolean;
  name?: string;
  range?: boolean;
  minLabel?: string;
  maxLabel?: string;
} & Omit<SliderRootProps, 'value' | 'onValueChange'>;
```

---

## 3. レイアウト構造

### 3.1 コンポーネント構造

```
SliderRoot
├── Label（オプション）
├── RangeLabels（オプション: minLabel/maxLabel指定時）
│     ├── minLabel（左寄せ）
│     └── maxLabel（右寄せ）
├── Control
│     └── Track
│           ├── Range（選択範囲の塗りつぶし）
│           └── Thumb（1つまたは2つ）
├── ValueContainer（オプション: showValue=true時）
│     └── 選択値表示（中央配置）
└── MarkerGroup（オプション: markers指定時）
      └── Marker（各マーカー）
```

### 3.2 レイアウト詳細

| 要素 | 配置 | 説明 |
|------|------|------|
| Label | 上部 | コンポーネントのラベル |
| RangeLabels | Labelの下 | 最小・最大の範囲テキスト（左右配置） |
| Control/Track | 中央 | スライダー本体 |
| ValueContainer | Trackの下 | 選択値表示（中央配置） |
| MarkerGroup | 最下部 | トラック位置のマーカー |

---

## 4. スタイル仕様

### 4.1 ルート（slider_root）

```typescript
{
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  w: 'full',
}
```

### 4.2 ラベル（slider_label）

```typescript
{
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151', // neutral.700相当
}
```

### 4.3 範囲ラベル（slider_rangeLabels / slider_rangeLabel）

```typescript
// コンテナ
{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

// 各ラベル
{
  fontSize: '12px',
  fontWeight: 'normal',
  color: '#6B7280', // neutral.600相当
}
```

### 4.4 コントロール（slider_control）

```typescript
{
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  h: '24px',
  cursor: 'pointer',
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
  },
}
```

### 4.5 トラック（slider_track）

```typescript
{
  position: 'relative',
  w: 'full',
  h: '6px',
  borderRadius: 'full',
  bg: 'slider.track', // グレー系
}
```

### 4.6 レンジ（slider_range）

```typescript
{
  position: 'absolute',
  h: 'full',
  borderRadius: 'full',
  bg: 'slider.fill', // primary.default相当
}
```

### 4.7 サム（slider_thumb）

```typescript
{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '20px',
  h: '20px',
  borderRadius: 'full',
  bg: 'slider.thumb', // white
  boxShadow: 'slider.thumb',
  cursor: 'grab',
  transition: 'transform {durations.fast} {easings.ease-out}',
  _hover: {
    transform: 'scale(1.1)',
  },
  _active: {
    cursor: 'grabbing',
    transform: 'scale(1.15)',
  },
  _focus: {
    outline: '2px solid',
    outlineColor: 'primary.default',
    outlineOffset: '-1px', // 内側にオフセット
  },
  _disabled: {
    cursor: 'not-allowed',
    _hover: {
      transform: 'none',
    },
  },
}
```

### 4.8 値表示コンテナ（slider_valueContainer）

```typescript
{
  display: 'flex',
  justifyContent: 'center',
}
```

### 4.9 値表示（slider_output）

```typescript
{
  fontSize: '13px',
  fontWeight: '500',
  color: '#10B981', // primary.default相当（緑）
}
```

---

## 5. インタラクション

### 5.1 状態

| 状態 | 見た目の変化 | 備考 |
|------|-------------|------|
| default | - | 通常状態 |
| hover（サム） | scale(1.1) | サムが少し大きくなる |
| active（サム） | scale(1.15), cursor: grabbing | ドラッグ中 |
| focus（サム） | フォーカスリング表示 | outlineOffset: -1px |
| disabled | opacity: 'disabled' | cursor: not-allowed |

### 5.2 キーボード操作（Ark UI標準）

| キー | 動作 |
|------|------|
| Tab | サムにフォーカス移動 |
| 左矢印 / 下矢印 | 値をstep分減少 |
| 右矢印 / 上矢印 | 値をstep分増加 |
| Home | 最小値に設定 |
| End | 最大値に設定 |
| PageUp | 大きくジャンプ（step×10程度） |
| PageDown | 大きくジャンプ（step×10程度） |

### 5.3 マウス操作

| 操作 | 動作 |
|------|------|
| サムをドラッグ | 値を変更 |
| トラッククリック | クリック位置に値を設定 |

### 5.4 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| サムのscale | {durations.fast} | {easings.ease-out} |

---

## 6. 値表示フォーマット

### 6.1 単一値スライダー

```
formatValue(value)
例: "50" または "4人"
```

### 6.2 範囲スライダー

```
formatValue(minValue) ～ formatValue(maxValue)
例: "2人 ～ 6人" または "3時間 ～ 8時間"
```

**注意**: 区切り文字は「～」（全角チルダ）を使用。

---

## 7. アクセシビリティ

### 7.1 ARIA属性（Ark UI標準）

```typescript
<div role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}>
```

### 7.2 コントラスト確認

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| ラベル（#374151） + 白背景 | 約8:1 | ✅ |
| 範囲ラベル（#6B7280） + 白背景 | 約5:1 | ✅ |
| 値表示（#10B981） + 白背景 | 約3.5:1 | ✅（大きいテキスト基準） |

### 7.3 フォーカス管理

- サムはフォーカス可能
- フォーカスリングは `outlineOffset: -1px` で内側に表示
- 範囲スライダーの場合、Tab/Shift+Tabで2つのサム間を移動

---

## 8. エラーケース・境界値

### 8.1 値の境界

| ケース | 挙動 |
|--------|------|
| value < min | minにクランプ |
| value > max | maxにクランプ |
| 範囲スライダーで min > max | 交差を許容しない（Ark UI標準） |

### 8.2 Props組み合わせ

| ケース | 挙動 |
|--------|------|
| minLabel のみ指定 | 左側のみ表示 |
| maxLabel のみ指定 | 右側のみ表示 |
| showValue=false | 値表示なし |
| range=false + value=[a,b] | 最初の値のみ使用 |

---

## 9. テスト観点

### 9.1 レンダリング

- [ ] 必須Propsなしで正しくレンダリングされる
- [ ] labelが指定された場合、ラベルが表示される
- [ ] minLabel/maxLabelが指定された場合、範囲ラベルが表示される
- [ ] showValue=trueの場合、値が表示される
- [ ] range=trueの場合、2つのサムが表示される
- [ ] markersが指定された場合、マーカーが表示される

### 9.2 値の変更

- [ ] サムをドラッグすると値が変更される
- [ ] onValueChangeが正しく呼ばれる
- [ ] stepに従った値の変更ができる
- [ ] min/maxの範囲内に値がクランプされる

### 9.3 フォーマット

- [ ] formatValueで値がフォーマットされる
- [ ] 範囲スライダーで「～」区切りで表示される

### 9.4 インタラクション

- [ ] hover時にサムが拡大する
- [ ] active時にサムがさらに拡大する
- [ ] focus時にフォーカスリングが表示される
- [ ] disabled時に操作できない

### 9.5 キーボード操作

- [ ] Tabでフォーカスできる
- [ ] 矢印キーで値を変更できる
- [ ] Home/Endで最小/最大値に設定できる

### 9.6 アクセシビリティ

- [ ] role="slider"が設定されている
- [ ] aria-valuemin/aria-valuemax/aria-valuenowが設定されている
- [ ] フォーカス可能

---

## 10. 実装ファイル

### 10.1 ファイル構成

```
src/components/elements/slider/
├── slider.tsx           # コンポーネント本体
├── styles.ts            # スタイル定義
├── slider.stories.tsx   # Storybook
├── slider.test.tsx      # テスト（未実装）
└── index.ts             # エクスポート
```

### 10.2 Storybookストーリー

| ストーリー名 | 説明 |
|-------------|------|
| Default | 基本的な単一値スライダー |
| Range | 範囲スライダー |
| PlaytimeSlider | プレイ時間（範囲ラベル付き） |
| PlayerCountSlider | プレイ人数（範囲ラベル付き） |
| WithMarkers | マーカー付き |
| CustomFormat | カスタムフォーマット |
| Disabled | 無効状態 |
| NoLabel | ラベルなし |
| RangeLabelsOnly | 範囲ラベルのみ |

---

## 11. 使用例

### 11.1 基本的な使用法

```tsx
<Slider
  value={[50]}
  onValueChange={(details) => setValue(details.value)}
  min={0}
  max={100}
  label="音量"
  showValue
/>
```

### 11.2 範囲スライダー

```tsx
<Slider
  value={[20, 80]}
  onValueChange={(details) => setRange(details.value)}
  range
  min={0}
  max={100}
/>
```

### 11.3 範囲テキスト付きスライダー（検索条件向け）

```tsx
<Slider
  label="プレイ人数"
  value={[2, 6]}
  onValueChange={(details) => setPlayerCount(details.value)}
  min={1}
  max={10}
  step={1}
  range
  showValue
  formatValue={(v) => `${v}人`}
  minLabel="1人"
  maxLabel="10人+"
/>
```

---

## 12. TDD対象一覧

| 対象 | 種別 | ファイルパス | 備考 |
|------|------|-------------|------|
| Slider | コンポーネント | `src/components/elements/slider/slider.tsx` | |
| slider_* | css | `src/components/elements/slider/styles.ts` | |
| SliderValueDisplay | 内部コンポーネント | `src/components/elements/slider/slider.tsx` | |

---

## 13. チェックリスト

要件定義完了確認:

- [x] Pencilデザインを確認した
- [x] ui-design-systemメモリを参照した
- [x] すべてのPropsを定義した
- [x] レイアウト構造を定義した
- [x] スタイル仕様を定義した
- [x] インタラクション（hover/focus/active/disabled）を定義した
- [x] キーボード操作を定義した
- [x] アクセシビリティ要件を定義した
- [x] エラーケース・境界値を定義した
- [x] テスト観点を整理した
- [x] Storybookストーリーを定義した
- [ ] PROGRESS.mdを更新（次ステップ）

---

## 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Slider.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Scenarios / 検索画面（詳細条件展開）
📖 Storybook: src/components/elements/slider/slider.stories.tsx

現在の状態:
- コンポーネント実装済み
- Storybook作成済み
- テストファイル未作成

次のフェーズ:
/gen-test Slider
```
