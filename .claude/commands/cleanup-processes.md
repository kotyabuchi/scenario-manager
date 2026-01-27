---
allowed-tools: Bash
description: 開発中のNode.jsプロセス（dev server, Storybook, Vitest等）を一覧表示・停止する
---

# /cleanup-processes

開発中に起動したNode.jsプロセスを整理・停止するコマンド。

## 使用方法

```bash
/cleanup-processes              # プロセス一覧を表示して対話的に停止
/cleanup-processes --list       # 一覧表示のみ
/cleanup-processes --all        # 開発系プロセスをすべて停止
/cleanup-processes --port 3000  # 特定ポートのプロセスを停止
```

## 対象プロセス

### 開発サーバー系
| プロセス | 識別方法 | デフォルトポート |
|----------|----------|------------------|
| Next.js dev | `next-server`, `next dev` | 3000 |
| Storybook | `storybook`, `@storybook/` | 6006 |
| Vite dev | `vite` | 5173 |
| Webpack dev | `webpack-dev-server` | 8080 |

### テスト系
| プロセス | 識別方法 | 備考 |
|----------|----------|------|
| Vitest | `vitest` | watch mode |
| Playwright | `playwright`, `@playwright/test` | テストランナー |
| Jest | `jest` | watch mode |

### ビルド/監視系
| プロセス | 識別方法 | 備考 |
|----------|----------|------|
| TypeScript | `tsc --watch`, `typescript` | 型チェック |
| PandaCSS | `@pandacss/dev` | CSS生成 |
| Turbopack | `turbopack` | Next.js内蔵 |
| esbuild | `esbuild` | バンドラー |
| nodemon | `nodemon` | ファイル監視 |

### ブラウザ自動操作系
| プロセス | 識別方法 | 備考 |
|----------|----------|------|
| agent-browser | `puppeteer`, `--remote-debugging-port` | ヘッドレスChrome |
| Playwright | `playwright`, Chromium/Firefox/WebKit | テスト用ブラウザ |
| Chrome DevTools MCP | `chrome-devtools-mcp` | MCP経由のブラウザ操作 |
| Puppeteer | `puppeteer` | ブラウザ自動操作 |

### DB GUI系
| プロセス | 識別方法 | 備考 |
|----------|----------|------|
| Prisma Studio | `prisma studio` | DB GUI |
| Drizzle Studio | `drizzle-kit studio` | DB GUI |

### 関連ブラウザプロセス
| プロセス | 実行ファイル | 備考 |
|----------|--------------|------|
| Headless Chrome | `chrome.exe --headless` | Puppeteer/Playwright用 |
| Chromium (Playwright) | `chromium.exe`, `chrome.exe` | `--remote-debugging-port`付き |
| Firefox (Playwright) | `firefox.exe` | `-juggler`オプション付き |
| WebKit (Playwright) | `Playwright.exe` | Playwright専用WebKit |

## 実行手順

### Step 1: Node.jsプロセス一覧の取得

Windows環境でNode.jsプロセスを確認：

```bash
# Node.jsプロセス一覧（コマンドライン付き）
wmic process where "name='node.exe'" get ProcessId,CommandLine /format:list 2>nul
```

### Step 2: ブラウザプロセスの確認

自動操作用のブラウザプロセスを確認：

```bash
# Headless Chrome / Playwright用Chromeの確認（--remote-debugging-port付き）
wmic process where "name='chrome.exe'" get ProcessId,CommandLine /format:list 2>nul | findstr /i "remote-debugging-port headless"

# Playwright用Chromiumの確認
wmic process where "name='chromium.exe'" get ProcessId,CommandLine /format:list 2>nul

# Playwright用Firefoxの確認（-jugglerオプション付き）
wmic process where "name='firefox.exe'" get ProcessId,CommandLine /format:list 2>nul | findstr /i "juggler"

# Playwright WebKitの確認
wmic process where "name='Playwright.exe'" get ProcessId,CommandLine /format:list 2>nul
```

### Step 3: ポート使用状況の確認

```bash
# 開発でよく使うポートの確認
netstat -ano | findstr "LISTENING" | findstr ":3000 :3001 :3002 :5173 :6006 :8080 :9000"

# Chrome DevToolsのリモートデバッグポート（通常9222）
netstat -ano | findstr "LISTENING" | findstr ":9222"
```

### Step 4: プロセスの分類と表示

取得したプロセス情報を以下のカテゴリで分類：

1. **開発サーバー** - `next`, `vite`, `storybook`, `webpack`
2. **テストランナー** - `vitest`, `playwright`, `jest`
3. **監視プロセス** - `tsc --watch`, `panda`, `nodemon`
4. **その他** - 上記に該当しないNode.jsプロセス

