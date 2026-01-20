# vibe - Git Worktree管理コマンド

このコマンドは、vibeツールを使ってgit worktreeを簡単に管理します。

## 使い方

```
/vibe start <branch> [base-branch]  - 新しいworktreeを作成（base-branchを指定可能、デフォルト: develop）
/vibe clean                         - 現在のworktreeを削除してメインに戻る
/vibe list                          - worktree一覧を表示
```

## システムプロンプト

あなたはvibeツールのラッパーコマンドです。以下のルールに従ってください：

1. **vibeコマンドの実行**
   - vibeは `$env:LOCALAPPDATA\vibe.exe` にインストールされています
   - Bashツールで実行してください：`"$LOCALAPPDATA/vibe.exe" <args>`

2. **サブコマンド**

   - **start <branch> [base-branch]**: 新しいworktreeを作成

     **デフォルト（developから作成）：**
     ```bash
     # 1. developから新しいブランチを作成
     git branch <branch> develop

     # 2. vibeで既存ブランチを使う
     "$LOCALAPPDATA/vibe.exe" start <branch> --reuse
     ```

     **ベースブランチを明示的に指定する場合：**
     ```bash
     # 1. 指定したベースブランチから新しいブランチを作成
     git branch <branch> <base-branch>

     # 2. vibeで既存ブランチを使う
     "$LOCALAPPDATA/vibe.exe" start <branch> --reuse
     ```

     - `.vibe.toml`の設定に従って、環境変数ファイルと.claude設定を自動コピー
     - `pnpm install`を自動実行
     - 作成後、推奨ポート番号を表示（3001, 3002...）

   - **clean**: 現在のworktreeを削除
     ```bash
     "$LOCALAPPDATA/vibe.exe" clean
     ```
     - 確認プロンプトが表示される場合があります

   - **list**: worktree一覧を表示
     ```bash
     git worktree list
     ```

3. **実行後のガイド**

   `vibe start`実行後は、以下を表示してください：

   ```
   Worktreeが作成されました！

   次のステップ:
   1. 新しいターミナルを開く
   2. cd <worktree-path>
   3. pnpm dev --port <推奨ポート>
   4. Claude Codeを起動

   作業完了後:
   /vibe clean で削除してください
   ```

4. **エラーハンドリング**
   - vibeがインストールされていない場合は、インストール方法を案内
   - `.vibe.toml`が存在しない場合は警告

## 例

### 例1：ベースブランチ指定なし（developから作成、デフォルト）

ユーザー: `/vibe start feature/new-ui`

アシスタント:
1. `git branch feature/new-ui develop` を実行（ブランチ作成）
2. `"$LOCALAPPDATA/vibe.exe" start feature/new-ui --reuse` を実行
3. 成功メッセージと次のステップを表示
4. 既存worktreeの数から推奨ポート（3001など）を計算して表示

### 例2：ベースブランチを明示的に指定（mainから作成）

ユーザー: `/vibe start hotfix/urgent-fix main`

アシスタント:
1. `git branch hotfix/urgent-fix main` を実行（ブランチ作成）
2. `"$LOCALAPPDATA/vibe.exe" start hotfix/urgent-fix --reuse` を実行
3. 成功メッセージと次のステップを表示
4. 既存worktreeの数から推奨ポート（3001など）を計算して表示
