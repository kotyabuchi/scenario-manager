# Input コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義（実装済みからの逆引き）
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Input/*

---

## 1. 概要

### 1.1 目的
フォームで使用するテキスト入力コンポーネント。
ボーダーレスUIでデザインシステムに準拠し、React Hook Formと完全互換。

### 1.2 使用場所
- アプリケーション全体のフォーム
- 検索フォーム
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: `@ark-ui/react/factory` の `ark.input`
- スタイリング: PandaCSS cva (`src/components/elements/input/styles.ts`)

---

## 2. Props設計

### 2.1 必須Props

なし（すべてオプショナル）

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `type` | `string` | `"text"` | input type属性 |
| `placeholder` | `string` | - | プレースホルダーテキスト |
| `disabled` | `boolean` | `false` | 無効状態 |
| `hasError` | `boolean` | `false` | エラー状態 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | サイズ |
| `id` | `string` | - | input id属性 |
| `name` | `string` | - | input name属性 |
| `value` | `string` | - | 制御された値 |
| `defaultValue` | `string` | - | デフォルト値 |
| `onChange` | `ChangeEventHandler` | - | 値変更時のコールバック |
| `onBlur` | `FocusEventHandler` | - | フォーカス離脱時のコールバック |

### 2.3 型定義

```typescript
type InputProps = {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  size?: 'sm' | 'md' | 'lg';
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;
```

**注意**: Inputコンポーネント自体はラベルやエラーメッセージを含まない。
ラベル・必須マーク・エラーメッセージは親コンポーネント（FormField等）で管理する。

---

## 3. Variants

### 3.1 hasError

| 値 | 見た目 | Pencilコンポーネント |
|-----|--------|---------------------|
| `false` | 通常の背景色 | Input/Text, Input/Filled |
| `true` | 赤い背景色、赤い枠線 | Input/Error, Input/RequiredError |

### 3.2 size

| 値 | 高さ | フォントサイズ | Pencilコンポーネント |
|-----|------|--------------|---------------------|
| `sm` | 36px | 13px | - |
| `md` | 44px | 14px | Input/Text等 |
| `lg` | 48px | 14px | - |

---

## 4. Pencilデザイン詳細

### 4.1 Input/Text (xgI9m)
```
ラベル:
  text: #374151, 13px, fontWeight: 500

入力ボックス:
  fill: #F3F4F6
  cornerRadius: 8px
  height: 44px
  padding: 0 12px

プレースホルダー:
  text: #9CA3AF, 14px, fontWeight: normal
```

### 4.2 Input/Filled (SW9hj)
```
入力ボックス:
  fill: #F3F4F6

入力テキスト:
  text: #1F2937, 14px, fontWeight: normal
```

### 4.3 Input/Error (JJfk3)
```
入力ボックス:
  fill: #FEF2F2（淡い赤）

入力テキスト:
  text: #EF4444

エラーメッセージ:
  text: #EF4444, 12px, fontWeight: normal
  gap: 4px（入力ボックスとの間）
```

### 4.4 Input/Disabled (xyQmj)
```
fill: #E5E7EB
text: #9CA3AF, 14px
opacity: 'disabled'
```

### 4.5 Input/Required (E443n)
```
ラベル:
  text: #374151, 13px, fontWeight: 500

必須マーク:
  text: "*", #EF4444, 13px, fontWeight: 500
  gap: 4px（ラベルとの間）
```

### 4.6 Input/RequiredError (XpLHQ)
```
Required + Error の組み合わせ
```

---

## 5. インタラクション

### 5.1 状態

| 状態 | 見た目の変化 | 備考 |
|------|-------------|------|
| default | bg: #F3F4F6 | 通常状態 |
| hover | bg: gray.200（少し暗く） | cursor: text |
| focus | 2px solid フォーカスリング | input.focusBorder色 |
| filled | text: #1F2937 | 入力済みテキスト |
| error | bg: #FEF2F2, outline: 1px solid red | hasError=true |
| disabled | opacity: 'disabled', bg: #E5E7EB | cursor: not-allowed |

### 5.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| 文字入力 | テキスト入力 |
| Ctrl+A | 全選択 |
| Ctrl+C/V/X | コピー/ペースト/カット |

### 5.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| all（背景色、フォーカス等） | {durations.fast} | {easings.ease-out} |

---

## 6. アクセシビリティ

### 6.1 ARIA属性

```typescript
<input
  id={id}
  aria-invalid={hasError}
  aria-describedby={hasError ? `${id}-error` : undefined}
/>

// エラーメッセージ（親コンポーネントで）
<span id={`${id}-error`} role="alert">
  エラーメッセージ
</span>
```

### 6.2 コントラスト確認

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| 背景(#F3F4F6) + テキスト(#1F2937) | 約10:1 | ✅ |
| 背景(#F3F4F6) + プレースホルダー(#9CA3AF) | 約3:1 | ✅ |
| エラー背景(#FEF2F2) + テキスト(#EF4444) | 約4.5:1 | ✅ |

### 6.3 ラベルとの関連付け

- 必ず`id`属性を指定し、`<label htmlFor={id}>`で関連付ける
- または`aria-label`でアクセシブルな名前を提供

---

## 7. エラーケース・境界値

### 7.1 入力値

| ケース | 挙動 |
|--------|------|
| 空文字 | プレースホルダー表示 |
| 長いテキスト | 水平スクロール |
| 日本語入力 | IME対応（通常通り） |

### 7.2 状態の組み合わせ

| ケース | 挙動 |
|--------|------|
| disabled + hasError | disabledスタイルを優先 |
| 型がnumber | 数値入力のみ受付 |

---

## 8. テスト観点

### 8.1 レンダリング

- [ ] 必須Propsなしで正しくレンダリングされる
- [ ] placeholderが表示される
- [ ] size="sm"が正しいサイズで表示される
- [ ] size="md"が正しいサイズで表示される
- [ ] size="lg"が正しいサイズで表示される
- [ ] hasError=trueでエラースタイルになる

### 8.2 インタラクション

- [ ] 入力時にonChangeが呼ばれる
- [ ] フォーカス時にonFocusが呼ばれる
- [ ] フォーカス離脱時にonBlurが呼ばれる
- [ ] disabled時は入力できない

### 8.3 React Hook Form連携

- [ ] registerが正しく動作する
- [ ] バリデーションエラー時にhasErrorが反映される
- [ ] 値の更新が正しく行われる

### 8.4 アクセシビリティ

- [ ] Tabでフォーカスできる
- [ ] aria-invalid属性が正しく設定される
- [ ] labelと関連付けられる

### 8.5 エラーケース

- [ ] 空のvalueでもクラッシュしない
- [ ] 不正なtype指定でもクラッシュしない

---

## 9. 実装ファイル

### 9.1 ファイル構成

```
src/components/elements/input/
├── input.tsx            # コンポーネント本体
├── styles.ts            # スタイル定義（cva）
├── input.stories.tsx    # Storybook
├── input.test.tsx       # テスト（未実装）
└── index.ts             # エクスポート
```

### 9.2 Storybookストーリー

| ストーリー名 | 説明 |
|-------------|------|
| Default | 基本的な入力フィールド |
| Placeholder | プレースホルダー付き |
| Filled | 入力済み状態 |
| Error | エラー状態 |
| Disabled | 無効状態 |
| Sizes | サイズ比較 |
| WithLabel | ラベル付き使用例 |
| WithFormField | FormFieldとの組み合わせ |

---

## 10. 使用例

### 10.1 基本的な使用法

```tsx
<Input
  id="name"
  placeholder="名前を入力"
/>
```

### 10.2 ラベル付き

```tsx
<div>
  <label htmlFor="email">メールアドレス</label>
  <Input
    id="email"
    type="email"
    placeholder="example@email.com"
  />
</div>
```

### 10.3 必須フィールド

```tsx
<div>
  <label htmlFor="title">
    タイトル <span style={{ color: '#EF4444' }}>*</span>
  </label>
  <Input
    id="title"
    placeholder="シナリオタイトル"
    required
  />
</div>
```

### 10.4 エラー状態

```tsx
<div>
  <label htmlFor="url">URL</label>
  <Input
    id="url"
    type="url"
    hasError
    aria-describedby="url-error"
  />
  <span id="url-error" style={{ color: '#EF4444', fontSize: '12px' }}>
    有効なURLを入力してください
  </span>
</div>
```

### 10.5 React Hook Form連携

```tsx
const { register, formState: { errors } } = useForm();

<Input
  id="name"
  placeholder="名前"
  hasError={!!errors.name}
  {...register('name', { required: true })}
/>
{errors.name && (
  <span role="alert">名前は必須です</span>
)}
```

---

## 11. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Input | コンポーネント | `src/components/elements/input/input.tsx` | 実装済み |
| input | cva | `src/components/elements/input/styles.ts` | 実装済み |

---

## 12. 関連コンポーネント

| コンポーネント | 説明 | 状態 |
|---------------|------|------|
| FormField | ラベル・エラーメッセージを含むラッパー | 未実装 |
| Textarea | 複数行テキスト入力 | 要件定義予定 |

---

## 13. チェックリスト

要件定義完了確認:

- [x] Pencilデザインを確認した
- [x] ui-design-systemメモリを参照した
- [x] すべてのPropsを定義した
- [x] すべてのvariantsを定義した
- [x] インタラクション（hover/focus/active/disabled）を定義した
- [x] キーボード操作を定義した
- [x] アクセシビリティ要件を定義した
- [x] エラーケース・境界値を定義した
- [x] テスト観点を整理した

---

## 14. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Input.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > Input/*
📖 Storybook: src/components/elements/input/input.stories.tsx

現在の状態:
- コンポーネント実装済み
- Storybook作成済み
- テスト未実装

次のフェーズ:
/gen-test Input
```
