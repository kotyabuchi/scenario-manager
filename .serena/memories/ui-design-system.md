# UIデザインシステム

本プロジェクトのUIデザイン仕様。**UI実装時は必ずこのファイルを参照すること。**

テーマ: **nani.now風パステルグリーン** - ソフト、低彩度、緑のアンダートーン

---

## 1. カラーパレット（最重要）

すべての色は **OKLCH形式** で、**hue 150（緑）のアンダートーン** を持つ。

```typescript
// 背景グラデーション
bg: {
  from: 'oklch(0.98 0.02 150)', // 淡い緑
  to: 'oklch(0.98 0.02 180)',   // 淡い青緑
}

// プライマリ（緑系）
primary: {
  50:  'oklch(0.98 0.03 150)',  // 最も淡い
  100: 'oklch(0.95 0.05 150)',  // チップ選択時など
  200: 'oklch(0.90 0.08 150)',  // メインカラー
  500: 'oklch(0.65 0.15 160)',  // 中間（使用注意: コントラスト確認）
  800: 'oklch(0.40 0.15 160)',  // テキスト、アイコン
}

// アクセント
accent: {
  coral:  'oklch(0.85 0.10 15)',   // お気に入り、警告系
  purple: 'oklch(0.80 0.12 320)', // 補助アクセント
}

// ニュートラル（緑のアンダートーン入り）
neutral: {
  50:  'oklch(0.98 0.01 150)',  // 背景
  100: 'oklch(0.95 0.01 150)',  // divider
  600: 'oklch(0.45 0.05 150)',  // サブテキスト、空き状態
  700: 'oklch(0.40 0.05 150)',  // 通常テキスト
  800: 'oklch(0.35 0.05 150)',  // 強調テキスト
}
```

### 色の設計意図
- **明度**: 0.85-0.98（非常に明るい背景）、0.35-0.45（テキスト）
- **彩度**: 0.01-0.15（低彩度でソフト）
- **色相**: 150-180（緑〜青緑の範囲で統一）
- **純粋なグレーは使わない**: 必ず hue 150 のアンダートーンを入れる

---

## 2. 影・角丸・余白

### シャドウ（3段階のみ）

```typescript
shadows: {
  xs: '0 1px 3px rgba(0, 0, 0, 0.06)',   // カード通常、チップ
  sm: '0 4px 6px rgba(0, 0, 0, 0.08)',   // カードホバー、パネル
  md: '0 6px 12px rgba(0, 0, 0, 0.10)',  // ドロップダウン、モーダル
}
```

**ポイント**: 透明度は 0.06〜0.10 の範囲（従来より薄め）

### 角丸

| 用途 | サイズ |
|------|--------|
| カード、パネル、検索パネル | 16px |
| チップ、タグ、ボタン | 12px |
| 入力フィールド | 8px (md) |

### セクション間の余白

| 場所 | トークン |
|------|---------|
| 検索パネル → 結果ヘッダー | `mb: 'lg'` |
| 結果ヘッダー → カードリスト | `mb: 'lg'` |
| パネル内のセクション間 | divider の `my: 'lg'` |

---

## 3. ページ統一ルール

### 空き状態（0件表示）

```typescript
// アイコン: fontSize トークンを使用（w/h ではない）
export const emptyStateIcon = css({
  fontSize: '3xl',
  color: 'oklch(0.45 0.05 150)', // neutral.600
});

// テキスト
export const emptyStateText = css({
  color: 'oklch(0.45 0.05 150)', // neutral.600
});

// ボタン
<Button variant="subtle" status="primary">
  公開卓を探す
</Button>
```

### 検索パネル構造

**gap:0 のコンテナ** + **divider の margin で余白確保**

```typescript
export const searchPanel = css({
  display: 'flex',
  flexDirection: 'column',
  // gap は使わない
  p: 'lg',
  bg: 'white',
  borderRadius: '16px',
  boxShadow: shadows.sm,
});

export const searchDivider = css({
  border: 'none',
  h: '1px',
  bg: 'oklch(0.95 0.01 150)', // neutral.100
  my: 'lg',  // divider のマージンで余白確保
});
```

### 検索結果件数

```typescript
export const resultCount = css({
  fontSize: 'sm',
  color: 'oklch(0.45 0.05 150)', // neutral.600
});
```

---

## 4. コンポーネントパターン

### カード

```typescript
{
  bg: 'white',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: shadows.xs,
  transition: 'all 0.3s',
  _hover: {
    boxShadow: shadows.sm,
    transform: 'translateY(-2px)',
  },
}
```

**重要**: border は使わない。輪郭は影のみで表現。

