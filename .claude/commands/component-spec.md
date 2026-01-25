---
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, mcp__serena__list_memories, mcp__serena__read_memory, mcp__serena__write_memory, mcp__pencil__get_editor_state, mcp__pencil__open_document, mcp__pencil__batch_get, mcp__pencil__get_screenshot
description: コンポーネントの要件を対話的に定義する。Pencilデザインを元にProps・振る舞い・テスト観点を明確化し、/gen-testへ引き継ぐ。
---

# /component-spec コマンド

## 概要

**コンポーネント専用の要件定義スキル**

Pencilで作成したデザインを元に、対話的にコンポーネントの詳細仕様を決定する。
Props設計、インタラクション、状態遷移、アクセシビリティなどを明確化し、テスト可能な要件定義書を作成する。

```
Pencil → [/component-spec] → /gen-test → /implement-tests → /refactor
            ↓
      デザイン確認
            ↓
      対話的ヒアリング
            ↓
      要件定義書作成
```

## 使用方法

```bash
/component-spec                           # 新規コンポーネントの要件定義を開始
/component-spec <コンポーネント名>          # 特定コンポーネントの要件定義
/component-spec refine <コンポーネント名>   # 既存要件を見直す
```

## 対象コンポーネント

| 種別 | 配置場所 | 例 |
|------|----------|-----|
| UIコンポーネント | `src/components/elements/` | Button, Card, Input |
| ブロックコンポーネント | `src/components/blocks/` | Header, SideMenu |
| ページコンポーネント | `src/app/*/_components/` | ScenarioCard, SearchForm |

---

## 実行手順

### Step 1: Pencilデザインの確認（必須）

**デザインファーストの原則に従い、先にPencilでデザインを確認する。**

```typescript
// 1. エディタ状態を確認
mcp__pencil__get_editor_state()

// 2. デザインファイルを開く
mcp__pencil__open_document("docs/designs/scenarios.pen")

// 3. 対象コンポーネントを取得
mcp__pencil__batch_get({ patterns: ["コンポーネント名*"] })

// 4. スクリーンショットで視覚的に確認
mcp__pencil__get_screenshot({ nodeId: "対象ノードID" })
```

**デザインがない場合**: 先にPencilでデザインを作成するよう促す。

### Step 2: メモリの確認

```typescript
// ui-design-system メモリを読み込む（必須）
mcp__serena__read_memory({ name: "ui-design-system" })

// ui-component-behavior があれば読み込む
mcp__serena__read_memory({ name: "ui-component-behavior" })
```

### Step 3: 基本情報のヒアリング

**最初に聞く3つの質問**（AskUserQuestion ツールを使用）:

1. **コンポーネントの目的**
   - 「このコンポーネントは何をする？」
   - 「どの画面で使う？」
   - 「再利用する予定はある？」

2. **類似コンポーネントの確認**
   - 「Ark UIに同様のコンポーネントはある？」
   - 「既存コンポーネントで代用できない理由は？」

3. **使用コンテキスト**
   - 「誰が使う？（GM/PL/管理者）」
   - 「どんな状況で使う？」

### Step 4: Props設計のヒアリング

#### 4.1 必須Props

```
Q: このコンポーネントに絶対必要な入力は？
   - 表示するデータは？
   - 必須のコールバックは？
```

#### 4.2 オプショナルProps

```
Q: あると便利だけど省略可能なものは？
   - デフォルト値は何にする？
   - なぜその値がデフォルト？
```

#### 4.3 Variants（見た目のバリエーション）

```
Q: 見た目のバリエーションは必要？

例:
- variant: "primary" | "secondary" | "ghost"
- size: "sm" | "md" | "lg"
- colorScheme: "default" | "danger" | "success"
```

**確認ポイント**:
- 各variantの使用シーンは明確か？
- デザインシステム（ui-design-system）と整合しているか？

### Step 5: 振る舞いのヒアリング

#### 5.1 インタラクション

```
Q: ユーザー操作に対してどう反応する？

状態:
- [ ] hover: ホバー時の変化
- [ ] focus: フォーカス時（キーボード操作）
- [ ] active: クリック/タップ中
- [ ] disabled: 無効化時
- [ ] loading: 読み込み中
```

