# UIデザインシステム

このドキュメントはプロジェクト全体で一貫したUIを生成するためのデザインガイドラインである。

---

## デザインコンセプト

**モダン × ソフト × レイヤードUI**

| 原則 | 説明 |
|------|------|
| **ボーダーレス** | 線で区切らず、影と面で構造を表現 |
| **ソフト** | 角丸、淡い色、柔らかい影で優しい印象 |
| **レイヤード** | 影の強弱で奥行きと階層を表現 |
| **意図的** | すべての選択に理由がある。偶然や惰性でデザインしない |

### このプロジェクトの美的方向性

**ソフト/パステル × 洗練されたミニマリズム**

- 淡く優しい色調で安心感を与える
- 繊細な影と微細なインタラクションで上質さを演出
- 余白を活かし、情報を呼吸させる
- TRPGの「物語を紡ぐ」体験に寄り添う温かみ

---

## 設計思考のプロセス

新しいUIを作成する前に、以下を明確にする：

### 1. 目的の理解
- このUIは何の問題を解決するか？
- 誰が、どんな状況で使うか？
- ユーザーが達成したいことは何か？

### 2. トーンの確認
このプロジェクトは**ソフト/パステル**がベーストーン。ただし、コンテキストに応じて強弱をつける：

| シーン | トーンの調整 |
|--------|-------------|
| 検索・探索 | ニュートラル、落ち着き |
| セッション詳細 | 温かみ、期待感 |
| 完了・振り返り | 達成感、ノスタルジー |
| エラー・警告 | 明確だが攻撃的でない |

### 3. 差別化ポイント
- この画面で**一番記憶に残るべき要素**は何か？
- 他の画面との**一貫性**と**個性**のバランスは？

---

## 重要: セマンティックトークンの使用

**新しい色・影・サイズを追加する場合は、必ず `src/styles/semanticTokens.ts` にトークンとして定義すること。**

ハードコードされた値（`rgba(...)`, `oklch(...)`等）を直接スタイルに書かず、トークン名を参照する。

```typescript
// NG - ハードコード
shadow: '0 2px 6px rgba(0,0,0,0.08)',
bg: 'oklch(0.97 0 0)',

// OK - トークン参照
shadow: 'card.default',
bg: 'chip.default',
```

### 利用可能なトークン

| カテゴリ | トークン | 用途 |
|----------|----------|------|
| shadows.card | default, hover | カード・パネル |
| shadows.chip | default, hover, selected, selectedHover | チップ・バッジ |
| colors.chip | default, hover | 非選択チップの背景 |
| colors.overlay | light, dark, darkHover | オーバーレイ |

---

## タイポグラフィ

### フォント選択の原則

**避けるべきフォント**（AI生成感が出やすい）:
- Inter, Roboto, Arial, Helvetica
- システムフォント（-apple-system, BlinkMacSystemFont）
- 過度に使われているモダンフォント（Space Grotesk等）

**推奨アプローチ**:
- **見出し**: 個性的だが読みやすいフォント
- **本文**: 可読性を最優先しつつ、少し特徴のあるフォント
- **日本語**: Noto Sans JP, M PLUS Rounded, BIZ UDゴシックなど

### 文字組みの原則

| 要素 | ガイドライン |
|------|-------------|
| 見出し | 大きめのフォントサイズ、適度な letter-spacing |
| 本文 | line-height: 1.7〜1.8 で読みやすく |
| ラベル | 小さめでも可読性を確保（14px以上） |
| 数値 | tabular-nums で揃える |

---

## 色の使い方

### パレットの原則

**ソフト/パステルベース**:
- 背景: 明度 0.95〜0.98 の淡い色
- テキスト: 明度 0.25〜0.40 の落ち着いた色
- アクセント: 彩度を抑えた優しい色調

**コントラストの確保（WCAG AA）**:
- 通常テキスト: 4.5:1 以上
- 大きいテキスト: 3:1 以上
- UIコンポーネント: 3:1 以上

### 色のトークン

| トークン | 用途 |
|----------|------|
| `chip.default` | 非選択チップの背景（oklch 0.97） |
| `chip.hover` | 非選択チップのホバー背景（oklch 0.94） |
| `overlay.light` | 明るいオーバーレイ（白85%透過） |
| `overlay.dark` | 暗いオーバーレイ（黒40%透過） |
| `overlay.darkHover` | 暗いオーバーレイのホバー（黒60%透過） |

