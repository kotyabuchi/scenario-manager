---
allowed-tools: Read, Glob, Grep, AskUserQuestion, mcp__serena__read_memory, mcp__serena__list_memories, mcp__pencil__get_editor_state, mcp__pencil__open_document, mcp__pencil__get_guidelines, mcp__pencil__get_style_guide, mcp__pencil__get_style_guide_tags, mcp__pencil__batch_design, mcp__pencil__batch_get, mcp__pencil__get_screenshot, mcp__pencil__snapshot_layout, mcp__pencil__find_empty_space_on_canvas, mcp__pencil__get_variables, mcp__pencil__set_variables
description: 要件定義を元にPencilでUIデザインを作成する。新機能の画面デザインやUIコンポーネントの設計に使用。
---

# /pencil-design コマンド

## 概要

**TDD開発フローのUIデザインフェーズを担当するスキル**

要件定義書を元に、Pencil MCPツールを使用してUIデザインを作成する。
画面ごとにスクリーンショットを見せてユーザーの承認を得ながら進める。

```
/requirements → [/pencil-design] → レビュー → /gen-test → ...
                      ↓
              Pencilでデザイン作成
                      ↓
              画面ごとに確認・承認
                      ↓
              要件定義への反映確認
```

## 使用方法

```bash
/pencil-design                                    # 対話で要件定義書を選択
/pencil-design feedback                           # requirements-feedback.md から作成
/pencil-design .claude/requirements/feedback.md   # ファイルパスを直接指定
/pencil-design セッション募集画面を作りたい          # 自然言語で要件を指定
```

---

## 実行手順

### Phase 1: 準備

#### Step 1.1: メモリの読み込み（必須）

1. `list_memories` で既存メモリを確認
2. **`ui-design-system` メモリを必ず読み込む**（デザインシステム準拠のため）
3. `user-personas` があれば読み込む（ユーザー理解のため）

```
ui-design-systemメモリには以下が含まれる:
- カラーパレット（セマンティックトークン）
- コンポーネントパターン
- 禁止パターン
- レイアウト原則
```

#### Step 1.2: 要件の特定

$ARGUMENTS を解析:

1. **要件定義書名が指定された場合**: `.claude/requirements/requirements-{名前}.md` を読み込む
   - 例: `feedback` → `requirements-feedback.md`

2. **ファイルパスが指定された場合**: そのファイルを読み込む

3. **自然言語で指定された場合**: 要件定義書を検索して該当箇所を特定

4. **指定なしの場合**: AskUserQuestion で選択

#### Step 1.3: 出力先の確認

既存の.penファイルを確認:

```bash
# デザインファイルの一覧を取得
ls docs/designs/*.pen
```

**ユーザーに確認（AskUserQuestion）**:

```
デザインの出力先を選択してください:

[docs/designs/scenarios.pen に追加]
[新規ファイルを作成]
[既存ファイルを開いて確認]
```

#### Step 1.4: Pencilエディタの準備

1. `get_editor_state()` で現在の状態を確認
2. 対象の.penファイルを `open_document(filePath)` で開く
3. `get_guidelines('landing-page')` または `get_guidelines('table')` でガイドラインを取得

---

### Phase 2: デザイン計画

#### Step 2.1: 画面一覧の抽出

要件定義書から作成すべき画面を抽出:

```markdown
## デザイン対象画面

| 画面名 | URL | 説明 | 優先度 |
|--------|-----|------|--------|
| フィードバック一覧 | /feedback | フィードバックの検索・閲覧 | 高 |
| フィードバック詳細 | /feedback/[id] | 詳細表示・投票・コメント | 高 |
| フィードバック投稿モーダル | - | 新規投稿フォーム | 高 |
| 管理ダッシュボード | /admin/feedback | 管理者向け一覧 | 中 |
```

#### Step 2.2: フレーム命名規則の確認

CLAUDE.mdの命名規則に従う:

