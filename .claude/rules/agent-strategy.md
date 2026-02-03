# Agent Strategy

## サブエージェントの活用（必須）

**複雑なタスクでは必ずサブエージェントを使用すること。** 直接ファイルを大量に読むより効率的。

| サブエージェント | 用途 | 使用タイミング |
|-----------------|------|---------------|
| `Explore` | コードベース探索・検索 | ファイル構造把握、実装箇所の特定 |
| `Plan` | 実装計画の設計 | 複雑な機能の設計前 |
| `code-reviewer` | コードレビュー | 実装完了後の品質確認 |
| `serena-expert` | 構造化されたアプリ開発 | 複数ファイルにまたがる実装 |
| `ui-expert` | UI/UX改善 | 既存UIの分析・改善 |
| `ui-implementer` | UI実装 | 新規UI機能の実装 |
| `playwright-test-fixer` | 機能テスト＆修正 | UIの動作確認と問題の自動修正 |
| `tdd-implementer` | TDD Green実装 | 失敗テストを通す実装（自律実行） |
| `tdd-refactorer` | TDD Refactor | テスト維持しながら品質改善（自律実行） |

## Worktree運用（概要）

このプロジェクトでは `git worktree` + `/vibe` コマンドで複数のClaude Codeが並行作業可能。

**詳細は `/vibe` スキルを参照。**

主なコマンド:
- `/vibe start feature/xxx` - worktree作成
- `/vibe clean` - worktree削除
- `/vibe list` - worktree一覧

## タスク完了時のコミット（必須）

**タスクが完了したら必ずコミットを作成すること。**

1. `pnpm check` でlint/format確認
2. `pnpm build` でビルド確認（必要に応じて）
3. 変更をステージング
4. Conventional Commits形式でコミット

## バックグラウンドプロセスの終了（必須）

**開発サーバーやその他のバックグラウンドプロセスは、使用後に必ず終了すること。**

```bash
# ポート使用状況の確認（Windows）
netstat -ano | findstr :3000

# プロセスの強制終了（Windows）
cmd //c "taskkill /PID <PID> /F"
```

## agent-browserの終了（必須）

**agent-browserを使用したら、作業完了後に必ず`agent-browser close`で終了すること。**

理由: ヘッドレスChromeを起動するため、閉じずに放置するとメモリを大量消費する。

## Claude Codeプロセスの定期チェック（必須）

サブエージェントのプロセスがセッション終了後も残り、メモリを大量消費する場合がある。

```bash
# プロセス数の確認
tasklist | findstr "claude" | find /c /v ""

# 異常に多い場合（10以上）は不要なプロセスを終了
taskkill /IM claude.exe /F
```

**チェックタイミング**:
- サブエージェントを3回以上使った後
- メモリ使用量が高いと感じた時
- セッション終了前

## 開発サーバー起動時のポート管理（必須）

**`pnpm dev`で3000番以外のポートが使われた場合:**

1. 既存のNext.jsサーバーがあれば再利用する
2. 3000番を使用しているプロセスを停止して起動し直す

```bash
# 3000番ポートの使用状況を確認
netstat -ano | findstr ":3000" | findstr "LISTENING"

# 該当プロセスを停止
cmd //c "taskkill /PID <PID> /F"

# サーバーを再起動
pnpm dev
```

**理由**: 複数の開発サーバーを起動するとSupabaseの接続プールを使い果たし、`MaxClientsInSessionMode`エラーが発生する。

## タスクの細分化

- 複雑なタスクは小さなサブタスクに分解する
- TodoWriteツールで進捗を管理する
- 各サブタスクに最適なサブエージェントを選定

## 継続的最適化

- 永続的・基盤的な指示を受けた場合、CLAUDE.mdに追記して知識を蓄積
- プロジェクト固有のパターンや方針を学習し、より効率的な開発を目指す