### 透過の活用
- 明るいオーバーレイ: `bg: 'overlay.light'` + `backdrop-filter: blur(8px)`
- 暗いオーバーレイ: `bg: 'overlay.dark'` + `backdrop-filter: blur(4px)`

---

## モーション & インタラクション

### アニメーションの原則

**少なく、意味のあるモーションを**:
- 派手なアニメーションより、繊細で上品な動き
- ユーザーのアクションに対するフィードバックを優先
- 装飾目的のアニメーションは最小限に

### 効果的なモーションパターン

| パターン | 用途 | 実装 |
|----------|------|------|
| **ページロード** | 初期表示時のstaggered reveal | animation-delay で要素を順番に表示 |
| **ホバー** | インタラクティブ要素の反応 | translateY(-1〜2px) + 影の強調 |
| **フォーカス** | キーボード操作の明示 | フォーカスリング |
| **状態変化** | 選択/非選択の切り替え | 色と影のスムーズな遷移 |

### トランジション設定

```typescript
// 標準（カード、パネル）
transition: 'all 0.3s ease'

// 高速（チップ、ボタン）
transition: 'all 0.2s ease-in-out'

// 背景のみ（削除ボタン等）
transition: 'background 0.15s'

// staggered reveal（リスト項目）
animation: 'fadeIn 0.3s ease forwards'
animationDelay: `${index * 0.05}s`
```

### ホバーエフェクト

```typescript
_hover: {
  transform: 'translateY(-2px)',  // 微小な浮上
  shadow: 'card.hover',           // 影の強調
}
```

### フォーカス

```typescript
_focusVisible: {
  boxShadow: '0 0 0 2px {colors.bg.card}, 0 0 0 4px {colors.primary.focusRing}',
}
```

---

## 空間構成 & レイアウト

### 余白の原則

**呼吸するレイアウト**:
- 要素間に十分な余白を確保
- 密度が必要な場所と余裕が必要な場所を意識的に使い分ける
- グループ内は近く、グループ間は遠く（近接の法則）

### レイアウトのバリエーション

単調なレイアウトを避けるためのテクニック：

| テクニック | 説明 | 使用例 |
|-----------|------|--------|
| **非対称** | 完全な左右対称を避ける | サイドバー + メインコンテンツ |
| **グリッド破壊** | 一部の要素をグリッドから外す | ヒーローセクションの画像 |
| **重なり** | 要素を少し重ねて奥行きを出す | カードの一部がはみ出す |
| **ネガティブスペース** | 意図的な空白で視線を誘導 | CTAボタン周辺 |

---

## 背景 & 視覚的詳細

### 背景の考え方

**単色ベタ塗りを避ける**:
- 微細なグラデーションで深みを出す
- 必要に応じてノイズテクスチャを追加
- 背景と前景のレイヤー感を意識

### 視覚的詳細のテクニック

| テクニック | 用途 | 実装例 |
|-----------|------|--------|
| **微細グラデーション** | 背景に深みを出す | `linear-gradient(180deg, bg.subtle, bg.default)` |
| **影のレイヤー** | 立体感の強調 | 複数の影を重ねる |
| **ブラー効果** | オーバーレイの洗練 | `backdrop-filter: blur(8px)` |
| **リキッドカーブ** | 有機的な形状 | radial-gradient で逆角丸 |

### リキッドカーブ（逆角丸）

角丸の「逆」形状を実現するための radial-gradient テクニック。

```typescript
// 右方向へのカーブ
{
  position: 'absolute',
  top: 0,
  right: '-12px',
  w: '12px',
  h: '12px',
  background: 'radial-gradient(circle 12px at 100% 100%, transparent 11.5px, rgba(255,255,255,0.85) 12px)',
}
```

---

## コンポーネント別ガイドライン

### カード

```typescript
{
  bg: 'bg.card',
  borderRadius: 'xl',           // 大きめの角丸
  overflow: 'hidden',
  shadow: 'card.default',       // セマンティックトークンを使用
  transition: 'all 0.3s',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
}
```

**設計原則**:
- border: なし（輪郭は影のみで表現）
- ホバー時: 影の拡大 + 微小な上昇（-2px程度）
- 角丸: `xl`（大きめ）で柔らかい印象

