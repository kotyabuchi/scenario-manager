# StorybookでAgentationから修正を依頼する

Storybookの各Storyには、開発時だけAgentationのフィードバックツールバーを表示する。画面上の要素を選んで修正内容を書くと、その注釈はローカルのAgentation MCPサーバーに同期される。Codexには「StorybookのAgentationで未対応の指摘を修正して」と依頼する。注釈を付けただけではCodexの作業は自動で始まらない。

## 初回の接続

このリポジトリの `.codex/config.toml` にMCP設定がある。WindowsのCodex CLIで `codex mcp get agentation` に表示されない場合は、次のコマンドでユーザー設定にも登録する。

```powershell
codex mcp add agentation -- cmd /c npx -y agentation-mcp@1.2.0 server
codex mcp get agentation
```

MCPの登録後は新しいCodexタスクを開始する。すでに実行中のタスクにMCPツールは追加されない。Agentation MCPはローカルの `127.0.0.1:4747` を使用するため、別のプロセスがそのポートを使っている場合は停止する。

## 注釈を付ける

1. `pnpm storybook` を実行し、`http://127.0.0.1:6006` を開く。ローカルのStorybookを使う。
2. 対象のStoryをCanvasで開く。右下のAgentationを開始し、対象要素を選択して修正内容を入力する。ツールバーに `MCP Connected` が表示されることを確認する。
3. Codexに「StorybookのAgentationで未対応の指摘を修正して」と依頼する。特定のStoryだけならStory名やStory IDも添える。
4. Codexが実装とテストを確認した後、対応できた注釈を解決済みにする。注釈の誤解や判断が必要な場合は、未対応のまま理由を返す。

Storybook CanvasのURLには `/__agentation__/story/<Story ID>/iframe.html?id=<Story ID>` が含まれる。同じStoryを開き直すとそのStoryの注釈を再表示でき、別のStoryの注釈は混ざらない。このURLは開発サーバー専用で、静的なStorybookビルドではツールバーを表示しない。

## 接続の確認

`MCP Connected` が出ない場合は `http://127.0.0.1:4747/health` を開き、MCPサーバーが起動しているか確認する。Codex側にツールが見えない場合は `codex mcp get agentation` と新しいCodexタスクでのツール一覧を確認する。StorybookのStoryを切り替えた後も、注釈URLのStory IDと対象Storyが一致しているか確認する。

開発用Storybookを同じ作業ツリーから複数同時に起動すると、Viteの依存関係キャッシュが競合してReactのフックエラーになることがある。`pnpm storybook` は6006番が使用中なら終了する。表示が崩れた場合は余分なStorybookプロセスを止め、1つだけ起動し直してからページをリロードする。

Agentationの注釈には要素や周辺テキストも含まれるが、DOMパスはUI変更で変わる。修正時はStoryと実装を見て意図を判断し、関連する状態も検証する。
