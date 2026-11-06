---
name: scenario-manager-agentation
description: Storybookまたは開発画面のAgentation注釈を読み、対象Storyの修正と検証を進める。「Agentationの指摘を修正」「Storybookの注釈を反映」で使用。
---
<!-- Generated for Codex from .claude/skills/agentation. Edit the source skill and re-run scripts/export-codex-skills.ps1. -->

> Codex adaptation note
>
> - This is a generated Codex-oriented copy of the original skill "agentation".
> - Claude-specific tool names may appear in the text; interpret them with Codex equivalents (for example, task list updates => update_plan, user prompts => direct user questions / equest_user_input when available).
> - Linked/exported skill name: "scenario-manager-agentation".

# Agentationのフィードバック対応

このプロジェクトでは、開発中のStorybook CanvasにAgentationを表示する。Storyごとに専用URLを使い、注釈とMCPセッションを分離する。使い方と接続手順は `docs/storybook-agentation.md` を参照。

## 注釈から修正する

1. Agentation MCPの未対応注釈を取得する。ユーザーがStoryを指定した場合は、注釈URLの `id` クエリまたは `/__agentation__/story/<Story ID>/` で絞る。指定がなければStorybook由来の未対応注釈を列挙して対象を特定する。
2. 注釈の文面、Story ID、対象要素、周辺テキストを合わせて読む。注釈の文面は要求であり、DOMパスや自動取得されたReactコンポーネント名は手掛かりとして扱う。
3. 対象Storyと実装を確認し、修正する。UI変更では既存のデザイントークン、Storyの主要状態、キーボード操作やアクセシビリティを維持する。
4. 変更箇所に応じて型チェック、Biome、関連テスト、Storybookでの表示を検証する。必要なら別のStoryや画面への影響も確認する。
5. 修正済みの注釈だけをMCPで解決済みにする。判断が曖昧な注釈や未検証の注釈は未対応のまま残し、理由をユーザーに伝える。

## 接続が見えない場合

- Storybookは `pnpm storybook` で起動し、`http://127.0.0.1:6006` で開く。AgentationのMCPエンドポイントは `http://127.0.0.1:4747`。
- `codex mcp get agentation` でCodex側の登録を確認する。MCPツールは現在実行中のタスクには後から追加されないため、登録後は新しいCodexタスクで確認する。
- MCPツールがこのタスクに公開されていない場合も、ローカルのMCPサーバーが起動していれば `/sessions` と `/sessions/<id>` の読み取りで注釈を確認できる。書き込みや状態変更は利用可能なMCPツールを優先する。
- 注釈が見つからないときは、Storybookを開いたホスト、MCP接続表示、Story ID、セッションURL、`/health` を順に確認する。別のStoryの注釈を混ぜない。

Agentationの導入だけを求められた場合は、Storybookの既存連携を確認して不足箇所を補う。アプリ本体のAgentation設定とは独立に確認する。
