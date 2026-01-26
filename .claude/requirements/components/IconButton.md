# IconButton コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義（実装済みからの逆引き）
**Pencilデザイン**: docs/designs/scenarios.pen > Components > IconButton/*

---

## 1. 概要

### 1.1 目的
アイコンのみを表示するボタンコンポーネント。
お気に入りボタン、メニューボタン、閉じるボタンなど、コンパクトなアクションに使用する。

### 1.2 使用場所
- カード上のお気に入りボタン
- ドロップダウンメニューのトリガー
- モーダルの閉じるボタン
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: `@ark-ui/react/factory` の `ark.button`
- スタイリング: PandaCSS Recipe（Buttonと共有）
- カスタマイズ: px:0でアイコン専用に

---

## 2. Props設計

### 2.1 必須Props

| Prop | 型 | 説明 |
|------|-----|------|
| `children` | `React.ReactNode` | アイコン要素 |
| `aria-label` | `string` | アクセシブルな名前（必須） |

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | `"solid" \| "subtle" \| "ghost" \| "outline"` | `"solid"` | スタイルバリアント |
| `status` | `"primary" \| "danger"` | `"primary"` | カラーステータス |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | サイズ |
| `disabled` | `boolean` | `false` | 無効状態 |
| `loading` | `boolean` | `false` | ローディング状態 |
| `loadingText` | `string` | `"Loading..."` | ローディング中のaria-label |
| `onClick` | `() => void` | - | クリック時のコールバック |

### 2.3 型定義

```typescript
type IconButtonProps = {
  children: React.ReactNode;
  'aria-label': string;
  variant?: 'solid' | 'subtle' | 'ghost' | 'outline';
  status?: 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  onClick?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>;
```

---

## 3. Variants

### 3.1 Pencilデザインとの対応

| Pencilコンポーネント | variant | status | 見た目 |
|---------------------|---------|--------|--------|
| IconButton/Circle | - | - | 半透明黒背景（オーバーレイ用） |
| IconButton/Active | solid | primary | 緑背景 |
| IconButton/Ghost | ghost | primary | 背景なし |
| IconButton/Disabled | - | - | グレー背景、透明度50% |

**注意**: Pencilの`IconButton/Circle`は特殊なオーバーレイ用途。
実装では以下のバリアントで対応:

| 用途 | 推奨設定 |
|------|---------|
| オーバーレイ上のアクション | カスタムスタイル（bg: rgba(0,0,0,0.4)） |
| アクティブ状態 | variant="solid" status="primary" |
| 通常のアイコンボタン | variant="ghost" |

### 3.2 size

| 値 | サイズ | アイコンサイズ | Pencilコンポーネント |
|-----|------|--------------|---------------------|
| `sm` | 28px | 16px | IconButton/Circle, Active, Disabled |
| `md` | 32px | 18px | IconButton/Ghost |
| `lg` | 44px | 20px | - |

---

## 4. Pencilデザイン詳細

### 4.1 IconButton/Circle (is41G)
```
fill: #00000040（黒40%透明度）
cornerRadius: 14px（円形）
width: 28px
height: 28px
icon: bookmark, 16px, #FFFFFF
```
**用途**: カードのサムネイル上などオーバーレイ配置

### 4.2 IconButton/Active (AKvTH)
```
fill: #10B981（緑）
cornerRadius: 14px（円形）
width: 28px
height: 28px
icon: bookmark, 16px, #FFFFFF
```
**用途**: お気に入り済み等のアクティブ状態

### 4.3 IconButton/Ghost (8iCPC)
```
fill: transparent
cornerRadius: 6px
width: 32px
height: 32px
icon: more-vertical, 18px, #6B7280
```
**用途**: メニューボタン、ツールバーアクション

### 4.4 IconButton/Disabled (NABOb)
```
fill: #E5E7EB
cornerRadius: 14px
width: 28px
height: 28px
opacity: 0.5
icon: bookmark, 16px, #9CA3AF
```

---

## 5. インタラクション

### 5.1 状態

| 状態 | 見た目の変化 | 備考 |
|------|-------------|------|
| default | - | 通常状態 |
| hover | 背景色が少し変化 | cursor: pointer |
| focus | フォーカスリング表示 | 2px offset |
| active | variant=solidでscale(0.95) | |
| disabled | opacity: 0.5 | cursor: not-allowed |
| loading | スピナー表示 | アイコンと置換 |

### 5.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| Enter | クリック発火 |
| Space | クリック発火 |

### 5.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| 背景色変化 | 150ms | ease-out |
| scale | 100ms | ease-out |

---

## 6. アクセシビリティ

### 6.1 ARIA属性

```typescript
<button
  type="button"
  aria-label={loading ? loadingText : ariaLabel}
  disabled={disabled || loading}
>
  {loading ? <Spinner /> : <Icon />}
</button>
```

**重要**: `aria-label`は必須。アイコンのみのボタンはテキストがないため、
スクリーンリーダー向けにアクセシブルな名前を提供する必要がある。

### 6.2 aria-labelの例

| アイコン | aria-label |
|---------|-----------|
| bookmark | "お気に入りに追加" / "お気に入りから削除" |
| more-vertical | "メニューを開く" |
| x | "閉じる" |
| trash-2 | "削除" |
| edit | "編集" |

### 6.3 フォーカス管理

- すべてのIconButtonはフォーカス可能
- フォーカスリング: 2px solid primary.default, offset 2px
- disabled/loading時はフォーカス不可

---

## 7. エラーケース・境界値

### 7.1 children

| ケース | 挙動 |
|--------|------|
| SVGアイコン | 通常表示、サイズは1emで親に依存 |
| 複数要素 | すべて表示（非推奨） |
| テキスト | 表示されるが非推奨 |

### 7.2 aria-label

| ケース | 挙動 |
|--------|------|
| 未指定 | TypeScriptエラー（必須） |
| 空文字 | アクセシビリティ違反（警告） |

### 7.3 状態の組み合わせ

| ケース | 挙動 |
|--------|------|
| disabled + loading | disabledとして扱う |
| loading時 | aria-labelがloadingTextに変更 |

---

## 8. テスト観点

### 8.1 レンダリング

- [ ] 必須Propsで正しくレンダリングされる
- [ ] アイコンが表示される
- [ ] variant="solid"が正しく表示される
- [ ] variant="ghost"が正しく表示される
- [ ] size="sm"が正しいサイズで表示される
- [ ] size="md"が正しいサイズで表示される

### 8.2 インタラクション

- [ ] クリック時にonClickが呼ばれる
- [ ] disabled時はonClickが呼ばれない
- [ ] loading時はonClickが呼ばれない
- [ ] Enterキーでクリックできる
- [ ] Spaceキーでクリックできる

### 8.3 ローディング状態

- [ ] loading=trueでスピナーが表示される
- [ ] loading時にアイコンが非表示になる
- [ ] loading時にaria-labelが変更される

### 8.4 アクセシビリティ

- [ ] aria-label属性が設定される
- [ ] disabled時にdisabled属性が設定される
- [ ] フォーカス可能
- [ ] フォーカスリングが表示される

---

## 9. 実装ファイル

### 9.1 ファイル構成

```
src/components/elements/icon-button/
├── icon-button.tsx           # コンポーネント本体
├── icon-button.stories.tsx   # Storybook
├── icon-button.test.tsx      # テスト（未実装）
└── index.ts                  # エクスポート
```

### 9.2 Storybookストーリー

| ストーリー名 | 説明 |
|-------------|------|
| Default | 基本的なアイコンボタン |
| Variants | 全variantのバリエーション |
| Sizes | サイズ比較 |
| Bookmark | お気に入りボタン（通常/アクティブ） |
| Menu | メニューボタン |
| Loading | ローディング状態 |
| Disabled | 無効状態 |
| OnOverlay | オーバーレイ上での使用例 |

---

## 10. 使用例

### 10.1 基本的な使用法

```tsx
import { MoreVertical } from 'lucide-react';

<IconButton
  variant="ghost"
  aria-label="メニューを開く"
  onClick={handleOpenMenu}
>
  <MoreVertical />
</IconButton>
```

### 10.2 お気に入りボタン

```tsx
import { Bookmark } from 'lucide-react';

<IconButton
  variant={isFavorite ? 'solid' : 'ghost'}
  status="primary"
  size="sm"
  aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
  onClick={handleToggleFavorite}
>
  <Bookmark />
</IconButton>
```

### 10.3 オーバーレイ上での使用

```tsx
import { Bookmark } from 'lucide-react';
import { css } from '@/styled-system/css';

const overlayButtonStyle = css({
  bg: 'rgba(0, 0, 0, 0.4)',
  borderRadius: '50%',
  _hover: { bg: 'rgba(0, 0, 0, 0.6)' },
});

<IconButton
  className={overlayButtonStyle}
  size="sm"
  aria-label="お気に入りに追加"
>
  <Bookmark color="white" />
</IconButton>
```

### 10.4 削除ボタン

```tsx
import { Trash2 } from 'lucide-react';

<IconButton
  variant="ghost"
  status="danger"
  aria-label="削除"
  onClick={handleDelete}
>
  <Trash2 />
</IconButton>
```

---

## 11. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| IconButton | コンポーネント | `src/components/elements/icon-button/icon-button.tsx` | 実装済み |

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

---

## 13. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/IconButton.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > IconButton/*
📖 Storybook: src/components/elements/icon-button/icon-button.stories.tsx

現在の状態:
- コンポーネント実装済み
- Storybook作成済み
- テスト未実装

次のフェーズ:
/gen-test IconButton
```
