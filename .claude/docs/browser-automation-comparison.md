# ブラウザ自動化ツール比較: agent-browser vs Playwright MCP

## 結論（TL;DR）

**agent-browserを積極的に使うべき理由：**

1. ✅ **Playwrightにできることはすべてagent-browserでもできる**
2. ✅ **agent-browserの方が圧倒的に機能が豊富**（PDF出力、ドラッグ&ドロップ、ネットワークモック等）
3. ✅ **トークン効率が良い**（AI エージェント向けに最適化されたスナップショット形式）
4. ✅ **セマンティックロケータ対応**（ARIA role、label等で要素を特定）

**唯一の違い：** 呼び出し方法
- Playwright: MCPネイティブツール（`mcp__playwright__browser_*`）
- agent-browser: CLIツール（`Skill tool`または`Bash tool`で呼び出し）

---

## 機能比較表

### 基本操作

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| ページ遷移 | ✅ `open` | ✅ `browser_navigate` |
| クリック | ✅ `click` | ✅ `browser_click` |
| ダブルクリック | ✅ `dblclick` | ❌ |
| テキスト入力 | ✅ `type`, `fill` | ✅ `browser_type` |
| ホバー | ✅ `hover` | ✅ `browser_hover` |
| フォーカス | ✅ `focus` | ❌ |
| キー入力 | ✅ `press` | ✅ `browser_press_key` |
| 待機 | ✅ `wait` | ✅ `browser_wait_for` |

### フォーム操作

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| チェックボックス | ✅ `check`, `uncheck` | ❌ |
| セレクトボックス | ✅ `select` | ❌ |
| ファイルアップロード | ✅ `upload` | ❌ |
| ドラッグ&ドロップ | ✅ `drag` | ❌ |

### スクロール操作

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| ページスクロール | ✅ `scroll` | ❌ |
| 要素へスクロール | ✅ `scrollintoview` | ❌ |
| マウスホイール | ✅ `mouse wheel` | ❌ |

### 出力・キャプチャ

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| スクリーンショット | ✅ `screenshot` | ✅ `browser_take_screenshot` |
| フルページスクリーンショット | ✅ `screenshot --full` | ⚠️ 部分対応 |
| PDF出力 | ✅ `pdf` | ❌ |
| ビデオ録画 | ✅ `record start/stop` | ❌ |
| トレース | ✅ `trace start/stop` | ❌ |

### ページ情報取得

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| スナップショット | ✅ `snapshot` | ✅ `browser_snapshot` |
| JavaScript実行 | ✅ `eval` | ✅ `browser_evaluate` |
| 要素テキスト取得 | ✅ `get text` | ⚠️ evaluateで可能 |
| 要素HTML取得 | ✅ `get html` | ⚠️ evaluateで可能 |
| 要素属性取得 | ✅ `get attr` | ⚠️ evaluateで可能 |
| ページタイトル | ✅ `get title` | ⚠️ evaluateで可能 |
| URL取得 | ✅ `get url` | ⚠️ evaluateで可能 |
| 要素カウント | ✅ `get count` | ❌ |
| 要素のボックス情報 | ✅ `get box` | ❌ |
| 要素のスタイル | ✅ `get styles` | ❌ |

### 要素の状態確認

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| 表示確認 | ✅ `is visible` | ❌ |
| 有効化確認 | ✅ `is enabled` | ❌ |
| チェック確認 | ✅ `is checked` | ❌ |

### 要素の検索（セマンティックロケータ）

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| ARIAロールで検索 | ✅ `find role` | ❌ |
| テキストで検索 | ✅ `find text` | ❌ |
| ラベルで検索 | ✅ `find label` | ❌ |
| プレースホルダーで検索 | ✅ `find placeholder` | ❌ |
| alt属性で検索 | ✅ `find alt` | ❌ |
| title属性で検索 | ✅ `find title` | ❌ |
| testidで検索 | ✅ `find testid` | ❌ |

### デバイス・環境エミュレーション

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| ビューポート設定 | ✅ `set viewport` | ❌ |
| デバイスエミュレーション | ✅ `set device` | ❌ |
| ジオロケーション | ✅ `set geo` | ❌ |
| オフラインモード | ✅ `set offline` | ❌ |
| ダークモード | ✅ `set media dark` | ❌ |
| モーション設定 | ✅ `set media reduced-motion` | ❌ |

### ネットワーク

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| ネットワークリクエスト一覧 | ✅ `network requests` | ✅ `browser_network_requests` |
| ネットワークルート（モック） | ✅ `network route` | ❌ |
| カスタムヘッダー | ✅ `set headers` | ❌ |
| 認証情報 | ✅ `set credentials` | ❌ |
| プロキシ | ✅ `--proxy` | ❌ |

