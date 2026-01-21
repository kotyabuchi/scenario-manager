# agent-browser トラブルシューティング

## 問題: Windows環境で "Daemon failed to start" エラー

### 症状

```bash
$ agent-browser open http://localhost:3000
✗ Daemon failed to start
```

### 原因

**根本原因**: Windows版agent-browserの`agent-browser.cmd`が存在しない`dist/index.js`を呼び出そうとしている。

agent-browserのnpmパッケージ（v0.5.0時点）には`dist/index.js`が含まれておらず、代わりにネイティブバイナリ（`agent-browser-win32-x64.exe`）を使用する必要がある。

**関連GitHub Issue**: [#132 - Windows: Daemon failed to start when session port falls in excluded port range](https://github.com/vercel-labs/agent-browser/issues/132)

### 解決方法

#### 手動修正（即座に対応）

`agent-browser.cmd`を以下のように修正する：

**修正前**:
```cmd
@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%..\dist\index.js" %*
exit /b %errorlevel%
```

**修正後**:
```cmd
@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
"%SCRIPT_DIR%agent-browser-win32-x64.exe" %*
exit /b %errorlevel%
```

**ファイルパス**:
```
C:\Users\{USERNAME}\AppData\Roaming\npm\node_modules\agent-browser\bin\agent-browser.cmd
```

#### 自動修正スクリプト

プロジェクトルートに`scripts/fix-agent-browser.js`を配置済み。実行方法：

```bash
node scripts/fix-agent-browser.js
```

このスクリプトは：
- Windows環境かどうかを確認
- agent-browser.cmdの存在を確認
- 既に修正済みかどうかを確認
- 未修正の場合のみ修正を適用

#### 注意事項

**agent-browserをアップデート（`npm update -g agent-browser`）すると、`agent-browser.cmd`が上書きされて再度修正が必要になる。**

アップデート後は必ず以下を実行：

```bash
node scripts/fix-agent-browser.js
```

### 検証方法

修正が正しく適用されているか確認：

```bash
# 1. ページを開く
agent-browser open http://localhost:3000

# 2. スクリーンショットを撮る
agent-browser screenshot test.png

# 3. ブラウザを閉じる
agent-browser close
```

すべてのコマンドが正常に動作すれば修正成功。

### 将来的な解決

この問題はagent-browserのupstream（本家リポジトリ）の問題です。

以下のいずれかで根本的に解決される可能性があります：

1. **agent-browser本体の修正**
   - `dist/index.js`を含める
   - または`agent-browser.cmd`をネイティブバイナリを呼び出すように修正

2. **パッケージングの改善**
   - Windows用のpostinstallスクリプトで自動修正

3. **ドキュメントの充実**
   - 公式ドキュメントにWindows環境での対処法を記載

**関連リンク**:
- [GitHub Issue #132](https://github.com/vercel-labs/agent-browser/issues/132)
- [agent-browser公式リポジトリ](https://github.com/vercel-labs/agent-browser)

---

## その他の既知の問題

### Git Bash環境での動作問題

**Issue**: [#171 - Not working in Claude Code windows git bash](https://github.com/vercel-labs/agent-browser/issues/171)

Git Bash環境では、上記の修正を適用しても動作しない可能性があります。PowerShellまたはコマンドプロンプトからの実行を推奨。

### ポート競合問題

**Issue**: [#132 - Windows excluded port range](https://github.com/vercel-labs/agent-browser/issues/132)

Windowsの除外ポート範囲（50766-50865など）に該当する場合、環境変数でセッション名を変更：

```bash
set AGENT_BROWSER_SESSION=custom
agent-browser open http://localhost:3000
```

### インストール問題

**Issue**: [#170 - Window install failed from source](https://github.com/vercel-labs/agent-browser/issues/170)

ソースからのインストールに失敗する場合は、npmからのインストールを推奨：

```bash
npm install -g agent-browser@latest
agent-browser install  # Chromiumをインストール
```

---

## サブエージェント（ui-expert, ui-implementer）での利用

サブエージェントは`Skill tool with skill: "agent-browser"`でagent-browserを呼び出します。

上記の修正を適用すれば、サブエージェントも正常にagent-browserを利用できるようになります。

**メリット**:
- PlaywrightやChrome DevToolsよりトークン消費が少ない
- AI エージェント向けに最適化されたAPI
- 効率的なブラウザ操作

**エージェント定義ファイル**:
- `.claude/agents/ui-expert.md`
- `.claude/agents/ui-implementer.md`

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-20 | 初版作成 - Daemon failed to start 問題の解決方法を記載 |

---

## 参考資料

- [agent-browser公式ドキュメント](https://agent-browser.dev)
- [GitHub リポジトリ](https://github.com/vercel-labs/agent-browser)
- [Vercel Labs](https://vercel.com/labs)
