---
allowed-tools: Read, Glob, Grep, Write, Edit, TodoWrite, Task, Bash, AskUserQuestion, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__replace_symbol_body, mcp__serena__find_referencing_symbols
description: テストを維持しながらコード品質を改善する（TDDのRefactorフェーズ）。
---

# /refactor コマンド

## 概要

**TDD（テスト駆動開発）の「Refactor」フェーズを担当するスキル**

`/implement-tests` で実装したコードを、テストをパスさせたまま改善する。
コードの可読性・保守性・パフォーマンスを向上させる。

```
/requirements → /gen-test → /implement-tests → [/refactor]
                                                    ↓
                                              テスト維持しながら改善
                                                    ↓
                                              PROGRESS.md更新（リファクタ: ✅）
```

## 設計原則

### 1. テストは常にグリーン
- リファクタリング中もテストは常にパス状態を維持
- 小さな変更 → テスト実行 → 確認 のサイクルを繰り返す
- テストが失敗したら即座にロールバック

### 2. 動作を変えない
- 外部から見た振る舞いは変更しない
- インターフェース（引数・戻り値の型）は原則維持
- 変更が必要な場合は要件定義から見直し

### 3. 段階的改善
- 一度に大きな変更をしない
- 1つのリファクタリングパターンを適用 → テスト → 次のパターン
- コミット可能な単位で区切る

---

## 使用方法

```bash
/refactor                           # 直近の実装をリファクタリング
/refactor schema.ts                 # 特定ファイルをリファクタリング
/refactor --check-only              # 改善ポイントの洗い出しのみ
/refactor --pattern extract-method  # 特定パターンのみ適用
```

---

## 実行手順

### Phase 1: 現状分析

#### Step 1.1: 対象コードの特定

```bash
# 直近で変更されたファイルを確認
git diff --name-only HEAD~5

# または指定されたファイルを確認
```

#### Step 1.2: テストの確認

```bash
# 全テストがパスすることを確認（前提条件）
pnpm vitest run
```

**テストが失敗している場合**: `/implement-tests` に戻る

#### Step 1.3: コード品質の分析

以下の観点でコードを分析:

| 観点 | チェック項目 |
|------|-------------|
| 可読性 | 変数名、関数名、コメント |
| 重複 | DRY原則違反、コピペコード |
| 複雑度 | ネストの深さ、条件分岐の多さ |
| 責務 | 単一責任原則、関数の長さ |
| 型安全 | any使用、型アサーション |
| パターン | プロジェクト規約への準拠 |

---

### Phase 2: リファクタリング計画

#### Step 2.1: 改善ポイントの洗い出し

```markdown
## リファクタリング計画

### 対象ファイル
- src/app/(main)/scenarios/_components/schema.ts

### 改善ポイント

1. [高] 重複コード: optionalNumber関数が同じパターンを繰り返している
   - 解決策: 共通バリデーション関数の抽出

2. [中] マジックナンバー: 1, 20, 240 などの数値リテラル
   - 解決策: 定数として抽出

3. [低] コメント不足: refine関数の意図が不明瞭
   - 解決策: JSDocコメント追加
```

#### Step 2.2: 優先度付け

| 優先度 | 基準 |
|--------|------|
| 高 | バグを誘発しやすい、理解困難 |
| 中 | 保守性に影響、コーディング規約違反 |
| 低 | 美観、微細な改善 |

---

### Phase 3: リファクタリング実行

#### Step 3.1: 小さな変更を適用

**重要**: 1つのリファクタリングパターンを適用したら必ずテスト実行

```
1. 変更を適用
2. テスト実行
3. パスしたら次へ / 失敗したらロールバック
4. 繰り返し
```

#### Step 3.2: 主要リファクタリングパターン

| パターン | 適用場面 | 例 |
|----------|---------|-----|
| Extract Method | 長い関数、重複コード | 共通処理を関数化 |
| Extract Constant | マジックナンバー | `const MAX_PLAYERS = 20` |
| Rename | 不明瞭な命名 | `data` → `searchParams` |
| Inline | 不要な抽象化 | 1回しか使わない変数を削除 |
| Replace Conditional | 複雑な条件分岐 | ガード句、早期リターン |
| Extract Type | 型定義の重複 | 共通型の抽出 |

#### Step 3.3: テスト実行

```bash
# 各変更後にテスト実行
pnpm vitest run

# Lintチェック
pnpm check
```

---

### Phase 4: 検証

#### Step 4.1: 全テストの確認

```bash
pnpm vitest run
```

すべてのテストがパスすることを確認。

#### Step 4.2: Lint/Format確認

```bash
pnpm check
```

コーディング規約への準拠を確認。

#### Step 4.3: Before/After比較

```markdown
## リファクタリング結果

### Before
```typescript
const optionalNumber = (min: number, max: number, fieldName: string) =>
  z.preprocess(
    (val) => val === '' || val === undefined || val === null ? undefined : val,
    z.coerce.number().min(min).max(max).optional(),
  );
