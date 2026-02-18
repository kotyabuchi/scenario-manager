---
name: review-diff
description: >
  最後のコミットからの未コミット差分（未追跡ファイル含む、docs/配下を除く）を多角的にレビューする。
  コーディング規約準拠、設計品質、セキュリティ、パフォーマンス、UX/a11y、バグ検出の6観点で評価。
  差分が大きい場合（10ファイル以上 or 200行以上）は3つの専門エージェントで並列レビュー。
  「差分をレビューして」「変更をレビュー」「変更をチェック」で起動。
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Task
---

# Review Diff — 未コミット差分の多角的レビュー

最後のコミットからの未コミット変更（未追跡ファイル含む、`docs/` 配下を除く）を6つの観点からレビューし、`docs/reviews/` にレポートを出力する。

差分が大きい場合は3つの専門エージェント（セキュリティ+バグ、設計+規約、UX+パフォーマンス）で**並列レビュー**し、結果を統合レポートに集約する。

## When to Use

- コミット前に変更内容の品質を確認したい
- PR作成前にセルフレビューしたい
- コーディング規約への準拠状況を確認したい

## Instructions

### Step 1: 差分の取得

レビュー対象は **最後のコミット（HEAD）からの未コミット変更すべて**（ステージ済み + 未ステージ + 未追跡ファイル）。

**差分取得コマンド（docs/ を除外）:**

```bash
# 1. 変更概要の取得（tracked files: staged + unstaged）
git diff HEAD --stat -- . ":(exclude)docs/"

# 2. 変更内容の取得（tracked files: staged + unstaged）
git diff HEAD -- . ":(exclude)docs/"

# 3. 未追跡ファイルの一覧取得（docs/ を除外）
git ls-files --others --exclude-standard -- . ":(exclude)docs/"
```

未追跡ファイルがある場合は、それらのファイルも Read ツールで内容を読み取り、レビュー対象に含める。

tracked files の差分も未追跡ファイルもない場合は「レビュー対象の変更がありません」と報告して終了。

### Step 1.5: レビューモード判定

差分取得後、以下のロジックでレビューモードを自動判定する:

```
1. git diff HEAD --stat -- . ":(exclude)docs/" の出力から変更ファイル数と変更行数を取得
   - fileCount = stat 出力の最終行 "N files changed" の N
   - totalChanges = insertions + deletions の合計
2. git ls-files --others --exclude-standard -- . ":(exclude)docs/" の件数を fileCount に加算
3. 判定:
   - fileCount >= 10 OR totalChanges >= 200 → パラレルモード
   - それ以外 → シリアルモード
```

ユーザーに判定結果を通知する:
- パラレルモード: `「変更規模が大きいため、3エージェント並列レビューで実行します（N files, +X/-Y lines）」`
- シリアルモード: `「シリアルモードでレビューを実行します（N files, +X/-Y lines）」`

**パラレルモードの場合は Step 2P へ、シリアルモードの場合は Step 2S へ進む。**

---

## シリアルモード（既存フロー）

### Step 2S: コンテキスト収集

レビュー精度を上げるため、以下を並列で収集する:

1. **変更ファイル一覧** — `git diff HEAD --name-only -- . ":(exclude)docs/"` + `git ls-files --others --exclude-standard -- . ":(exclude)docs/"` で取得
2. **直近コミット** — `git log -1 --oneline` で最後のコミット内容を把握（差分の起点を確認）
3. **プロジェクトルール** — 変更内容に関連する `.claude/rules/` のルールファイルを読む
   - `.tsx`/`.ts` 変更 → `typescript-rules.md`, `react-rules.md`
   - スタイル変更 → `styling-rules.md`
   - フォーム関連 → `form-rules.md`
   - エラー処理 → `error-handling.md`
4. **変更ファイルの全体像** — 差分だけでなく、変更されたファイルの前後のコードも読んで文脈を理解する

### Step 3S: 6観点レビュー

各観点について、差分に該当する問題がある場合のみ指摘する。問題がなければ「問題なし」と明記。

#### 1. コーディング規約準拠

`.claude/rules/` のルールに照らして確認:

- 命名規則（ファイル名、変数名、関数名）
- Import順序
- コメント（日本語）
- any型、Non-null assertion(!)の使用禁止
- console.log の禁止（LogTape使用）
- セマンティックHTML
- スタイル分離（`styles.ts`）
- エクスポート形式（`export default` の末尾使用禁止）
- PandaCSSトークンの使用（ハードコードされた値の禁止）

#### 2. 設計・保守性