#### 5.2 状態遷移

```
Q: コンポーネントが持つ状態は？

例:
- idle → loading → success/error
- collapsed → expanded
- unselected → selected
```

#### 5.3 アニメーション

```
Q: アニメーションは必要？

- 状態変化時のトランジション
- 表示/非表示のアニメーション
- ローディングアニメーション
```

### Step 6: アクセシビリティのヒアリング

**WCAG 2.1 AA準拠を確認**:

```
Q: アクセシビリティ要件を確認します

キーボード操作:
- [ ] Tab: フォーカス移動
- [ ] Enter/Space: 決定
- [ ] Escape: キャンセル
- [ ] 矢印キー: 選択移動

ARIA:
- [ ] 適切なroleは？
- [ ] aria-labelは必要？
- [ ] aria-describedbyは必要？
- [ ] 状態を伝えるaria属性は？

コントラスト:
- [ ] テキストと背景のコントラスト比 4.5:1以上
- [ ] UIコンポーネントのコントラスト比 3:1以上
```

### Step 7: エラーケース・境界値のヒアリング

```
Q: 異常系や境界値の挙動を確認します

- データがない場合の表示は？
- 長いテキストの場合は？（truncate? wrap?）
- 大量データの場合は？
- 不正な値が渡された場合は？
```

### Step 8: テスト観点の整理

ヒアリング結果から、テストすべき観点を整理:

```markdown
## テスト観点

### レンダリング
- [ ] 必須Propsのみで正しくレンダリングされる
- [ ] 各variantが正しく表示される
- [ ] 各sizeが正しく表示される

### インタラクション
- [ ] クリック時にonClickが呼ばれる
- [ ] disabled時はクリックできない
- [ ] hover時にスタイルが変わる

### アクセシビリティ
- [ ] キーボード操作で操作できる
- [ ] スクリーンリーダーで読み上げられる
- [ ] フォーカスリングが表示される

### エラーケース
- [ ] 空データ時の表示
- [ ] 長いテキスト時の挙動
```

### Step 9: ドキュメント出力

要件が固まったら `.claude/requirements/components/<コンポーネント名>.md` に出力。

### Step 10: PROGRESS.md更新

```markdown
## TDD進捗: <コンポーネント名>

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| <コンポーネント名> | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | 要件定義済 |
```

---

## 出力フォーマット

```markdown
# [コンポーネント名] 要件定義書

**作成日**: YYYY-MM-DD
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/xxx.pen > フレーム名

---

## 1. 概要

### 1.1 目的
このコンポーネントが解決する課題を1-2文で。

### 1.2 使用場所
- `src/app/(main)/scenarios/_components/` で使用
- 再利用性: 高/中/低

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベースにするコンポーネント: なし / Ark UI Dialog / 既存Button
- カスタマイズ内容: xxx

---

## 2. Props設計

### 2.1 必須Props

| Prop | 型 | 説明 |
|------|-----|------|
| `children` | `React.ReactNode` | ボタンのラベル |
| `onClick` | `() => void` | クリック時のコールバック |

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | `"primary" \| "secondary"` | `"primary"` | 見た目のバリエーション |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | サイズ |
| `disabled` | `boolean` | `false` | 無効化 |
| `loading` | `boolean` | `false` | ローディング状態 |

### 2.3 型定義

```typescript
type ButtonProps = {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}
```

---

## 3. Variants

### 3.1 variant

| 値 | 用途 | 見た目 |
|-----|------|--------|
| `primary` | 主要なアクション | 塗りつぶし、目立つ色 |
| `secondary` | 補助的なアクション | 枠線のみ |

### 3.2 size

| 値 | 高さ | フォントサイズ | パディング |
|-----|------|--------------|-----------|
| `sm` | 32px | 14px | 8px 12px |
| `md` | 40px | 16px | 12px 16px |
| `lg` | 48px | 18px | 16px 24px |

---

## 4. インタラクション

### 4.1 状態

| 状態 | 見た目の変化 | 備考 |
|------|-------------|------|
| default | - | 通常状態 |
| hover | 背景色が少し明るく | cursor: pointer |
| focus | フォーカスリング表示 | 2px offset |
| active | 背景色が少し暗く | scale(0.98) |
| disabled | opacity: 0.5 | cursor: not-allowed |
| loading | スピナー表示 | クリック無効 |

### 4.2 キーボード操作

| キー | 動作 |
|------|------|
| Tab | フォーカス移動 |
| Enter | onClick発火 |
| Space | onClick発火 |

### 4.3 アニメーション

| 対象 | duration | easing |
|------|----------|--------|
| 背景色変化 | 150ms | ease-out |
| scale変化 | 100ms | ease-out |

---

## 5. アクセシビリティ

### 5.1 ARIA属性

```typescript
// 例
<button
  role="button"
  aria-disabled={disabled}
  aria-busy={loading}