### Step 5: プロセスの停止

ユーザーの選択に基づいてプロセスを停止：

```bash
# 特定PIDのプロセスを停止
cmd //c "taskkill /PID <PID> /F"

# 特定ポートを使用しているプロセスを停止
# 1. ポートからPIDを取得
netstat -ano | findstr ":<PORT>" | findstr "LISTENING"
# 2. PIDでプロセスを停止
cmd //c "taskkill /PID <PID> /F"
```

## 出力フォーマット

```
📋 開発プロセス一覧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  開発サーバー
  [1] PID 12345 | Next.js dev server     | :3000
  [2] PID 23456 | Storybook              | :6006

🧪 テストランナー
  [3] PID 34567 | Vitest (watch)         | -

👀 監視プロセス
  [4] PID 45678 | TypeScript (--watch)   | -

🌐 ブラウザ自動操作
  [5] PID 56789 | Chrome (headless)      | :9222
  [6] PID 67890 | Playwright Chromium    | -

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
合計: 6 プロセス

停止するプロセスを選択してください:
- 番号を入力 (例: 1,2,3)
- 'all' で全て停止
- 'servers' で開発サーバーのみ停止
- 'browsers' でブラウザプロセスのみ停止
- 'cancel' でキャンセル
```

## オプション

| オプション | 説明 |
|-----------|------|
| `--list`, `-l` | プロセス一覧を表示するのみ（停止しない） |
| `--all`, `-a` | 確認なしで全ての開発プロセスを停止 |
| `--port <PORT>` | 指定ポートを使用しているプロセスを停止 |
| `--type <TYPE>` | 特定タイプのみ停止（servers/tests/watchers/browsers） |
| `--browsers` | ブラウザ自動操作プロセスのみ停止（Chrome, Chromium, Firefox, WebKit） |
| `--dry-run` | 停止対象を表示するが実際には停止しない |

## 注意事項

- **本番プロセスは対象外**: `NODE_ENV=production` のプロセスは除外
- **システムプロセス保護**: npmやpnpm自体のプロセスは停止しない
- **通常ブラウザ保護**: ユーザーが手動で開いたブラウザは停止しない（自動操作フラグ付きのみ対象）
- **確認プロンプト**: `--all`以外は停止前に確認を求める
- **ログ出力**: 停止したプロセスはログに記録
- **agent-browser**: `agent-browser close`での正常終了を優先。taskkillは最終手段
- **Playwright**: テスト中のブラウザを停止するとテストが失敗するため注意

## タスク実行

このコマンドが呼ばれたら：

1. **プロセス情報を収集**
   - `wmic process where "name='node.exe'"`でNode.jsプロセスを取得
   - `wmic process where "name='chrome.exe'"`でChromeプロセスを取得（`--remote-debugging-port`または`--headless`付きのみ）
   - `wmic process where "name='chromium.exe'"`でPlaywright用Chromiumを取得
   - `wmic process where "name='firefox.exe'"`でPlaywright用Firefox（`-juggler`付き）を取得
   - `netstat -ano`でポート使用状況を確認
   - コマンドライン引数からプロセスの種類を判別

2. **分類して表示**
   - 開発サーバー / テスト / 監視 / ブラウザ自動操作 に分類
   - ポート番号、PID、プロセス名を表示
   - ブラウザプロセスは自動操作用のみ表示（通常のブラウザは除外）

3. **ユーザーに選択を求める**
   - `--list`オプションの場合は表示のみ
   - `--all`オプションの場合は確認なしで停止
   - それ以外は停止対象を確認

4. **プロセスを停止**
   - `taskkill /PID <PID> /F`で停止
   - 子プロセスも含めて停止する場合は`taskkill /PID <PID> /T /F`
   - 停止結果を報告

### ブラウザプロセスの識別方法

自動操作用ブラウザと通常ブラウザを区別するためのキーワード：

| ブラウザ | 自動操作の特徴 |
|----------|----------------|
| Chrome | `--remote-debugging-port`, `--headless`, `--disable-gpu`, `--no-sandbox` |
| Chromium | Playwrightのキャッシュパスを含む（`.cache/ms-playwright`） |
| Firefox | `-juggler`, `-no-remote` |
| WebKit | `Playwright.exe`として起動 |

### agent-browser終了時の注意

`agent-browser`を使用している場合、終了前に以下を推奨：
1. `agent-browser close`コマンドで正常終了を試みる
2. 上記で終了しない場合のみ`taskkill`を使用
