# Codex ハーネス（Codex CLI 経由の実装フロー）

実装を **Codex CLI** に委ね、メインの Claude（Opus）を中心に **計画 → 指示 → 自動ゲート → レビュー → 差し戻し** を回すハーネス方式。異なるモデル（Codex 実装 / Claude レビュー）のクロスチェックで単一モデルの盲点を消す。

> このルールは **Claude 運用系**（Codex には無関係）。`AGENTS.md` のミラー対象からは除外する。

## 役割とモデル

モデルIDは **`.claude/harness/models.json` を単一ソース**とする（本文に直書きしない。世代交代時は json のみ更新）。

| 役割 | 誰 | models.json キー | 責務 |
|------|----|------------------|------|
| オーケストレータ | メイン Claude | `orchestrator`（opus） | 計画・プロンプト作成・最終判断・**コミット** |
| Codex ドライバー | Sonnet サブエージェント | `codexDriver`（sonnet） | Codex 起動・自動ゲート実行・レビュー起動・差し戻し・ループ運行 |
| レビュアー | `/review-diff` の並列エージェント | `reviewer`（sonnet） | 6観点レビュー（品質判定の目） |
| 実装 | Codex CLI | `implementer`（gpt-5.6-sol 他） | コード実装 |

**ドライバーは「品質の判定者」ではなく「運行管理者」**。品質の目は決定論ツール（Biome/テスト）＋ `/review-diff` が担う。

## いつ使う / 使わない

| 使う | 使わない（Claude が直接実装） |
|------|------|
| 新機能・まとまった実装（複数ファイル/ロジック） | 1行修正・typo・軽微なスタイル調整 |
| 明確な受け入れ基準（テスト）が書ける | 往復オーバーヘッドが利得を上回る些細な変更 |
| Batch に分割できる中〜大規模変更 | 対話的な調査・設計（`/serena` 等） |

既存の Claude ネイティブ実装エージェント（`tdd-implementer` / `serena-expert` / `ui-implementer`）は Claude が自分で実装する経路として存続。本ハーネスは **Codex に実装させる経路**。どちらを使うかはタスク性質で選ぶ。

### トリガー: 該当タスクは既定でハーネス（明示指示を待たない）

**「使う」基準に該当する実装タスクは、ユーザーの明示指示（`/codex-implement` 等）が無くても、オーケストレータが既定でハーネスを起動する**（2026-07-20 ユーザーの恒久承認）。

- これは「サブエージェントはユーザーが求めない限り起動しない」という標準ガイダンスに対する、本ハーネスに限った**恒久的な起動承認**。該当タスクごとに「ハーネスで回すか」を確認する必要はない。
- 「使わない」側（軽微・調査・設計）は従来どおり Claude が直接。判断に迷う境界例のみ確認する。
- ハーネスを回さず直接実装する場合は、その理由を一言添える（例: ハーネス不調・外部依存でCodex不可）。

## 全体フロー

```
[Opus] タスク受領
  → (3ファイル/100行超なら Plan で計画・Batch 分割: plan-mode.md)
  → コーディングプロンプト作成（受け入れ基準=テストを明記）
  ↓ Agent(subagent_type=codexドライバー, model=sonnet)
[Sonnet ドライバー]
  → codex exec で実装指示（Codex は AGENTS.md で規約を参照）
  ↓
[Codex] 実装（in-place。コミットはしない）
  ↓
[自動ゲート] pnpm check → pnpm vitest → (構造変更なら pnpm build)
  │  ├─ NG → 失敗内容を Codex に差し戻し（同一セッション継続）※LLMレビューは回さない
  │  └─ OK ↓
[レビュー] /review-diff（未コミット差分を6観点。small=シリアル/large=並列を自動判定）
  │  ├─ blocking(必須) あり → 指摘を Codex に差し戻し（同一セッション）
  │  └─ blocking なし ↓
[Sonnet ドライバー] → [Opus] へ構造化レポート（変更点/テスト結果/レビュー結果/残 non-blocking）
  ↓
[Opus] 最終判断 → コミット（レビュー通過後にコミットする既存規約と一致）
```

## 各ステップ詳細

### Step 1. 計画（Opus）
- 3ファイル or 100行を超える見込みなら `Plan`（`plan-mode.md`）。Batch 単位に分割し、**Batch ごとに 実装→ゲート→レビュー→コミット**（`plan-mode.md` の Batch チェックポイント）。

### Step 2. コーディングプロンプト作成（Opus）
Codex に渡すプロンプトのテンプレート（Codex は `AGENTS.md` を自動参照するので規約は全文再掲しない。**タスク固有の要点のみ**）:

```
## タスク
<何を実装するか。1機能=1タスク>

## 対象ファイル / 配置
<新規・変更するファイルパスと責務。既存パターン（page.tsx/adapter.ts/interface.ts/styles.ts）に従う>
<テストの配置を明示する（既存の配置規約に従わせ、vitest.config を勝手に編集させない）>

## 受け入れ基準（必須）
- <通すべきテスト。既にあるなら パス、無ければ TDD で先に書く>
- pnpm check / pnpm vitest / (必要なら pnpm build) が通ること（ゲートはドライバーが実行）

## 特に注意する規約（AGENTS.md 参照。該当分を強調）
- <例: Result型・isNil / 楽観的更新 / styles.ts分離 / @phosphor-icons/react/ssr / LogTape / トークンは semantic 参照>

## 制約
- コミットはしない（差分は未コミットのまま残す）
- 生成物（styled-system 等）は編集しない。トークン変更時は pnpm prepare
```

### Step 3. ドライバー起動（Opus → Sonnet subagent）
- `Agent` で Codex ドライバーを起動（model は `models.json` の `codexDriver`）。
- 初回実装: `codex exec -s workspace-write -m <models.json.implementer.default> <prompt>`（`-s workspace-write` でワークスペース書込を許可。プロンプトは引数 or stdin）。
- **差し戻し（同一セッション継続）**: `codex exec resume --last -c sandbox_mode="workspace-write" <prompt>` を使う。
  - 注意: `resume` サブコマンドは `-s` を受け付けない。sandbox は **`-c sandbox_mode="..."`** で指定する（`--last` は直近セッション、`SESSION_ID` 指定も可）。
  - resume はセッションの文脈（前回何を実装したか）を保持するため、レビュー/ゲートの指摘だけを渡せば足りる。

### Step 4. Codex 実装
- リポジトリの作業ツリー上で **in-place** に実装（既定。worktree は使わない）。
- **Codex はコミットしない**。差分は未コミットで残す（後段の `/review-diff` が HEAD からの未コミット差分を見るため）。

### Step 5. 自動ゲート（ドライバー、決定論）
- 順に `pnpm check`（Biome）→ `pnpm vitest`（関連テスト）→ 構造変更があれば `pnpm build`。
- **ゲートはドライバーが実行する**（Codex のサンドボックス下では Biome 実行が `EPERM` で失敗するため、Codex の自己検証には依存しない）。`pnpm check` は `--write` で Biome の自動整形も適用される（セミコロン付与等）。
- **1つでも失敗 → LLM レビューを回さず、失敗ログを Codex に差し戻す**（lint/型/テストが拾う問題に高価なレビュー往復を使わない）。
- 全通過 → Step 6。

### Step 6. レビュー（ドライバー → `/review-diff`）
- 未コミット差分を `/review-diff` でレビュー（`code-reviewer` は非推奨・使わない）。
- 判定は `/review-diff` が最終行に出力する **`REVIEW_RESULT ... blocking=<N>`** をパースする。`blocking>0` → 必須指摘をCodexに差し戻し、`blocking=0` → 通過。**推奨/検討(non-blocking)** ではループしない。

### Step 7. ループ制御
- **1ラウンド = ゲート＋レビュー**。差し戻しは同一 Codex セッションへ、指摘（ゲート失敗ログ or 必須findings）を具体的に渡す。
- **最大3ラウンド**。3ラウンドで blocking が収束しない、または指摘が振動（A直すとB壊れる）する場合は **Opus へエスカレーション**（残 findings と経緯を添えて）。Opus が「自分で直す / 再スコープ / non-blocking として受容」を判断。
- 各ラウンドの diff とレビュー verdict を記録し、Opus の最終判断材料にする。

### Step 8. 完了報告とコミット
- ドライバーは Opus へ**構造化レポート**（変更ファイル / テスト結果 / レビュー結果 / 残 non-blocking / ラウンド数）を返す。
- **コミットは Opus が行う**（レビュー通過後にコミットする既存規約 `plan-mode.md` と一致）。Conventional Commits。

## Codex への規約供給
- Codex はリポジトリルートの **`AGENTS.md`** を自動参照する。これは `.claude/rules/` の全文を埋め込んだ生成物（`scripts/gen-agents-md.mjs`、lefthook で自動同期）。
- 規約を変えるときは `.claude/rules/*.md` を編集 → `AGENTS.md` は自動再生成される。**Codex 用に別途規約を書かない**（単一ソース）。

## 実行環境
- **既定は in-place**（現ブランチの作業ツリーで直接実行）。本ハーネスは順次実行（Opus が待つ）で並行編集の衝突が起きないため、worktree の隔離は不要。
- **worktree はオプトイン**（本当に Codex を並列で複数走らせる時のみ）。その場合は `.env*` 等の非追跡ファイルをコピーする setup を明示的に行う。

## プロセス後始末（`agent-strategy.md` 準拠）
- Codex CLI / dev server 等のバックグラウンドプロセスを使用後に終了する。
- ドライバー（サブエージェント）多用後は Claude/Codex の残留プロセスを確認・終了。

## 参照
- モデルID: `.claude/harness/models.json`
- Codex 規約ミラー: `AGENTS.md`（生成器 `scripts/gen-agents-md.mjs` / `pnpm gen:agents`）
- レビュー: `/review-diff`（`.claude/skills/review-diff/`）
- 計画・Batch: `plan-mode.md` / プロセス管理: `agent-strategy.md`