>
```

### 5.2 コントラスト

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| primary背景 + 白文字 | 4.8:1 | ✅ |
| secondary枠線 + 背景 | 3.2:1 | ✅ |

---

## 6. エラーケース・境界値

### 6.1 children

| ケース | 挙動 |
|--------|------|
| 空文字 | 高さは維持、空のボタンとして表示 |
| 長いテキスト | 1行でtruncate、tooltipで全文表示 |
| アイコンのみ | aria-labelが必須 |

### 6.2 状態の組み合わせ

| ケース | 挙動 |
|--------|------|
| disabled + loading | disabledを優先 |
| loading時のクリック | 無視 |

---

## 7. テスト観点

### 7.1 レンダリング

- [ ] 必須Propsのみで正しくレンダリングされる
- [ ] variant="primary"が正しく表示される
- [ ] variant="secondary"が正しく表示される
- [ ] size="sm"が正しいサイズで表示される
- [ ] size="md"が正しいサイズで表示される
- [ ] size="lg"が正しいサイズで表示される

### 7.2 インタラクション

- [ ] クリック時にonClickが呼ばれる
- [ ] disabled時はonClickが呼ばれない
- [ ] loading時はonClickが呼ばれない
- [ ] Enterキーでクリックできる
- [ ] Spaceキーでクリックできる

### 7.3 アクセシビリティ

- [ ] role="button"が設定されている
- [ ] disabled時にaria-disabled="true"
- [ ] loading時にaria-busy="true"
- [ ] フォーカス可能
- [ ] フォーカスリングが表示される

### 7.4 エラーケース

- [ ] 空のchildrenでもクラッシュしない
- [ ] 長いテキストがtruncateされる

---

## 8. 実装メモ

### 8.1 依存

- PandaCSS: スタイリング
- lucide-react: アイコン（loading時のスピナー）

### 8.2 ファイル構成

```
src/components/elements/Button/
├── Button.tsx
├── styles.ts
├── Button.stories.tsx
├── Button.test.tsx
└── index.ts
```

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 備考 |
|------|------|-------------|------|
| Button | コンポーネント | `src/components/elements/Button/Button.tsx` | |
| buttonStyles | cva | `src/components/elements/Button/styles.ts` | |
```

---

## ヒアリングのコツ

1. **デザインを見ながら**: Pencilのスクリーンショットを参照しながら確認
2. **具体例を出す**: 「例えばこのボタンがdisabledの時は...」
3. **選択肢を提示**: 「truncateとwrap、どちらにする？」
4. **アクセシビリティを忘れない**: 視覚的なデザインだけでなくキーボード操作も
5. **テストを意識**: 「この挙動はどうテストする？」

---

## チェックリスト

要件定義完了前に確認:

- [ ] Pencilデザインを確認した
- [ ] ui-design-systemメモリを参照した
- [ ] すべてのPropsを定義した
- [ ] すべてのvariantsを定義した
- [ ] インタラクション（hover/focus/active/disabled）を定義した
- [ ] キーボード操作を定義した
- [ ] アクセシビリティ要件を定義した
- [ ] エラーケース・境界値を定義した
- [ ] テスト観点を整理した
- [ ] PROGRESS.mdを更新した

---

## 次のフェーズへの引き継ぎ

要件定義完了後、以下を伝達:

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/<コンポーネント名>.md
📊 PROGRESS.md: 更新済み
🎨 Pencilデザイン: docs/designs/xxx.pen > フレーム名

次のフェーズ:
/gen-test <コンポーネント名>
```
