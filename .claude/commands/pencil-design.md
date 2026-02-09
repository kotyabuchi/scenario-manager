---
allowed-tools: Read, Glob, Grep, AskUserQuestion, mcp__serena__read_memory, mcp__serena__list_memories, mcp__pencil__batch_design, mcp__pencil__batch_get, mcp__pencil__get_editor_state, mcp__pencil__get_guidelines, mcp__pencil__get_screenshot, mcp__pencil__get_style_guide, mcp__pencil__get_style_guide_tags, mcp__pencil__find_empty_space_on_canvas, mcp__pencil__snapshot_layout, mcp__pencil__open_document
description: 要件定義を元にPencilでUIデザインを作成する。新機能の画面デザインやUIコンポーネントの設計に使用。
---

# /pencil-design コマンド

## 概要

**TDD開発フローのUIデザインフェーズを担当するスキル**

要件定義書を元に、Pencil MCPツールを使用して`.pen`ファイルでUIデザインを作成する。
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

## 前提条件

1. **Pencil MCPサーバーが利用可能であること**
   - `.mcp.json` に pencil MCP が設定済み

2. **対象の`.pen`ファイルが開かれていること**（任意）
   - `get_editor_state` で確認可能
   - ファイルがない場合は `open_document('new')` で新規作成

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

#### Step 1.2: 要件の特定

$ARGUMENTS を解析:

1. **要件定義書名が指定された場合**: `.claude/requirements/requirements-{名前}.md` を読み込む
2. **ファイルパスが指定された場合**: そのファイルを読み込む
3. **自然言語で指定された場合**: 要件定義書を検索して該当箇所を特定
4. **指定なしの場合**: AskUserQuestion で選択

#### Step 1.3: Pencil接続の確認

1. `mcp__pencil__get_editor_state` で現在の状態を確認
2. `.pen`ファイルが開かれているか確認
3. ファイルがない場合は `mcp__pencil__open_document('new')` で新規作成

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
```

#### Step 2.2: フレーム命名規則の確認

```
セクション名 / 画面名

例:
Feedback / 一覧画面
Feedback / 一覧画面（空状態）
```

#### Step 2.3: デザイン計画の確認

**ユーザーに確認（AskUserQuestion）** して作成順序と優先度を決定する。

---

### Phase 2.5: デザイン着手前チェック（必須・省略禁止）

#### Step 2.5.1: スタイルガイドの取得

1. `mcp__pencil__get_style_guide_tags` でタグ一覧を取得
2. `mcp__pencil__get_style_guide` でデザインに適したスタイルガイドを取得
3. `mcp__pencil__get_guidelines(topic='tailwind')` でTailwindガイドラインを取得

#### Step 2.5.2: 既存デザインの参考調査

1. `mcp__pencil__batch_get` で既存ノードを検索し、近い画面を特定
2. `mcp__pencil__get_screenshot` でスクリーンショットを取得して品質基準を確認
3. `mcp__pencil__snapshot_layout` で内部構造（レイアウト）を確認

#### Step 2.5.3: チェックリスト確認

- [ ] スタイルガイドを取得した
- [ ] 既存デザインのスクリーンショットを確認した
- [ ] 既存デザインのレイアウト構造を確認した

---

### Phase 3: デザイン作成（画面ごとにループ）

#### Step 3.1: キャンバス上の配置位置を決定

```
mcp__pencil__find_empty_space_on_canvas で空きスペースを探す
```

#### Step 3.2: フレームの作成

`mcp__pencil__batch_design` で操作を実行:

```
// フレーム（Board）を作成
frame=I("root", { type: "FRAME", name: "Feedback / 一覧画面", width: 1440, height: 900 })
```

#### Step 3.3: コンポーネントの配置

要件定義書のワイヤーフレーム・UI仕様を参照し、`batch_design` でコンポーネントを配置。

**配置の原則**（ui-design-systemより）:
- ボーダーレス: 境界線は原則使用しない
- 面で区切る: 各情報ブロックは「面」として認識
- 影で階層化: 階層差は影の強弱で表現
- 余白で構造化: 背景色と余白で情報の階層を表現

#### Step 3.4: スクリーンショットで確認

```
mcp__pencil__get_screenshot で作成した画面を確認
```

#### Step 3.5: ユーザーの承認を得る

**ユーザーに確認（AskUserQuestion）** でスクリーンショットを見せ、承認/修正を得る。

**「修正を依頼」の場合**:
- `mcp__pencil__batch_design` の U（Update）操作で修正
- 再度スクリーンショットで確認

#### Step 3.6: 次の画面へ

全画面が完了するまで Step 3.1〜3.5 を繰り返す。

---

### Phase 4: 要件定義への反映確認

デザイン修正の過程で要件定義書に記載されていない内容が追加された場合、要件定義書への反映を確認する。

#### Step 4.1: 要件外の変更を収集

Phase 3 のデザイン作成・修正を通じて追加された内容を一覧化。

#### Step 4.2: ユーザーに反映を確認

**要件外の変更がない場合**: スキップしてPhase 5へ。
**ある場合**: AskUserQuestion で各項目の反映可否を確認。

#### Step 4.3: 要件定義書を更新

承認された項目を要件定義書に追記する。

---

### Phase 5: 完了

#### Step 5.1: 全画面のサマリー

```markdown
## デザイン完了サマリー

### 作成した画面
| 画面名 | ステータス |
|--------|----------|
| Feedback / 一覧画面 | 承認済 |
| Feedback / 詳細画面 | 承認済 |

### 出力先
- Pencilファイル: .pen ファイル
```

#### Step 5.2: 次のステップを案内

```
デザイン作成完了

【次のステップ】
1. デザインの最終確認
2. コンポーネント仕様の作成（任意）: /component-spec feedback
3. テスト生成（TDD Red フェーズ）: /gen-test feedback
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

---

## Pencil MCPツール早見表

| ツール | 用途 | 使用タイミング |
|--------|------|---------------|
| `get_editor_state` | エディタ状態確認 | 最初に実行 |
| `open_document` | ファイルを開く/新規作成 | ファイルがない時 |
| `get_guidelines` | デザインガイドライン取得 | 操作方法を調べる時 |
| `get_style_guide_tags` | スタイルガイドのタグ一覧 | デザイン計画時 |
| `get_style_guide` | スタイルガイド取得 | デザイン計画時 |
| `batch_get` | ノード検索・読み取り | 既存デザイン確認時 |
| `batch_design` | デザイン操作（CRUD） | メイン作業 |
| `get_screenshot` | スクリーンショット取得 | 確認時 |
| `snapshot_layout` | レイアウト構造確認 | 構造確認時 |
| `find_empty_space_on_canvas` | 空きスペース検索 | 配置位置決定時 |

### batch_design 主要操作

```
I("parent", { ... })              // Insert: ノード挿入
C("nodeId", "parent", { ... })    // Copy: ノードコピー
R("nodeId", { ... })              // Replace: ノード置換
U("nodeId", { ... })              // Update: ノード更新
D("nodeId")                       // Delete: ノード削除
M("nodeId", "parent", index)      // Move: ノード移動
G("nodeId", "ai", "prompt")       // Generate: AI画像生成
```

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/requirements/requirements-*.md` | 要件定義書 |
| `ui-design-system` メモリ | デザインシステム |
| `user-personas` メモリ | ペルソナ情報 |
| `CLAUDE.md` | プロジェクト方針 |
