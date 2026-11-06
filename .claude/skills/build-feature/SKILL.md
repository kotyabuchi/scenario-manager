---
name: build-feature
description: >
  機能名やPROGRESS.mdのタスク名を元に、計画策定→codex-debateクロスレビュー→ユーザー承認→Batch単位実装を一貫して実行する。
  各Batchチェックポイントでcodex-debateとreact-doctorを活用して品質を担保する。
  「機能を開発して」「build-feature」「プラン立てて実装して」で起動。
argument-hint: "[機能名 | PROGRESS.mdのタスク名]"
---

# Build Feature — 計画駆動の機能開発オーケストレーター

機能名や PROGRESS.md のタスク名から、計画策定 → クロスモデルレビュー → ユーザー承認 → Batch単位の実装を一貫して管理する。
各 Batch のチェックポイントで `/codex-debate` と `/react-doctor` を実行し、品質を継続的に担保する。

## When to Use

- 新機能の開発を計画段階から一貫して進めたい
- PROGRESS.md の未着手タスクに着手したい
- codex-debate によるクロスレビューを計画・実装の両段階で活用したい

## Prerequisites

- Codex CLI がインストール済み（`npm i -g @openai/codex`）
- Codex CLI の認証が完了していること

---

## Phase 1: タスクの特定

### Step 1-1: 入力の解析

`$ARGUMENTS` からタスクを特定する。

| 入力 | 解釈 |
|------|------|
| 機能名（例: `参加申請承認画面`） | PROGRESS.md と要件定義書を検索して関連タスクを特定 |
| PROGRESS.md のセクション名（例: `#10`） | 該当セクションのタスク内容を抽出 |
| 空 | PROGRESS.md の「次のアクション」セクションから候補を提示し AskUserQuestion で選択 |

### Step 1-2: コンテキスト収集

タスクに関連する情報を収集する:

1. **PROGRESS.md** — 該当タスクの状態、TODO リスト、関連ファイル
2. **要件定義書** — `.claude/requirements/` 内の関連ドキュメント
3. **モックデザイン** — `docs/designs/mocks/` 内の関連デザイン（UI タスクの場合）
4. **既存実装** — 関連する既存コードの探索（Explore エージェント使用）

### Step 1-3: スコープの確認

収集した情報をもとに、タスクのスコープをユーザーに提示する:

```
## タスク: {タスク名}

**規模**: {小（1-2ファイル） / 中（3-5ファイル） / 大（6ファイル以上）}
**UI変更**: {あり / なし}
**関連要件**: {要件定義書パス or 「なし」}

### スコープ
{実装する内容の箇条書き}
```

**規模が「小」の場合**: Plan は不要。直接実装（TDD or `/fix-bug`）を提案して終了。
**規模が「中」以上の場合**: Phase 2 に進む。

---

## Phase 2: 計画策定

### Step 2-1: Plan エージェントによる計画作成

Agent ツールで `Plan` サブエージェントを起動し、計画書を作成させる。

**Plan エージェントに渡すコンテキスト:**
- Phase 1 で収集した要件定義・モック・既存コードの情報
- `.claude/templates/plan-template.md` のフォーマット指定
- `.claude/rules/plan-mode.md` の Batch 粒度ガイドライン
- 出力先: `docs/plans/{機能名}.md`

**計画書の要件:**
- `plan-template.md` のフォーマットに準拠
- 各 Batch に `### Review Checkpoint` を含む
- Batch 粒度: ファイル 3-8、変更行数 100-300、Step 2-5（上限超えなら分割）

### Step 2-2: 計画書の確認

作成された計画書を Read で確認し、フォーマットの準拠を検証する:
- Batch/Step の命名規則が正しいか
- Review Checkpoint が各 Batch に含まれているか
- ファイル一覧・検証方法が記載されているか

不備があれば修正する。

---

## Phase 3: 計画のクロスレビュー

### Step 3-1: codex-debate による計画レビュー

Skill ツールで `/codex-debate --plan docs/plans/{機能名}.md` を実行する。

codex-debate が計画書モードで実行され、Codex と Claude の両視点から計画をレビューする。
レビュー結果は `docs/reviews/codex-debate-YYYY-MM-DD.md` に出力される。

### Step 3-2: レビュー結果の反映

codex-debate の改善計画に従って計画書が自動修正される（codex-debate が実施）。
修正後の計画書を Read で確認する。

---

## Phase 4: ユーザー承認

### Step 4-1: 計画サマリーの提示

計画書の概要をユーザーに提示する:

```
## 計画: {タイトル}

### Batch 構成
| Batch | 内容 | 推定ファイル数 | 推定行数 |
|-------|------|:------------:|:-------:|
| 1 | {概要} | N | ~NNN |
| 2 | {概要} | N | ~NNN |

### codex-debate レビュー結果
- 総合評価: {A/B/C/D}（`docs/reviews/` 参照）
- 採用指摘: N件
- 重要な改善: {1-2行で要約}

### 品質チェックポイント
各 Batch 完了時に以下を実行:
1. pnpm check + pnpm vitest
2. /codex-debate（変更差分のクロスレビュー）
3. /react-doctor（React ベストプラクティス診断）
```

### Step 4-2: 承認の取得