### チップ（選択可能なタグ）

```typescript
// 非選択
{
  bg: 'oklch(0.97 0.01 150)',
  color: 'oklch(0.40 0.05 150)',
  boxShadow: shadows.xs,
  borderRadius: '12px',
  _hover: {
    bg: 'oklch(0.94 0.01 150)',
    transform: 'translateY(-1px)',
  },
}

// 選択時
{
  bg: 'oklch(0.95 0.05 150)', // primary.100
  color: 'oklch(0.40 0.15 160)', // primary.800
  boxShadow: shadows.xs,
}
```

### 入力フィールド

```typescript
{
  px: 'md',
  py: 'sm',
  border: 'none',
  borderRadius: 'md',
  bg: 'bg.muted',
  boxShadow: 'sm',
  _hover: { bg: 'bg.emphasized' },
  _focus: {
    bg: 'bg.emphasized',
    outline: '2px solid',
    outlineColor: 'primary.focusRing',
    outlineOffset: '2px',
  },
}
```

### ソートタブ

```typescript
export const sortTabs = css({
  display: 'flex',
  gap: 'xs',
  bg: 'white',
  p: 'xs',
  borderRadius: '16px',
  boxShadow: shadows.xs,
});

// アクティブタブ
{
  color: 'oklch(0.40 0.15 160)', // primary.800
  bg: 'oklch(0.95 0.05 150)',    // primary.100
  fontWeight: 'bold',
  boxShadow: shadows.xs,
}
```

### オーバーレイ（サムネイル上のラベル等）

```typescript
// 明るいオーバーレイ
{
  bg: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(8px)',
}

// 暗いオーバーレイ
{
  bg: 'rgba(0, 0, 0, 0.40)',
  backdropFilter: 'blur(4px)',
  _hover: { bg: 'rgba(0, 0, 0, 0.60)' },
}
```

### 区切り線

**CSS の border-top ではなく `<hr>` 要素を使用**（セマンティックHTML）

```tsx
<hr className={styles.divider} />
```

---

## 5. 禁止パターン

| 禁止 | 理由 | 代替 |
|------|------|------|
| `w: '48px', h: '48px'` でアイコンサイズ | ページ間で不統一 | `fontSize: '3xl'` |
| `gap` でパネル内余白調整 | divider の margin が効かない | gap:0 + divider margin |
| 純粋なグレー `oklch(0.xx 0 0)` | テーマと不調和 | `oklch(0.xx 0.01-0.05 150)` |
| `border: 1px solid` でカード輪郭 | ボーダーレスUI原則に反する | shadow で表現 |
| coral 以外の赤系 | テーマと不調和 | `accent.coral` |
| ハードコードされた色を直接使用 | 一貫性が崩れる | トークンを定義して使用 |

---

## 6. 実装チェックリスト

### 必須（実装前に確認）
- [ ] 色は OKLCH 形式で hue 150 のアンダートーンがあるか
- [ ] 影は xs/sm/md の3段階を使用しているか
- [ ] カードに border を使っていないか（shadow で表現）
- [ ] 空き状態のアイコンは `fontSize` トークンを使用しているか
- [ ] 検索パネルは gap:0 + divider margin 構造か

### 統一性（実装後に確認）
- [ ] シナリオ一覧とセッション一覧で同じスタイルを使っているか
- [ ] 0件表示のテキスト色・アイコンサイズは統一されているか
- [ ] ボタンのバリアントは適切か（空き状態は subtle + primary）

---

## 7. 補足：設計原則

以下は上記ルールの背景となる設計思想。実装時は上記の具体的なルールを優先。

### デザインコンセプト

**モダン × ソフト × レイヤードUI**

| 原則 | 説明 |
|------|------|
| ボーダーレス | 境界線は原則使用しない。輪郭は影で表現 |
| ソフト | 角丸、淡い色、柔らかい影で優しい印象 |
| レイヤード | 影の強弱で奥行きと階層を表現 |

### インタラクション

- **ホバー**: `translateY(-1〜2px)` + 影の強調
- **トランジション**: `all 0.3s ease`（カード）、`all 0.2s ease-in-out`（チップ）
- **フォーカス**: 2px のフォーカスリングで明示

### AI臭いデザインの回避

- 紫グラデーション on 白背景を避ける
- Inter, Roboto の安易な使用を避ける
- 過度なアニメーションを避ける
- 予測可能な左右対称レイアウトを避ける

### アクセシビリティ（WCAG AA）

- 通常テキスト: コントラスト比 4.5:1 以上
- 大きいテキスト: コントラスト比 3:1 以上
- UIコンポーネント: コントラスト比 3:1 以上