```
セクション名 / 画面名

例:
Feedback / 一覧画面
Feedback / 一覧画面（空状態）
Feedback / 詳細画面
Feedback / 投稿モーダル
```

#### Step 2.3: デザイン計画の確認

**ユーザーに確認（AskUserQuestion）**:

```
以下の画面をデザインします:

1. Feedback / 一覧画面
2. Feedback / 一覧画面（空状態）
3. Feedback / 詳細画面
4. Feedback / 投稿モーダル
5. Feedback / 管理ダッシュボード

作成順序と優先度を確認してください:
[この順序で開始] [順序を変更] [一部のみ作成] [中止]
```

---

### Phase 2.5: デザイン着手前チェック（必須・省略禁止）

**過去の失敗**: コンポーネントを使わず手作りし、既存デザインを参考にせず品質基準を満たさなかった。このフェーズは必ず実行すること。

#### Step 2.5.1: リユーザブルコンポーネントの調査

1. `batch_get` で `{ "reusable": true }` の全コンポーネントを一覧取得する
2. 使用予定のコンポーネント（Input, Button, Dialog, Textarea, Chip, Avatar等）の **ID と内部ノード名** をメモする
3. デザイン中は必ず `ref` で参照する。**手作りは禁止**（既存コンポーネントにないものだけ例外）

```typescript
// 全リユーザブルコンポーネント一覧を取得
batch_get({
  filePath: "docs/designs/scenarios.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
  searchDepth: 3
})
```

#### Step 2.5.2: 既存デザインの参考調査

1. 作成する画面に最も近い既存画面を特定する（例: フォーム画面 → Feedbackモーダル）
2. その画面の **スクリーンショット** を取得して品質基準を確認する
3. `batch_get` で内部構造を確認し、以下の値を踏襲する:
   - パディング、gap、角丸（cornerRadius）
   - 影（effect）の値
   - フォントサイズ・ウェイト
   - レイアウト（layout, alignItems, justifyContent）

#### Step 2.5.3: チェックリスト確認

デザイン作成に進む前に、以下を満たしていることを確認:

- [ ] リユーザブルコンポーネントのID一覧を把握した
- [ ] Input, Button, Textarea等の内部ノード名（ラベル、プレースホルダー等）を把握した
- [ ] 最も近い既存画面のスクリーンショットを確認した
- [ ] 既存画面の構造（パディング、影、角丸）を確認した

---

### Phase 3: デザイン作成（画面ごとにループ）

#### Step 3.1: キャンバス上の配置位置を決定

```typescript
// 空きスペースを探す
find_empty_space_on_canvas({
  direction: 'right',  // または 'down'
  width: 1440,         // 画面幅
  height: 900,         // 想定高さ
})
```

#### Step 3.2: フレームの作成

```typescript
// batch_design で画面フレームを作成
batch_design({
  operations: `
    frame1=I("root", {
      type: "FRAME",
      name: "Feedback / 一覧画面",
      x: ${x},
      y: ${y},
      width: 1440,
      height: 900,
      fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]
    })
  `
})
```

#### Step 3.3: コンポーネントの配置

要件定義書のワイヤーフレーム・UI仕様を参照し、コンポーネントを配置:

**配置の原則**（ui-design-systemより）:
- ボーダーレス: 境界線は原則使用しない
- 面で区切る: 各情報ブロックは「面」として認識
- 影で階層化: 階層差は影の強弱で表現
- 余白で構造化: 背景色と余白で情報の階層を表現

**使用するコンポーネント例**:
- カード: `shadow: 'card.default'`
- チップ: `bg: 'chip.default'`
- 入力フィールド: `border: none`, `bg: 'input.bg'`

#### Step 3.4: スクリーンショットで確認

```typescript
// 作成した画面のスクリーンショットを取得
get_screenshot({
  nodeId: "frame1のID",
  scale: 1
})
```

#### Step 3.5: ユーザーの承認を得る

**ユーザーに確認（AskUserQuestion）**:

```
「Feedback / 一覧画面」のデザインが完成しました。

[スクリーンショットを表示]

確認してください:
[承認して次へ] [修正を依頼] [やり直し] [中止]
```