AskUserQuestion で確認:
- 「この計画で実装を開始しますか？」
- options:
  - 「開始する」— Phase 5 に進む
  - 「計画を修正してから」— Phase 2 に戻る（修正点をヒアリング）
  - 「中止する」— 終了

---

## Phase 5: Batch 単位の実装

### Step 5-1: TodoList の作成

計画書を解析し、TaskCreate で TodoList を登録する。
登録ルールは `/exec-plan` の Step 3 に準拠:

- **Batch**: 親タスクとして登録
- **Step**: 個別タスクとして登録（`addBlockedBy` で順序設定）
- Batch 間も順序関係を設定

**追加タスク**: 各 Batch の末尾に品質チェックタスクを追加:
- subject: `[QA] Batch N 品質チェック（codex-debate + react-doctor）`
- description: `Batch N の全 Step 完了後に品質チェックを実行`
- activeForm: `Batch N の品質チェック実行中`

### Step 5-2: Step の実行

各 Step を順番に実行する。実行方法は `/exec-plan` の Step 4 に準拠:

| タスクの内容 | 使用するサブエージェント |
|---|---|
| テストコードの作成 | `tdd-implementer` エージェント |
| UI コンポーネントの実装 | `ui-implementer` エージェント |
| 複数ファイルにまたがる実装 | `serena-expert` エージェント |
| 1-2ファイルの小さな変更 | 直接編集 |
| リファクタリング | `tdd-refactorer` エージェント |

各 Step 完了後:
1. `pnpm check` で lint/format 確認
2. 必要に応じて `pnpm vitest run` でテスト実行
3. TaskUpdate でステータスを `completed` に変更

### Step 5-3: Batch 品質チェックポイント（核心）

**Batch 内の全 Step が完了したら、コミット前に以下の品質チェックを実行する。**

#### 5-3a. 基本チェック

```bash
pnpm check
pnpm vitest
```

失敗があれば修正してから次に進む。

#### 5-3b. codex-debate クロスレビュー

Skill ツールで `/codex-debate --diff` を実行する。

codex-debate が差分モードで実行され、このBatchで導入された変更をCodexとClaudeの両視点でレビューする。
改善が自動実装された後、再度 `pnpm check` と `pnpm vitest` で検証する。

**スキップ条件**: Batch の変更が少ない場合（ファイル数 ≤ 3 かつ 変更行数 ≤ 50）はスキップ可。

#### 5-3c. react-doctor 診断

Skill ツールで `/react-doctor` を実行する。

react-doctor がブランチ差分のReactベストプラクティス違反を検出・修正する。
自動修正後、確認が必要な指摘はユーザーに提示する。

**スキップ条件**: Batch に React コンポーネントの変更が含まれない場合はスキップ。

#### 5-3d. コミット

品質チェック通過後、Skill ツールで `/commit` を実行する。
コミットメッセージは Batch 単位の Conventional Commits 形式。

#### 5-3e. 次の Batch へ

TaskUpdate で Batch タスクと品質チェックタスクを `completed` に変更し、次の Batch に進む。

### Step 5-4: 最終 Batch の品質チェック

最終 Batch では、変更量に関わらず codex-debate と react-doctor を**必ず実行する**。

---

## Phase 6: 完了

### Step 6-1: 完了報告

全 Batch 完了後、実装結果のサマリーをユーザーに報告する:

```
## 完了: {タスク名}

### 実装結果
- Batch 数: {N}
- 完了 Step 数: {N} / {M}
- 変更ファイル数: {N}

### 品質チェック結果
| Batch | codex-debate | react-doctor | テスト |
|-------|:-----------:|:------------:|:-----:|
| 1 | PASS | 100点 | PASS |
| 2 | PASS | 98点 | PASS |

### コミット履歴
{git log --oneline の出力}
```

### Step 6-2: PROGRESS.md の更新

PROGRESS.md の該当タスクのステータスを更新する:
- `⬜` → `✅` に変更
- 作業ログに完了日時と内容を追記

---

## Error Handling

| 状況 | 対応 |
|------|------|
| Plan エージェントが計画作成に失敗 | エラー内容を報告し、手動で計画を作成するか確認 |
| codex-debate（Codex CLI）が使えない | Claude 単独レビュー（`/review-plan` or `/review-diff`）にフォールバック |
| react-doctor でスコアが低い | 自動修正を試行。3回試行で改善しない場合はユーザーに報告 |
| Step の実装に失敗 | エラー内容を報告し、ユーザーの指示を待つ |
| pnpm check / vitest が失敗 | 修正を試みる。3回失敗したらユーザーに報告 |
| ユーザーが計画を却下 | 修正点をヒアリングし、Phase 2 に戻る |

## Notes

- **フォールバック**: Codex CLI が利用不可の場合、codex-debate → `/review-plan` + `/review-diff` に自動切り替え
- **中断と再開**: TodoList は永続化されるため、途中で中断しても再開可能
- **小規模タスク**: Phase 1 で規模「小」と判定された場合は Plan を作成せず直接実装を提案
- **既存計画の実行**: `docs/plans/` に計画書が既にある場合、Phase 2 をスキップして Phase 3 から開始可能
- **品質チェックの段階性**: Batch の変更量に応じてチェックの厳しさを調整（少量→スキップ可、最終Batch→必須）
