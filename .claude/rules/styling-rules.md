# スタイリング (PandaCSS)

## スタイル定義ファイル

- **CSSスタイルは同階層の`styles.ts`に定義し、インポートして使用する**
- コンポーネントファイル内にスタイル定義を書かない

```
src/components/elements/Button/
├── Button.tsx       # コンポーネント本体
├── styles.ts        # スタイル定義
└── index.ts

src/app/(main)/users/me/
├── page.tsx         # ページコンポーネント
├── styles.ts        # ページのスタイル
└── _components/
```

**styles.ts**:
```typescript
import { css, cva } from '@/styled-system/css'

// 静的スタイル
export const container = css({
  maxW: '800px',
  mx: 'auto',
  px: '4',
})

// バリアント付きスタイル
export const button = cva({
  base: { padding: '4', rounded: 'md' },
  variants: {
    variant: {
      primary: { bg: 'blue.500' },
      secondary: { bg: 'gray.500' },
    },
  },
})
```

## CSS関数の命名規則

- **camelCaseを使用する**
- 複数の要素がある場合は `コンポーネント名_要素名` の形式でアンダースコア区切り

```typescript
// OK - camelCase + アンダースコア区切り
export const editForm_container = css({ ... })
export const editForm_title = css({ ... })
export const editForm_submitButton = css({ ... })
export const card_header = css({ ... })

// NG - kebab-case
export const edit_form_container = css({ ... })
export const editFormContainer = css({ ... })  // 要素の区切りが不明瞭
```

**使用側**:
```typescript
import * as styles from './styles'

export const MyComponent = () => {
  return <div className={styles.container}>...</div>
}
```

## レシピの使用

```typescript
import { button } from '@/styled-system/recipes'

<button className={button({ variant: 'primary', size: 'md' })}>
```

## トークンの活用

- **トークンの確認にはPandaCSS MCPツールを使用する**（ファイル直読みより優先）
- スペーシング: 数値トークン (`4`, `8`, `16`) を使用
- マジックナンバー禁止

### PandaCSS MCP（トークン確認時は必ず使用）

トークン・レシピ・パターンを確認する際は、ファイルを直接読む前にPandaCSS MCPツールを使用すること。
MCPツールはPandaCSSが設定を解析済みの構造化データとして返すため、正確な実効値を取得できる。

| 用途 | MCPツール | 従来の方法（非推奨） |
|------|-----------|-------------------|
| トークン値の確認 | `get_tokens` | `src/styles/tokens/*.ts` を読む |
| セマンティックトークン確認 | `get_semantic_tokens` | `src/styles/semanticTokens.ts` を読む |
| カラーパレット確認 | `get_color_palette` | `src/styles/tokens/colors.ts` を読む |
| レシピ・バリアント確認 | `get_recipes` | `src/styles/recipes/*.ts` を読む |
| パターン確認 | `get_patterns` | ドキュメントを確認 |
| 使用状況分析 | `get_usage_report` | Grep で検索 |

**注意**: トークンの**追加・変更**時は引き続き該当ファイルを直接編集する。MCPは読み取り専用。

## UI Design Guidelines

プロジェクト全体のUIトーン: **モダン × ソフト × レイヤードUI**

**UI実装時は `ui-design-system.md` メモリを必ず参照すること。**

| 原則 | 説明 |
|------|------|
| ボーダーレス基調 | 境界線は基調として避け、輪郭は影で表現する。ただし border が最適な箇所では意図的に使ってよい（下記） |
| 面で区切る | 各情報ブロックは「面」として認識できること |
| 影で階層化 | 階層差は影の強弱で表現する |
| 余白で構造化 | 背景色と余白によって情報の階層を表現する |
| セマンティックHTML | 見た目ではなく意味に基づいて要素を選択 |

**border の使い分け（基調はボーダーレス、border は限定許可）**

判断基準は elevation の意味: **浮かせたい＝影 / 同じ高さで区切りたい＝border**。

| border を使う（最適な場面） | 従来どおり影で表す |
|------|------|
| フォーカスリング（`borders.focusRing`） | カードの輪郭（`card.default`） |
| 入力欄のアフォーダンスが必要な箇所 | 浮かせたい面（パネル/メニュー/ダイアログ） |
| 高密度な表・リスト行の区切り（影だと重い） | チップ/タグの外形 |
| 同一 elevation の面どうしの境界 | ホバーで持ち上がる要素 |
| 半透明背景・画像上の要素の輪郭（影が効かない） | |
| 選択/アクティブ状態の強調（例: 選択カードに `primary` border） | |

border は必ず既存トークン（`border.{default,subtle,focus,error}` / `borders.soft`）を参照する。`1px solid #...` のハードコードは禁止。

**実装パターン** - セマンティックトークンを使用:
- カード: `shadow: 'card.default', _hover: { shadow: 'card.hover' }`
- チップ: `bg: 'chip.default', shadow: 'chip.default'`
- オーバーレイ: `bg: 'overlay.light'` または `'overlay.dark'`
- 区切り線: `border-top`ではなく`<hr>`要素を使用
- 入力フィールド: border なし、bg を少し暗く

**重要**: 新しい色・影・サイズを追加する場合は、必ず`src/styles/semanticTokens.ts`にトークンとして定義し、コンポーネントではトークン名を参照すること。ハードコードされた値（`rgba(...)`, `oklch(...)`等）を直接スタイルに書かない。

### 例外: データ駆動の動的色（DB管理カラー）

DB 等から来る**動的な色**（例: `tags.color`）はクラス事前生成が不可能なため、以下を限定的に許可する。**静的な色はこの例外の対象外**（従来どおり HEX トークン固定）。

| 通常の禁止 | 動的色での例外 |
|---|---|
| OKLCH 形式 | **OKLCH を許可**（基準色を保存し、明度を振って bg/text を導出するとコントラストを担保しやすい） |
| インラインスタイル（style属性） | **CSS 変数注入に限り `style` を許可**（例: `style={{ '--pill-bg': ..., '--pill-text': ... }}`） |

実装の隔離: 動的色は専用コンポーネント（例: `Tag` → `Pill` の `tone="custom"`）に閉じ込め、汎用コンポーネントには波及させない。導出ロジックは `src/lib/tagColor.ts`。
