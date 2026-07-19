---
name: codex-implement
description: >
  Codex CLI に実装させるハーネスを起動する。メインの Claude(Opus) がコーディングプロンプトを作り、
  Sonnet ドライバー経由で Codex に実装させ、自動ゲート(check/vitest/build)→/review-diff→差し戻し
  (最大3ラウンド)を回し、通過したらメインに戻してコミットする。
  「Codexで実装して」「Codexに作らせて」「codex-implement」で起動。
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
  - Skill
  - Edit
  - Write
---

# codex-implement — Codex ハーネスの起動

**フローの正典は `.claude/rules/codex-harness.md`。このスキルはその操作手順（トリガー）**。詳細判断（役割・モデル・ゲート・ループ制御）は必ず codex-harness.md に従うこと。ここでは重複定義しない。

## 前提チェック（起動時）

1. `codex` CLI が使えるか（`codex --version`）。無ければユーザーに導入を促して中断。
2. モデルIDは `.claude/harness/models.json` から読む（本文に直書きしない）。
3. Codex は規約を `AGENTS.md` から参照する。`pnpm gen:agents:check` が通る（同期済み）ことを確認。ドリフトがあれば `pnpm gen:agents` で再生成してから進む。

## 適用判断

`codex-harness.md`「いつ使う / 使わない」に従う。1行修正・typo・軽微なスタイル等は**このスキルを使わず**直接実装する。判断に迷えばユーザーに確認。

## 手順（Opus オーケストレータ）

1. **計画**: 3ファイル or 100行超なら `Plan` で Batch 分割（`plan-mode.md`）。Batch ごとに 実装→ゲート→レビュー→コミット。
2. **コーディングプロンプト作成**: `codex-harness.md` Step 2 のテンプレートに沿って、対象ファイル・受け入れ基準(テスト)・強調規約・「コミットしない」制約を明記。
3. **ドライバー起動**: `Task` で Codex ドライバーを起動（`subagent_type` は Codex ドライバー、`model` は `models.json.codexDriver`）。プロンプトに「codex-harness.md の Step 3〜7 に従え」と、上記コーディングプロンプト、`models.json.implementer.default` のモデルIDを渡す。
   - ドライバーの責務: `codex exec` で実装指示 → 自動ゲート → `/review-diff` → `REVIEW_RESULT` の `blocking` で差し戻し判定（最大3ラウンド、非収束はここへエスカレーション）→ 構造化レポートを返す。
4. **結果受領**: ドライバーの構造化レポート（変更ファイル / テスト結果 / レビュー結果 / 残 non-blocking / ラウンド数）を確認。
5. **最終判断とコミット**: 問題なければ **Opus がコミット**（Conventional Commits、レビュー通過後にコミットの既存規約）。エスカレーションされた場合は自分で修正 / 再スコープ / non-blocking 受容を判断。
6. **後始末**: `codex` / dev server 等の残留プロセスを終了（`agent-strategy.md`）。

## 注意

- **これは Claude 側のオーケストレーション用スキル**。Codex の中で実行するものではない（`.codex/skills` へエクスポートしない）。
- コミットするのは Opus。Codex とドライバーはコミットしない。
- ゲート失敗（lint/型/テスト）は LLM レビューを回さず即 Codex に差し戻す（決定論的な問題に往復を使わない）。