```

### After
```typescript
const VALIDATION_LIMITS = {
  player: { min: 1, max: 20, label: 'プレイ人数' },
  playtime: { min: 1, max: 240, label: 'プレイ時間' },
} as const;

const createOptionalNumberSchema = (config: typeof VALIDATION_LIMITS[keyof typeof VALIDATION_LIMITS]) =>
  z.preprocess(
    (val) => (val === '' || val == null) ? undefined : val,
    z.coerce
      .number()
      .min(config.min, `${config.label}は${config.min}以上で入力してください`)
      .max(config.max, `${config.label}は${config.max}以下で入力してください`)
      .optional(),
  );
```

### 改善点
- マジックナンバーを定数化
- 設定オブジェクトで一元管理
- 型安全性の向上
```

---

### Phase 5: 完了処理

#### Step 5.1: サマリー出力

```markdown
## リファクタリング完了サマリー

### 対象ファイル
| ファイル | 変更内容 |
|----------|---------|
| `schema.ts` | 定数抽出、関数リネーム |

### 適用パターン
- Extract Constant: 3箇所
- Rename: 2箇所
- Extract Method: 1箇所

### テスト結果
✅ 全テストパス（22/22）

### Lint結果
✅ 問題なし
```

#### Step 5.2: PROGRESS.md更新

```markdown
## TDD進捗: <機能名>

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | ✅ | ✅ | ✅ | ✅ | ✅ | 完了 |
```

---

## リファクタリングパターン詳細

### Extract Method（メソッド抽出）

**Before**:
```typescript
const searchScenarios = async (params: SearchParams) => {
  // 30行の処理...
  const conditions = [];
  if (params.systemIds?.length) {
    conditions.push(/* ... */);
  }
  if (params.tagIds?.length) {
    conditions.push(/* ... */);
  }
  // ...
};
```

**After**:
```typescript
const buildSearchConditions = (params: SearchParams) => {
  const conditions = [];
  if (params.systemIds?.length) {
    conditions.push(/* ... */);
  }
  if (params.tagIds?.length) {
    conditions.push(/* ... */);
  }
  return conditions;
};

const searchScenarios = async (params: SearchParams) => {
  const conditions = buildSearchConditions(params);
  // ...
};
```

### Extract Constant（定数抽出）

**Before**:
```typescript
z.string().min(1).max(100)
z.string().min(1).max(2000)
```

**After**:
```typescript
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

z.string().min(1).max(TITLE_MAX_LENGTH)
z.string().min(1).max(DESCRIPTION_MAX_LENGTH)
```

### Replace Conditional with Guard Clause（ガード句）

**Before**:
```typescript
const processData = (data: Data | null) => {
  if (data) {
    if (data.isValid) {
      // メイン処理...
    } else {
      return err(new Error('Invalid data'));
    }
  } else {
    return err(new Error('No data'));
  }
};
```

**After**:
```typescript
const processData = (data: Data | null) => {
  if (!data) {
    return err(new Error('No data'));
  }
  if (!data.isValid) {
    return err(new Error('Invalid data'));
  }

  // メイン処理...
};
```

---

## 禁止事項

| 禁止 | 理由 |
|------|------|
| テストを変更してパスさせる | 動作を変えてはいけない |
| 一度に大きな変更 | ロールバックが困難 |
| インターフェース変更 | 呼び出し元に影響 |
| 新機能の追加 | リファクタリングの範囲外 |
| テストなしでのリファクタ | 品質保証ができない |

---

## オプション

| オプション | 説明 |
|------------|------|
| `--check-only` | 改善ポイントの洗い出しのみ（変更なし） |
| `--pattern <name>` | 特定パターンのみ適用 |
| `--dry-run` | 変更内容のプレビューのみ |
| `--verbose` | 詳細なログを出力 |

---

## エラーハンドリング

### テストが失敗した場合

```
⚠ テストが失敗しました

失敗したテスト:
- schema.test.ts > searchFormSchema > minPlayer > 1以上は有効

最後の変更:
- optionalNumber関数のリネーム

対応:
1. 変更をロールバック
2. より小さな単位で再実行
3. テストを確認

[ロールバック]  [テストを確認]  [中止]
```

### Lintエラーが発生した場合

```
⚠ Lintエラーが発生しました

エラー内容:
- Unused variable 'oldFunctionName'

対応:
1. 未使用の変数・インポートを削除
2. `pnpm check` で自動修正

[自動修正を実行]  [手動で修正]  [中止]
```

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/commands/implement-tests.md` | 実装フェーズ（前フェーズ） |
| `CLAUDE.md` | コーディング規約 |
| `.claude/PROGRESS.md` | 進捗管理 |
| `vitest.config.ts` | Vitest設定 |

---

## 次のフェーズへの引き継ぎ

リファクタリング完了後、TDDサイクルの完了を宣言:

```
リファクタリングが完了しました。

📄 対象ファイル: src/app/(main)/scenarios/_components/schema.ts
✅ テスト: 全パス
✅ Lint: 問題なし
📊 PROGRESS.md: 更新済み

TDDサイクル完了:
/requirements → /gen-test → /implement-tests → /refactor ✅
```