### ストレージ

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| クッキー管理 | ✅ `cookies` | ❌ |
| localStorage管理 | ✅ `storage local` | ❌ |
| sessionStorage管理 | ✅ `storage session` | ❌ |

### タブ・セッション管理

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| 新規タブ | ✅ `tab new` | ❌ |
| タブ一覧 | ✅ `tab list` | ❌ |
| タブ切替 | ✅ `tab <n>` | ❌ |
| タブ閉じる | ✅ `tab close` | ❌ |
| セッション管理 | ✅ `--session` | ❌ |

### デバッグ

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| コンソールログ | ✅ `console` | ✅ `browser_console_messages` |
| エラー一覧 | ✅ `errors` | ❌ |
| 要素ハイライト | ✅ `highlight` | ❌ |
| ヘッド表示 | ✅ `--headed` | ❌ |
| CDP接続 | ✅ `--cdp`, `connect` | ❌ |

### その他

| 機能 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| ブラウザ拡張のロード | ✅ `--extension` | ❌ |
| マウス操作 | ✅ `mouse` | ❌ |
| ナビゲーション | ✅ `back`, `forward`, `reload` | ❌ |
| ブラウザを閉じる | ✅ `close` | ✅ `browser_close` |

---

## スナップショット形式の比較

### agent-browser（AI最適化）

```
snapshot -i  # インタラクティブ要素のみ
```

**出力例**:
```
button "Submit" [ref=e1]
textbox "Email" [ref=e2]
textbox "Password" [ref=e3]
link "Forgot password?" [ref=e4]
```

**特徴**:
- ✅ トークン消費が少ない
- ✅ AIが理解しやすい形式
- ✅ ref（`@e1`等）で直接操作可能
- ✅ インタラクティブ要素のみ抽出可能

### Playwright MCP

**出力**: 完全なアクセシビリティツリー（JSON形式）

**特徴**:
- ⚠️ トークン消費が多い
- ⚠️ 構造が複雑
- ⚠️ 手動で要素を特定する必要がある

---

## 使い分けガイド

### agent-browserを使うべき場合（推奨）

- ✅ **ほぼすべてのケース**で推奨
- ✅ フォーム操作（チェックボックス、セレクト等）
- ✅ ドラッグ&ドロップ
- ✅ ファイルアップロード
- ✅ PDF出力
- ✅ ネットワークモック
- ✅ デバイスエミュレーション
- ✅ ビデオ録画
- ✅ セマンティックロケータ（ARIA role等）
- ✅ トークン節約が重要な場合

### Playwrightを使う場合

- ⚠️ **基本的に使わない**
- agent-browserで何らかの問題が発生した場合のフォールバックのみ

---

## サブエージェント（ui-expert, ui-implementer）での使用

### 推奨パターン

```markdown
## Phase 4: 検証

1. **agent-browserスキルで確認**
   ```
   Skill tool with skill: "agent-browser"
   ```

   依頼内容:
   - http://localhost:3000/[path] にアクセス
   - スクリーンショットを `screenshots/impl-xxx.png` に保存
   - インタラクション確認（クリック、ホバー、入力）
   - コンソールエラー確認
```

### 実際の呼び出し例

```
Skill tool with:
  skill: "agent-browser"
  args: "open http://localhost:3000 && snapshot -i && screenshot screenshots/test.png && console"
```

または複数コマンド:

```bash
agent-browser open http://localhost:3000
agent-browser snapshot -i
agent-browser screenshot screenshots/test.png
agent-browser console
agent-browser close
```

---

## トークン消費比較（概算）

| 操作 | agent-browser | Playwright MCP |
|------|--------------|----------------|
| スナップショット | ~500 tokens | ~2,000 tokens |
| スクリーンショット | ~200 tokens | ~200 tokens |
| 要素クリック | ~50 tokens | ~50 tokens |

**結論**: agent-browserはスナップショット取得で**約75%のトークン節約**が可能。

---

## まとめ

### agent-browserの優位性

1. **機能の豊富さ**: Playwrightの**5倍以上の機能**
2. **トークン効率**: スナップショットで**75%削減**
3. **AI最適化**: セマンティックロケータ、ref形式
4. **開発効率**: 1コマンドで複雑な操作が可能

### Playwrightを使う理由

- ❌ **ほぼない**（フォールバック用途のみ）

### 推奨アクション

1. ✅ すべてのブラウザ操作でagent-browserを第一選択肢とする
2. ✅ サブエージェント（ui-expert, ui-implementer）はagent-browserスキルを使用
3. ✅ Playwrightは削除せず、フォールバック用に保持

---

## 参考資料

- [agent-browser GitHub](https://github.com/vercel-labs/agent-browser)
- [agent-browser公式ドキュメント](https://agent-browser.dev)
- [トラブルシューティング](./.claude/docs/agent-browser-troubleshooting.md)