**「修正を依頼」の場合**:
- ユーザーから具体的なフィードバックを受け取る
- 該当箇所を `batch_design` で修正
- 再度スクリーンショットで確認

#### Step 3.6: 次の画面へ

全画面が完了するまで Step 3.1〜3.5 を繰り返す。

---

### Phase 4: 要件定義への反映確認

デザイン修正の過程で、要件定義書に記載されていない内容（新しいUI要素、状態、操作フローなど）が追加された場合、このフェーズで要件定義書への反映を確認する。

#### Step 4.1: 要件外の変更を収集

Phase 3 のデザイン作成・修正を通じて追加された、要件定義書に無い内容を一覧化する:

```markdown
## 要件定義書にない変更

| # | 変更内容 | 画面 | 種別 |
|---|----------|------|------|
| 1 | 空状態時のイラスト表示 | 一覧画面（空状態） | UI要素追加 |
| 2 | カード長押しで削除メニュー | 一覧画面 | 操作フロー追加 |
| 3 | 投稿後の確認ダイアログ | 投稿モーダル | 状態追加 |
```

種別の例:
- **UI要素追加**: 要件に無いボタン、テキスト、アイコンなど
- **状態追加**: 空状態、エラー状態、ローディング状態など
- **操作フロー追加**: 新しいユーザーインタラクション
- **バリデーション追加**: 入力値の制約
- **レイアウト変更**: 要件と異なる配置

#### Step 4.2: ユーザーに反映を確認

**要件外の変更がない場合**: このフェーズをスキップしてPhase 5へ進む。

**要件外の変更がある場合**: 各項目について要件定義書に追記するか確認する。

**ユーザーに確認（AskUserQuestion）**:

```
デザイン修正の中で、要件定義書に記載されていない以下の内容が追加されました。
要件定義書に反映しますか?

1. ✅ 空状態時のイラスト表示
2. ✅ カード長押しで削除メニュー
3. ❌ 投稿後の確認ダイアログ（不要）

[選択した項目を要件定義書に追記] [すべて追記] [追記しない] [個別に確認]
```

#### Step 4.3: 要件定義書を更新

ユーザーが承認した項目を要件定義書に追記する:

1. 対象の要件定義書ファイルを開く（`.claude/requirements/requirements-*.md`）
2. 適切なセクションに追記（UI仕様、テスト観点など）
3. テスト観点（§4）にも対応するテストケースを追加

```markdown
# 追記例

## 2. 機能要件
### 2.1 画面・操作フロー
- （追加）一覧画面の空状態ではイラストと案内テキストを表示する

## 4. テスト観点
### 4.1 正常系
- [ ] （追加）データが0件の場合、空状態イラストが表示される
```

---

### Phase 5: 完了

#### Step 5.1: 全画面のサマリー

```markdown
## デザイン完了サマリー

### 作成した画面

| 画面名 | フレームID | ステータス |
|--------|-----------|----------|
| Feedback / 一覧画面 | abc123 | ✅ 承認済 |
| Feedback / 詳細画面 | def456 | ✅ 承認済 |
| Feedback / 投稿モーダル | ghi789 | ✅ 承認済 |

### 出力ファイル
- `docs/designs/scenarios.pen`
```

#### Step 5.2: 次のステップを案内

```
✅ デザイン作成完了
📄 要件定義書: 更新済（デザインで追加された内容を反映）

【次のステップ】

1. デザインの最終確認
   - Pencilエディタで全画面を確認

2. コンポーネント仕様の作成（任意）:
   /component-spec feedback

3. テスト生成（TDD Red フェーズ）:
   /gen-test feedback

💡 ヒント: /component-spec でデザインからProps・振る舞いを明確化できます
```

---

## デザインガイドライン

### 画面サイズ

| デバイス | 幅 | 用途 |
|----------|-----|------|
| Desktop | 1440px | メイン |
| Tablet | 768px | レスポンシブ確認用 |
| Mobile | 375px | レスポンシブ確認用 |