- 責務の分離（Single Responsibility）
- コンポーネント・関数の粒度は適切か
- 型安全性（Supabase生成型/Zod推論型の活用、型の二重管理の有無）
- エラーハンドリング（Result型パターンの使用）
- Null/Undefinedチェック（`isNil` の使用）
- 既存パターンとの整合性

#### 3. セキュリティ

- 入力バリデーション
- XSS/インジェクションリスク
- 認証・認可の考慮
- 機密情報のハードコード

#### 4. パフォーマンス

- 不要な再レンダリング
- N+1クエリ
- バンドルサイズへの影響（不要なクライアントコンポーネント）
- メモ化の必要性

#### 5. UX・アクセシビリティ

- WCAG 2.1 AA準拠（コントラスト比、フォーカス管理）
- キーボードナビゲーション
- スクリーンリーダー対応
- エラー状態・ローディング状態の考慮
- @phosphor-icons/react アイコン使用（絵文字禁止）

#### 6. バグ・ロジックエラー

- エッジケースの見落とし
- 競合状態（Race condition）
- 型の不一致
- Off-by-oneエラー
- 非同期処理の問題（未処理のPromise等）

**Step 4（レポート出力）へ進む。**

---

## パラレルモード（3エージェント並列）

### Step 2P: コンテキスト準備

以下の情報を収集し、3エージェントに渡すプロンプトを準備する:

1. **diff全文** — `git diff HEAD -- . ":(exclude)docs/"` の出力
2. **未追跡ファイルの内容** — 各ファイルを Read で読み取った内容
3. **変更ファイル一覧** — `git diff HEAD --name-only -- . ":(exclude)docs/"` + 未追跡ファイル一覧
4. **HEADハッシュ** — `git log -1 --oneline`
5. **一時ファイルパスの決定** — 各エージェントの出力先:
   - Group A: `docs/reviews/.tmp-diff-group-a.md`
   - Group B: `docs/reviews/.tmp-diff-group-b.md`
   - Group C: `docs/reviews/.tmp-diff-group-c.md`

### Step 3P: 並列ディスパッチ

3つの Task 呼び出しを **1つのメッセージで同時に** 発行する。各エージェントは独立して変更ファイルの全体を読み、**結果を指定された一時ファイルに Write** する。

**コンテキスト保護**: 各エージェントはレビュー結果をファイルに書き出し、メインセッションには短い完了通知のみ返す。これにより3エージェントの大量の結果がメインのコンテキストウィンドウを圧迫してコンパクションで消失する問題を防ぐ。

```
Task A: security-bug-reviewer（subagent_type: general-purpose）
  - prompt に以下を含める:
    - ".claude/agents/security-bug-reviewer.md の指示に従ってレビューせよ"
    - diff全文
    - 未追跡ファイル内容
    - 変更ファイル一覧
    - HEAD hash
    - "結果は docs/reviews/.tmp-diff-group-a.md に Write せよ。レスポンスには完了通知のみ返せ。"
  - model: sonnet

Task B: design-standards-reviewer（subagent_type: general-purpose）
  - prompt に以下を含める:
    - ".claude/agents/design-standards-reviewer.md の指示に従ってレビューせよ"
    - diff全文
    - 未追跡ファイル内容
    - 変更ファイル一覧
    - HEAD hash
    - "結果は docs/reviews/.tmp-diff-group-b.md に Write せよ。レスポンスには完了通知のみ返せ。"
  - model: sonnet

Task C: ux-performance-reviewer（subagent_type: general-purpose）
  - prompt に以下を含める:
    - ".claude/agents/ux-performance-reviewer.md の指示に従ってレビューせよ"
    - diff全文
    - 未追跡ファイル内容
    - 変更ファイル一覧
    - HEAD hash
    - "結果は docs/reviews/.tmp-diff-group-c.md に Write せよ。レスポンスには完了通知のみ返せ。"
  - model: sonnet
```

**重要**: 3つの Task は必ず1メッセージで同時に発行し、並列実行を保証すること。

### Step 3.5P: 結果集約

3エージェントの完了通知を受け取ったら、**一時ファイルを Read** して結果を取得し、以下のアルゴリズムで統合レポートを生成する:

```
1. Read docs/reviews/.tmp-diff-group-a.md → Group A の結果
2. Read docs/reviews/.tmp-diff-group-b.md → Group B の結果
3. Read docs/reviews/.tmp-diff-group-c.md → Group C の結果
4. ファイルが存在しない or 空の場合 → 該当エージェント失敗として扱う
5. 集約完了後、3つの一時ファイルを削除（Bash: rm）
```

#### 3.5P-1. 6観点の正規順序組み立て

各エージェントの担当観点を以下の順序で配置する:

| 観点# | 担当エージェント |
|--------|----------------|
| 1. コーディング規約準拠 | Group B (design-standards-reviewer) |
| 2. 設計・保守性 | Group B (design-standards-reviewer) |
| 3. セキュリティ | Group A (security-bug-reviewer) |
| 4. パフォーマンス | Group C (ux-performance-reviewer) |
| 5. UX・アクセシビリティ | Group C (ux-performance-reviewer) |
| 6. バグ・ロジックエラー | Group A (security-bug-reviewer) |

#### 3.5P-2. 指摘の重複排除

1. 全エージェントの Findings テーブルを結合
2. `file:line` をキーとしてグループ化
3. 同一 `file:line` に複数の指摘がある場合:
   - severity が異なる → 高い方を採用（`required` > `recommended` > `consider`）
   - perspective が異なる → 両方の観点名を併記（例: `セキュリティ / バグ・ロジックエラー`）
   - finding と recommended_fix は高 severity 側を採用

#### 3.5P-3. 指摘のソート

1. severity 別にグループ化: `required` → `recommended` → `consider`
2. 各グループ内はファイルパス昇順 → 行番号昇順
3. 通し番号を振り直す（1から連番）

#### 3.5P-4. 良い点（Strengths）の統合

1. 3エージェントの Strengths セクションを結合
2. 意味が重複する項目を1つにまとめる
3. 箇条書きとして出力

#### 3.5P-5. 総合評価の算出

以下のルールで総合評価を決定する:

| 条件 | 評価 |
|------|------|
| NG 2つ以上 OR required 3件以上 | D |
| NG 1つ + required 1件以上 | C |
| required 1件以上 OR WARN あり | B |
| 全 OK + required 0件 | A |
| 未完了の観点あり（エージェント失敗） | 最高で B |

#### 3.5P-6. エラーハンドリング

| 状況 | 対応 |
|------|------|
| 1エージェント失敗 | 該当2観点を `WARN (自動レビュー未完了)` に設定、総合評価の上限を B に制限 |
| 2エージェント以上失敗 | パラレルモードを中断し、Step 2S（シリアルモード）にフォールバック |

エージェント失敗の判定: Task の返却結果が中間フォーマットに合致しない、またはエラーメッセージを含む場合。

---

## 共通ステップ

### Step 4: レポート出力

`docs/reviews/` に以下の形式でレポートを出力する。ディレクトリが存在しない場合は作成する。

**ファイル名**: `diff-review-YYYY-MM-DD.md`
同日に複数回実行した場合: `diff-review-YYYY-MM-DD-2.md`

#### レポートフォーマット

```markdown
# コード差分レビュー

> **レビュー日時**: YYYY-MM-DD
> **対象範囲**: HEAD からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: N files
> **総合評価**: {A / B / C / D}
> **レビューモード**: {シリアル / パラレル（3エージェント）}

## 変更サマリー

{2-3文で変更内容の概要}

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/...` | +N | -N | 新規/変更/削除 |

## 評価詳細

### 1. コーディング規約準拠 {OK / WARN / NG}

{評価コメント}

### 2. 設計・保守性 {OK / WARN / NG}

{評価コメント}

### 3. セキュリティ {OK / WARN / NG}

{評価コメント}

### 4. パフォーマンス {OK / WARN / NG}

{評価コメント}

### 5. UX・アクセシビリティ {OK / WARN / NG}

{評価コメント}

### 6. バグ・ロジックエラー {OK / WARN / NG}

{評価コメント}

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|

## 良い点

{変更の中で良かった点を箇条書きで記載}

## 総合所見

{全体的な評価と改善の方向性}
```

#### 総合評価の基準

| 評価 | 基準 |
|------|------|
| A | 必須指摘なし。そのままマージ可能 |
| B | 軽微な改善点あり。修正後にマージ可能 |
| C | 重要な問題あり。修正が必要 |
| D | 根本的な問題あり。設計の見直しが必要 |

### Step 5: 結果の報告

ユーザーに以下を報告:
- 総合評価
- レビューモード（シリアル/パラレル）
- 必須/推奨/検討の指摘件数
- 必須指摘がある場合はその概要
- レポートファイルのパス

## Notes

- **自動モード判定**: 10ファイル以上 OR 200行以上の変更でパラレルモード、それ以下でシリアルモードに自動切替
- **パラレルモード**: `security-bug-reviewer`、`design-standards-reviewer`、`ux-performance-reviewer` の3エージェントが並列に各2観点を担当
- **シリアルモード**: 従来どおり1パスで6観点すべてを評価（小さな差分向け）
- **`/apply-review` との互換性**: パラレル/シリアルどちらのレポートも同一フォーマットのため、`/apply-review` での修正反映にそのまま使用可能
- 同日の既存レポートファイルがある場合は連番を付与して上書きしない
