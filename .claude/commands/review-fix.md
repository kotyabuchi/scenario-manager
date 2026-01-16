---
allowed-tools: Task, Read, Glob, Grep, Bash, TodoWrite
description: コードレビューを実行し、発見された問題を自動修正する
---

# /review-fix コマンド

## 概要

code-reviewerエージェントでコードレビューを実行し、発見された問題をserena-expertエージェントで自動修正するコマンド。

## 使用方法

```bash
/review-fix                      # git status で変更されたファイルをレビュー・修正
/review-fix src/app/(auth)/      # 特定ディレクトリをレビュー・修正
/review-fix --review-only        # レビューのみ（修正しない）
```

## 実行手順

### Step 1: 対象ファイルの特定

$ARGUMENTS に特定のパスが指定されている場合はそのパスを対象とする。
指定がない場合は `git status` で変更されたファイルを対象とする。

```bash
git status --porcelain
```

### Step 2: コードレビュー実行

code-reviewer エージェントを起動してレビューを実行する。

**重要**: code-reviewer は必ず `.claude/rules/coding-standards.md` を読んでからレビューを行う。

Task ツールで以下を実行:
- subagent_type: code-reviewer
- prompt: 対象ファイルのレビューを依頼

### Step 3: レビュー結果の確認

レビュー結果を確認し、以下の情報を整理:
- Critical Issues（必ず修正）
- High Priority Issues（修正推奨）
- Medium Priority Issues（修正推奨）
- Low Priority Issues（任意）

### Step 4: 問題の自動修正

`--review-only` オプションが指定されていない場合、serena-expert エージェントで修正を実行。

修正は優先度順に実行:
1. **Critical Issues** - 並列で修正可能なものはまとめて実行
2. **High Priority Issues** - 並列で修正可能なものはまとめて実行
3. **Medium Priority Issues** - 並列で修正可能なものはまとめて実行

Task ツールで以下を実行:
- subagent_type: serena-expert
- prompt: 具体的な修正内容を指示

### Step 5: 修正結果の報告

修正完了後、以下をまとめて報告:
- 修正した項目一覧
- 未対応の項目（あれば理由も）
- 追加で必要なアクション

## オプション

| オプション | 説明 |
|------------|------|
| `--review-only` | レビューのみ実行（修正しない） |
| `--critical-only` | Criticalの問題のみ修正 |
| `--include-low` | Low Priority も含めて修正 |

## 修正対象の優先度

| 優先度 | 自動修正 | 例 |
|--------|----------|-----|
| Critical | ○ 必須 | セキュリティ問題、クラッシュ、規約の重大違反 |
| High | ○ 実行 | ロジックエラー、パフォーマンス問題 |
| Medium | ○ 実行 | コード品質、保守性の問題 |
| Low | △ オプション | スタイル、軽微な最適化 |

## 注意事項

1. **空ファイルの扱い**: 空のプレースホルダーファイルは削除ではなく報告のみ
2. **破壊的変更**: 既存の動作を変更する可能性がある修正は確認を求める
3. **型定義の変更**: interface/type の変更は影響範囲を確認してから実行
4. **新規ファイル作成**: styles.ts 等の分離で新規ファイルが必要な場合は自動作成

## 実行例

### 基本実行
```
User: /review-fix
→ Step 1: git status で変更ファイルを特定
→ Step 2: code-reviewer でレビュー実行
→ Step 3: Critical 1件, High 5件, Medium 3件 を検出
→ Step 4: serena-expert で並列修正実行
→ Step 5: 修正完了レポート出力
```

### レビューのみ
```
User: /review-fix --review-only

→ レビュー結果のみ表示（修正は実行しない）
```

### 特定ディレクトリ
```
User: /review-fix src/components/

→ src/components/ 配下のファイルのみレビュー・修正
```

## 参照ファイル

このコマンドは以下のファイルを参照して動作する:

| ファイル | 用途 |
|----------|------|
| `.claude/rules/coding-standards.md` | コーディング規約（レビュー基準） |
| `.claude/rules/requirements-v1.md` | 要件定義（ビジネスロジック確認） |
| `.claude/agents/code-reviewer.md` | code-reviewer エージェント定義 |
