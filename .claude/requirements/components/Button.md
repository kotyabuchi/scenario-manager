# Button コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義（実装済みからの逆引き）
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Button/*

---

## 1. 概要

### 1.1 目的
アプリケーション全体で使用する汎用的なボタンコンポーネント。
ユーザーアクションのトリガーとして、フォーム送信、モーダル表示、ナビゲーション等に使用する。

### 1.2 使用場所
- アプリケーション全体で使用
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: `@ark-ui/react/factory` の `ark.button`
- スタイリング: PandaCSS Recipe (`src/styles/recipes/button.ts`)
- カスタマイズ: loading状態の追加

---

## 2. Props設計

### 2.1 必須Props

| Prop | 型 | 説明 |
|------|-----|------|
| `children` | `React.ReactNode` | ボタンのラベル（テキストまたはアイコン） |

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | `"solid" \| "subtle" \| "ghost" \| "outline"` | `"solid"` | スタイルバリアント |
| `status` | `"primary" \| "danger"` | `"primary"` | カラーステータス |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | サイズ |
| `disabled` | `boolean` | `false` | 無効状態 |
| `loading` | `boolean` | `false` | ローディング状態 |
| `loadingText` | `string` | - | ローディング中に表示するテキスト |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | ボタンタイプ |
| `onClick` | `() => void` | - | クリック時のコールバック |

### 2.3 型定義

```typescript
type ButtonProps = {
  children: React.ReactNode;
  variant?: 'solid' | 'subtle' | 'ghost' | 'outline';
  status?: 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;
```

---

## 3. Variants

### 3.1 variant（スタイルバリアント）

| 値 | 用途 | Pencilコンポーネント | 見た目 |
|-----|------|---------------------|--------|
| `solid` | 主要なアクション | Button/Primary | 塗りつぶし背景、影付き |
| `subtle` | 控えめなアクション | Button/Subtle | 薄い背景色 |
| `ghost` | 最小限のアクション | Button/Ghost | 背景なし、テキストのみ |
| `outline` | 補助的なアクション | Button/Secondary | 白背景、軽い影 |

### 3.2 status（カラーステータス）

| 値 | 用途 | Pencilコンポーネント | 見た目 |
|-----|------|---------------------|--------|
| `primary` | 標準アクション | Button/Primary | 緑系 (#10B981) |
| `danger` | 破壊的アクション | Button/Destructive | 赤系 (#EF4444) |

### 3.3 size

| 値 | 高さ | フォントサイズ | パディング | 角丸 | Pencilコンポーネント |
|-----|------|--------------|-----------|------|---------------------|
| `sm` | 32px | 13px | 0 16px | 16px | Button/Ghost |
| `md` | 44px | 14px | 0 20px | 8px | Button/Primary, Secondary等 |
| `lg` | 48px | 14px | 0 24px | 8px | - |

---

## 4. Pencilデザイン詳細

### 4.1 Button/Primary (zgKWk)
```
fill: #10B981（緑）
text: #FFFFFF, 14px, fontWeight: 600
shadow: 0 2px blur:4px #10B98140
cornerRadius: 8px
height: 44px
padding: 0 20px
gap: 8px（アイコンとテキスト間）
```

### 4.2 Button/Secondary (DMevQ)
```
fill: #FFFFFF
text: #374151, 14px, fontWeight: 500
shadow: 0 1px blur:3px #0000001A
cornerRadius: 8px
height: 44px
padding: 0 20px
gap: 8px
icon: #6B7280
```

### 4.3 Button/Ghost (k4f0c)
```
fill: transparent
text: #9CA3AF, 13px, fontWeight: normal
cornerRadius: 16px
height: 32px
padding: 0 16px
gap: 6px
```

### 4.4 Button/Subtle (2Vd2c)
```
fill: #F3F4F6
text: #374151, 14px, fontWeight: 500
cornerRadius: 8px
height: 44px
padding: 0 20px
gap: 8px
```

### 4.5 Button/Destructive (nKfQf)
```
fill: #EF4444（赤）
text: #FFFFFF, 14px, fontWeight: 600
shadow: 0 2px blur:4px #EF444440
cornerRadius: 8px
height: 44px
padding: 0 20px
gap: 8px
icon: trash-2
```

### 4.6 Button/Disabled (EIQyS)
```
fill: #E5E7EB
text: #9CA3AF, 14px, fontWeight: 500
cornerRadius: 8px
height: 44px
padding: 0 20px
opacity: 0.6
icon: lock
```

---

## 5. インタラクション

### 5.1 状態

| 状態 | 見た目の変化 | 備考 |
|------|-------------|------|
| default | - | 通常状態 |
| hover | 背景色が少し変化 | cursor: pointer |
| focus | フォーカスリング表示 | 2px offset、primary.default色 |
| active | - | デフォルトのブラウザ挙動 |
| disabled | opacity: 0.6, bg: #E5E7EB | cursor: not-allowed |
| loading | スピナー表示 | クリック無効 |

### 5.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| Enter | クリック発火 |
| Space | クリック発火 |

### 5.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| 背景色・ボーダー・色・影・透明度 | 150ms | ease-out |

---

## 6. アクセシビリティ

### 6.1 ARIA属性

```typescript
<button
  type="button"
  disabled={disabled || loading}
  aria-busy={loading}
>
```

### 6.2 コントラスト確認

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| Primary背景(#10B981) + 白文字 | 約3.5:1 | ✅（大きいテキスト基準） |
| Destructive背景(#EF4444) + 白文字 | 約3.5:1 | ✅（大きいテキスト基準） |
| Subtle背景(#F3F4F6) + テキスト(#374151) | 約8:1 | ✅ |
| Ghost テキスト(#9CA3AF) + 白背景 | 約2.8:1 | ⚠️（補助テキスト用途） |

### 6.3 フォーカス管理

- すべてのボタンはフォーカス可能
- フォーカスリング: 2px solid primary.default, offset 2px
- disabled時はフォーカス不可

---

## 7. エラーケース・境界値

### 7.1 children

| ケース | 挙動 |
|--------|------|
| テキストのみ | 通常表示 |
| アイコンのみ | gap無しで中央配置、aria-labelが必要 |
| アイコン + テキスト | gap: 8pxで配置 |
| 長いテキスト | 1行でwhiteSpace: nowrap |

### 7.2 状態の組み合わせ

| ケース | 挙動 |
|--------|------|
| disabled + loading | disabledとして扱う（loading状態にはならない） |
| loading時のクリック | 無視される（disabled状態と同等） |

### 7.3 SVGアイコン

- アイコンサイズ: 1em（親のフォントサイズに依存）
- `& :where(svg) { width: 1em; height: 1em; }` で制御

---

## 8. テスト観点

### 8.1 レンダリング

- [ ] 必須Propsのみで正しくレンダリングされる
- [ ] variant="solid"が正しく表示される
- [ ] variant="subtle"が正しく表示される
- [ ] variant="ghost"が正しく表示される
- [ ] variant="outline"が正しく表示される
- [ ] status="primary"が正しく表示される
- [ ] status="danger"が正しく表示される
- [ ] size="sm"が正しいサイズで表示される
- [ ] size="md"が正しいサイズで表示される
- [ ] size="lg"が正しいサイズで表示される

### 8.2 インタラクション

- [ ] クリック時にonClickが呼ばれる
- [ ] disabled時はonClickが呼ばれない
- [ ] loading時はonClickが呼ばれない
- [ ] Enterキーでクリックできる
- [ ] Spaceキーでクリックできる

### 8.3 ローディング状態

- [ ] loading=trueでスピナーが表示される
- [ ] loadingTextが指定されていればテキストが切り替わる
- [ ] loadingTextが未指定なら元のchildrenが表示される

### 8.4 アクセシビリティ

- [ ] role="button"が設定されている
- [ ] disabled時にdisabled属性が設定される
- [ ] loading時にaria-busy="true"（現状未実装）
- [ ] フォーカス可能
- [ ] フォーカスリングが表示される

### 8.5 エラーケース

- [ ] childrenが空でもクラッシュしない

---

## 9. 実装ファイル

### 9.1 ファイル構成

```
src/components/elements/button/
├── button.tsx           # コンポーネント本体
├── button.stories.tsx   # Storybook
├── button.test.tsx      # テスト
└── index.ts             # エクスポート

src/styles/recipes/
└── button.ts            # PandaCSS Recipe
```

### 9.2 Storybookストーリー

| ストーリー名 | 説明 |
|-------------|------|
| Default | 基本的なボタン（全Props操作可能） |
| Variants | 全variantのバリエーション |
| Sizes | 全sizeのバリエーション |
| Status | primary/dangerの比較 |
| Loading | ローディング状態 |
| Disabled | 無効状態 |
| WithIcon | アイコン付きボタン |

---

## 10. 使用例

### 10.1 基本的な使用法

```tsx
<Button onClick={handleClick}>送信</Button>
```

### 10.2 バリエーション

```tsx
// Primary (デフォルト)
<Button variant="solid" status="primary">保存</Button>

// Secondary
<Button variant="outline" status="primary">キャンセル</Button>

// 破壊的アクション
<Button variant="solid" status="danger">削除</Button>

// 控えめなアクション
<Button variant="subtle" status="primary">詳細を見る</Button>

// 最小限のアクション
<Button variant="ghost" status="primary">もっと見る</Button>
```

### 10.3 サイズ

```tsx
<Button size="sm">小</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>
```

### 10.4 ローディング

```tsx
<Button loading loadingText="保存中...">保存</Button>
```

### 10.5 アイコン付き

```tsx
import { Search, Trash2 } from 'lucide-react';

<Button variant="solid" status="primary">
  <Search />
  検索
</Button>

<Button variant="solid" status="danger">
  <Trash2 />
  削除
</Button>
```

---

## 11. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Button | コンポーネント | `src/components/elements/button/button.tsx` | 実装済み |
| button | recipe | `src/styles/recipes/button.ts` | 実装済み |

---

## 12. チェックリスト

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
- [ ] Storybookストーリーを拡充（次ステップ）
- [ ] テストケースを拡充（次ステップ）

---

## 13. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/Button.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > Button/*
📖 Storybook: src/components/elements/button/button.stories.tsx

現在の状態:
- コンポーネント実装済み
- Storybook基本ストーリーあり
- テスト基本ケースあり

次のフェーズ:
/gen-test Button（テストケースを拡充）
```