### チップ（選択可能なタグ・バッジ）

**非選択状態**:
```typescript
{
  bg: 'chip.default',
  color: 'text.primary',
  shadow: 'chip.default',
  border: 'none',
  borderRadius: 'full',
  _hover: {
    bg: 'chip.hover',
    shadow: 'chip.hover',
    transform: 'translateY(-1px)',
  },
}
```

**選択状態**:
```typescript
{
  bg: 'primary.default',
  color: 'primary.foreground.white',
  shadow: 'chip.selected',
  transform: 'translateY(-1px)',
  _hover: {
    bg: 'primary.emphasized',
    shadow: 'chip.selectedHover',
  },
}
```

### オーバーレイ・ラベル

サムネイル上に配置するラベルやボタンは半透明 + ブラー。

**システムラベル（明るい背景）**:
```typescript
{
  bg: 'overlay.light',
  backdropFilter: 'blur(8px)',
}
```

**ボタン（暗い背景）**:
```typescript
{
  bg: 'overlay.dark',
  backdropFilter: 'blur(4px)',
  _hover: {
    bg: 'overlay.darkHover',
  },
}
```

### セクション区切り

**CSSのborder-topではなく、`<hr>`要素を使用する（セマンティックHTML）。**

```typescript
// styles.ts
export const divider = css({
  border: 'none',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
  my: 'md',
});

// Component.tsx
<hr className={styles.divider} />
```

---

## 避けるべきパターン（AI臭いデザインの回避）

### 絶対に避ける

| 避けるべきパターン | 代替案 |
|-------------------|--------|
| Inter, Roboto, Arial の安易な使用 | プロジェクトで定義されたフォントを使用 |
| 紫グラデーション on 白背景 | ソフト/パステルパレットを使用 |
| ハードコードされた色・影の値 | セマンティックトークンを使用 |
| `border: 1px solid` でカード輪郭 | `shadow: 'card.default'` で表現 |
| `border-top` で区切り線 | `<hr>` 要素を使用 |
| 中間明度の背景に白テキスト | コントラスト比を確保 |
| 不透明なオーバーレイ | 半透明 + backdrop-filter |
| 均等に分散した配色 | 支配色 + アクセントで強弱をつける |
| 予測可能な左右対称レイアウト | 意図的な非対称や余白の活用 |
| 過度なアニメーション | 繊細で意味のあるモーションのみ |

### 毎回変えるべきこと

同じコンポーネントでも、コンテキストに応じて微調整する：

- 同じフォントサイズでも、場面によってウェイトを変える
- カードでも、重要度によって影の強さを変える
- 色のトーンは維持しつつ、彩度や明度を微調整

---

## 影のレベル（セマンティックトークン）

| トークン | 用途 |
|----------|------|
| `card.default` | カード・パネルの基本状態 |
| `card.hover` | カードホバー状態 |
| `chip.default` | 非選択チップ |
| `chip.hover` | チップホバー |
| `chip.selected` | 選択されたチップ |
| `chip.selectedHover` | 選択されたチップのホバー |

---

## 実装チェックリスト

新しいUIコンポーネントを作成する際の確認項目：

### 必須（セマンティクス & トークン）
- [ ] セマンティックトークンを使用しているか？
- [ ] ハードコードされた色・影の値がないか？
- [ ] セマンティックHTMLを使用しているか？（`<hr>`, `<button>`, `<nav>`等）

### デザイン品質
- [ ] カードにborderを使っていないか？（shadowで表現）
- [ ] チップ/バッジは影で輪郭を表現しているか？
- [ ] オーバーレイは半透明 + blurか？
- [ ] 色のコントラストはWCAG AA基準を満たしているか？

### インタラクション
- [ ] ホバー時に微小な浮上（translateY）があるか？
- [ ] トランジションは適切に設定されているか？
- [ ] フォーカス状態は明確か？

### 差別化
- [ ] AI臭いデザインパターンを避けているか？
- [ ] このUIの「記憶に残るポイント」は何か明確か？
- [ ] コンテキストに合ったトーンになっているか？

### 新しいデザイン値が必要な場合

1. `src/styles/semanticTokens.ts` にトークンを追加
2. `pnpm prepare` でPandaCSSを再生成
3. コンポーネントでトークン名を参照
