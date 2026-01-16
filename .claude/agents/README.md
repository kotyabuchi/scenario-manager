# UI Expert Agents

Playwright MCPとfrontend-design skillを活用したUI改善専門エージェント群。

## エージェント一覧

| エージェント | 用途 | 呼び出し方 |
|-------------|------|-----------|
| **ui-expert** | 総合的なUI改善（分析→実装→検証） | `/agents` → ui-expert |
| **ui-reviewer** | 既存UIのレビュー・問題発見 | `/agents` → ui-reviewer |
| **ui-implementer** | 新規UIの設計・実装 | `/agents` → ui-implementer |
| **serena-expert** | トークン効率的な開発 | `/agents` → serena-expert |

## 使い方

### 方法1: /agentsコマンドから選択
```
/agents
→ ui-expert を選択
→ タスクを入力
```

### 方法2: Taskツールで直接呼び出し（Claude内部用）
Claudeが自動的に適切なエージェントを選択して委譲します。

## 各エージェントの役割

### ui-expert（総合）
- 既存ページの問題分析
- 改善提案の作成
- 実装と検証を一貫して実施

### ui-reviewer（レビュー専門）
- Playwrightでページを巡回
- アクセシビリティ・ユーザビリティ観点で評価
- 優先度付きレポートを作成

### ui-implementer（実装専門）
- 要件に基づいたコンポーネント設計
- frontend-design skillで高品質なUI実装
- Playwrightで実装結果を検証

## 前提条件

### 1. 開発サーバーの起動
```bash
pnpm dev        # Next.js (localhost:3000)
pnpm storybook  # Storybook (localhost:6006)
```

### 2. Playwright MCPの設定
`.mcp.json` にPlaywrightサーバーが設定されていること。

### 3. frontend-design skillのインストール
```bash
/install-plugin frontend-design
```

## ワークフロー例

### 既存ページの改善
```
1. ui-reviewer で現状をレビュー
2. レポートの問題点を確認
3. ui-implementer で修正を実装
4. ui-reviewer で再レビュー
```

### 新規ページの作成
```
1. 要件定義を確認
2. ui-implementer でコンポーネント設計
3. frontend-design skill でUI実装
4. Playwright で表示確認
5. ui-reviewer で品質チェック
```

## 出力ディレクトリ

| ディレクトリ | 内容 |
|-------------|------|
| `screenshots/` | Playwrightスクリーンショット |
| `src/components/elements/` | 基本UIコンポーネント |
| `src/components/blocks/` | 複合UIコンポーネント |

## 関連ドキュメント

- 要件定義: `.claude/rules/requirements-v1.md`
- プロジェクト概要: `CLAUDE.md`
- デザイントークン: `src/styles/tokens/`
- レシピ: `src/styles/recipes/`