### カラー（ui-design-systemより）

セマンティックトークンを使用:

| 用途 | トークン |
|------|----------|
| 背景（メイン） | `bg.canvas` |
| 背景（カード） | `bg.card` |
| テキスト（メイン） | `text.default` |
| テキスト（サブ） | `text.muted` |
| プライマリ | `primary.500` |
| エラー | `error.500` |

### 影（ui-design-systemより）

| 用途 | トークン |
|------|----------|
| カード（通常） | `shadow.card.default` |
| カード（ホバー） | `shadow.card.hover` |
| モーダル | `shadow.modal` |
| チップ | `shadow.chip.default` |

### 余白

| サイズ | 値 | 用途 |
|--------|-----|------|
| xs | 4px | 要素内の細かい余白 |
| sm | 8px | 関連要素間 |
| md | 16px | セクション内 |
| lg | 24px | セクション間 |
| xl | 32px | 大きな区切り |

---

## フレーム命名規則

```
セクション名 / 画面名
セクション名 / 画面名（状態）
```

### 例

```
Scenarios / 検索画面
Scenarios / 検索画面（空状態）
Scenarios / 検索画面（詳細条件展開）
Scenarios / 詳細画面

Sessions / 一覧画面
Sessions / 作成画面

Feedback / 一覧画面
Feedback / 詳細画面
Feedback / 投稿モーダル

Components                    # 共通コンポーネント定義
```

---

## Pencil MCPツール早見表

| ツール | 用途 | 使用タイミング |
|--------|------|---------------|
| `get_editor_state` | エディタ状態確認 | 最初に実行 |
| `open_document` | ファイルを開く | Phase 1 |
| `get_guidelines` | ガイドライン取得 | Phase 1 |
| `get_style_guide` | スタイルガイド取得 | Phase 1（任意） |
| `find_empty_space_on_canvas` | 空きスペース探索 | 各画面作成前 |
| `batch_design` | デザイン操作 | メイン作業 |
| `batch_get` | ノード取得 | 確認・修正時 |
| `get_screenshot` | スクリーンショット | 確認時 |
| `snapshot_layout` | レイアウト確認 | デバッグ時 |

---

## 修正依頼への対応

ユーザーから修正依頼があった場合:

1. **具体的な指示を確認**
   - 「カードの影をもっと強く」→ shadow トークンを変更
   - 「余白を広げて」→ padding/margin を調整
   - 「色を変えて」→ fill を変更

2. **該当ノードを特定**
   - `batch_get` でノードIDを取得
   - `snapshot_layout` でレイアウト構造を確認

3. **batch_designで修正**
   ```typescript
   batch_design({
     operations: `
       U("nodeId", {
         fills: [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.95 } }]
       })
     `
   })
   ```

4. **再度スクリーンショットで確認**

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/requirements/requirements-*.md` | 要件定義書 |
| `ui-design-system` メモリ | デザインシステム |
| `user-personas` メモリ | ペルソナ情報 |
| `docs/designs/*.pen` | デザインファイル |
| `CLAUDE.md` | プロジェクト方針 |

---

## トラブルシューティング

### デザインファイルが開けない

```typescript
// 新規作成
open_document('new')

// または既存ファイルのパスを確認
ls docs/designs/
```

### 要素がはみ出す

- 親フレームのサイズを確認
- `clipsContent: true` を設定して切り抜き

### 色が反映されない

- セマンティックトークンではなくRGB値で指定
- `fills` 配列の形式を確認

---

## 次のフェーズへの引き継ぎ

デザイン完了後、以下を伝達:

```
デザインが完了しました。

📁 デザインファイル: docs/designs/scenarios.pen
📐 作成画面: Feedback / 一覧画面, 詳細画面, 投稿モーダル

次のフェーズ:
/component-spec feedback  # コンポーネント仕様を作成（任意）
/gen-test feedback        # テスト生成（TDD Red フェーズ）
```
