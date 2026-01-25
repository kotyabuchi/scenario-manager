# ブラウザ自動化ツール: playwright-cli

## 概要

本プロジェクトでは **playwright-cli** スキルを使用してブラウザ操作を行います。

playwright-cli は Playwright の公式 Claude Code スキルで、以下の特徴があります：

- ✅ Playwright 公式サポート
- ✅ セマンティックロケータ対応（ARIA role、label等で要素を特定）
- ✅ スナップショット取得でページ構造を把握
- ✅ スクリーンショット、コンソールログ取得
- ✅ フォーム操作（クリック、入力、選択等）

---

## 使用方法

### スキルとして呼び出し

```
Skill tool with skill: "playwright-cli"
```

### 主要コマンド

| コマンド | 説明 | 例 |
|----------|------|-----|
| `navigate <url>` | ページに移動 | `navigate http://localhost:3000` |
| `snapshot` | アクセシビリティツリーを取得 | `snapshot` |
| `screenshot <path>` | スクリーンショットを保存 | `screenshot screenshots/test.png` |
| `click <selector>` | 要素をクリック | `click "Submit"` |
| `fill <selector> <value>` | テキストを入力 | `fill "input[name=email]" "test@example.com"` |
| `type <selector> <value>` | キー入力 | `type "input[name=password]" "password123"` |
| `select <selector> <value>` | セレクトボックス選択 | `select "select[name=country]" "Japan"` |
| `console` | コンソールログを表示 | `console` |
| `close` | ブラウザを閉じる | `close` |

### セレクタの指定方法

playwright-cli では以下のセレクタが使用できます：

| セレクタタイプ | 例 | 説明 |
|---------------|-----|------|
| テキスト | `"Submit"` | ボタンやリンクのテキスト |
| CSS | `"input[name=email]"` | CSS セレクタ |
| role | `role=button[name="Submit"]` | ARIA ロール |
| data-testid | `[data-testid="login-btn"]` | テスト用ID |

---

## サブエージェントでの使用

### ui-expert, ui-implementer, ui-reviewer

これらのエージェントは playwright-cli スキルを使用して：
- ページの表示確認
- スクリーンショット取得
- インタラクションテスト
- コンソールエラー確認

を行います。

### playwright-test-fixer

機能テストと自動修正を行う専門エージェント：
- 指定されたURLにアクセス
- テスト手順を実行
- 期待動作を検証
- 問題発見時に自動修正

---

## ワークフロー例

### 1. ページ確認

```
Skill tool with skill: "playwright-cli"
args: "navigate http://localhost:3000"
```

### 2. スナップショット取得

```
Skill tool with skill: "playwright-cli"
args: "snapshot"
```

### 3. 操作とスクリーンショット

```
Skill tool with skill: "playwright-cli"
args: "click 'Login' && screenshot screenshots/after-login.png"
```

### 4. ブラウザを閉じる

```
Skill tool with skill: "playwright-cli"
args: "close"
```

---

## 注意事項

- 開発サーバー（`pnpm dev`）が起動していることを確認
- スクリーンショットは `screenshots/` ディレクトリに保存
- テスト完了後は `close` コマンドでブラウザを閉じる

---

## 参考資料

- [Playwright 公式ドキュメント](https://playwright.dev/)
