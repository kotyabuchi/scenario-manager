---
name: find-duplicates
description: >
  similarity-ts を使ってTypeScriptの重複コードを検出し、リファクタリング提案をdocs/reviews/に出力する。
  「重複コードを探して」「コードの重複を検出」「find-duplicates」で起動。
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# Find Duplicates — 重複コード検出 & リファクタリング提案

`similarity-ts`（AST ベースの構造比較ツール）を使い、TypeScript コードの重複を検出してリファクタリング提案を生成する。

## When to Use

- AI との協業でコードが増え、類似処理が散在していないか確認したい
- リファクタリングの優先度を決めたい
- コードベースの品質を定量的にモニタリングしたい

## Instructions

### Step 1: similarity-ts の準備

`similarity-ts` コマンドの存在を確認し、なければインストールする。

```bash
# コマンドの存在確認
command -v similarity-ts
```

**コマンドが見つからない場合**:
1. Cargo の存在を確認:
   ```bash
   command -v cargo
   ```
2. Cargo がある場合はインストール:
   ```bash
   cargo install similarity-ts
   ```
3. Cargo がない場合はエラーメッセージを表示して終了:
   ```
   ❌ similarity-ts の実行に Rust/Cargo が必要です。
   https://rustup.rs からインストールしてください。
   ```

**コマンドが見つかった場合**: バージョンを記録して次のステップへ。

### Step 2: 重複検出の実行

プロジェクトルートで `similarity-ts` を実行する。

```bash
similarity-ts --print 2>/dev/null
```

出力をパースし、以下の閾値でフィルタリングする:
- **Similarity >= 70%**
- **Score >= 5.0**

両方を満たすペアのみを検出結果として扱う。

**検出件数が 0 件の場合**: 総合評価 A のレポートを生成して完了（Step 5 へスキップ）。

### Step 3: 重複コードの読み取りと分類

検出された各ペアについて:

1. **Read ツール**で該当ファイルの該当行を読む
2. 以下のカテゴリに分類:
   - `Adapter` — DB操作（adapter.ts）
   - `UI` — コンポーネント（.tsx）
   - `Style` — スタイル定義（styles.ts）
   - `Hook` — カスタムフック（use*.ts）
   - `Util` — ユーティリティ（lib/）
   - `Type` — 型定義（interface.ts, types/）
   - `Other` — その他

3. リファクタリング難易度を判定:
   | 難易度 | 基準 |
   |--------|------|
   | Easy | 同一ディレクトリ内、関数抽出のみ |
   | Medium | 異なるディレクトリ、共通モジュール作成が必要 |
   | Hard | 異なるレイヤー間（例: adapter と component）、設計変更が必要 |

### Step 4: リファクタリング提案の生成

各ペアについて以下を提案する:

- **抽出先パス**: 共通処理を配置するファイルパス（既存パターンに合わせる）
- **関数シグネチャ**: 抽出する関数の型シグネチャ
- **呼び出し側の変更**: 元のファイルでの変更イメージ（import + 呼び出し）
- **注意点**: 副作用、テストへの影響など

### Step 5: レポート出力

`docs/reviews/duplicates-YYYY-MM-DD.md` にレポートを出力する。同日に既存ファイルがあれば上書きする。

**レポートフォーマット**:

```markdown
# 重複コード検出レポート

> **レビュー日時**: YYYY-MM-DD
> **検出ツール**: similarity-ts vX.X.X
> **対象**: src/ 配下 TypeScript ファイル
> **閾値**: Similarity >= 70%, Score >= 5.0
> **総合評価**: {A / B / C / D}

## サマリー

- 検出ペア数: N 件
- カテゴリ別: Adapter: X, UI: Y, Style: Z, ...
- 難易度別: Easy: X, Medium: Y, Hard: Z

## 検出結果

| # | ファイル1 | ファイル2 | Similarity | Score | カテゴリ | 難易度 |
|---|----------|----------|------------|-------|---------|--------|
| 1 | path/to/a.ts:10-30 | path/to/b.ts:5-25 | 85% | 7.2 | UI | Easy |

## リファクタリング提案

### #1: {概要}

**検出ペア**: `path/to/a.ts:10-30` ↔ `path/to/b.ts:5-25`
**Similarity**: 85% / **Score**: 7.2
**カテゴリ**: UI / **難易度**: Easy

**提案**:
- 抽出先: `src/components/elements/XxxHelper/XxxHelper.ts`
- 関数シグネチャ: `export const xxxHelper = (params: XxxParams): ReturnType => { ... }`
- 呼び出し側変更: import して呼び出しを置き換え
- 注意点: なし

（以下、各ペアについて繰り返し）

## 総合所見

（全体的な傾向、優先的に対処すべき箇所、推奨アクション）
```

**総合評価基準**:
| 評価 | 基準 |
|------|------|
| A | Score >= 5.0 の検出件数 = 0 |
| B | 1-3件、Easy のみ |
| C | 4-10件、または Medium 含む |
| D | 11件超、または Hard 含む |

レポート出力後、ファイルパスをユーザーに伝えて完了。
