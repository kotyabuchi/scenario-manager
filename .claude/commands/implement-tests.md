---
allowed-tools: Read, Glob, Grep, Write, Edit, TodoWrite, Task, Bash, AskUserQuestion, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol
description: 失敗するテストを通過させる実装を行う（TDDのGreenフェーズ）。過度にテストを通すためだけの実装を防止する。
---

# /implement-tests コマンド

## 概要

**TDD（テスト駆動開発）の「Green」フェーズを担当するスキル**

`/gen-test` で生成された失敗するテストを分析し、テストを通過させる最小限かつ適切な実装を行う。
実装 → テスト → 修正 のサイクルを繰り返し、すべてのテストが通過するまで継続する。
最後に品質検証（Lint、型チェック、ビルド）を行い、すべてパスするまで修正する。

```
失敗するテスト → テスト分析 → 実装 → テスト実行 →
                    ↑                      ↓
                    └── 失敗なら修正 ←──┘
                            ↓
                    全パス後、過剰実装チェック
                            ↓
                    品質検証（pnpm check → tsc → build）
                            ↓
                    失敗なら修正して再検証
```

## 設計原則

### 1. 最小実装の原則
- テストを通すために必要な最小限のコードのみ実装
- 将来の要件を先取りした実装は行わない
- YAGNI (You Ain't Gonna Need It) を徹底

### 2. 過剰実装（Over-fitting）の防止
- テストをパスするためだけのハードコードを検出
- マジックナンバー・マジックストリングの濫用を警告
- 条件分岐でテストケースのみを満たすコードを拒否

### 3. プロジェクト規約への準拠
- CLAUDE.md のコーディング規約に従う
- 既存コードのパターンを踏襲
- 型安全性を確保（any禁止）

### 4. 品質検証の徹底
- テストの通過だけでは不十分
- `pnpm check`（Lint/Format）を通す
- `npx tsc --noEmit`（型チェック）を通す
- `pnpm build`（本番ビルド）を通す
- すべてパスするまで実装は完了としない

---

## 使用方法

```bash
/implement-tests                           # 失敗テストを検出して実装開始
/implement-tests schema.test.ts            # 特定のテストファイルのみ対象
/implement-tests --check-only              # 過剰実装チェックのみ実行
/implement-tests --max-iterations 10       # 最大イテレーション回数を指定
```

---

## 実行手順

### Phase 1: テストの分析

#### Step 1.1: 失敗テストの検出

```bash
# Vitestで失敗テストを検出
pnpm vitest run --reporter=json 2>&1
```

失敗テストを解析し、以下を抽出:
- テストファイルのパス
- 失敗したテストケースの名前
- エラーメッセージ
- 期待値と実際の値

#### Step 1.2: テストファイルの読み込み

失敗したテストファイルを読み込み、以下を分析:

| 分析項目 | 抽出内容 |
|---------|---------|
| import文 | テスト対象のモジュールパス |
| describe/it | テストの構造とケース |
| expect | 期待する動作・戻り値 |
| mock/stub | 依存関係のモック |

#### Step 1.3: 実装対象の特定

テストのimport文から実装すべきファイルを特定:

```typescript
// テストファイル
import { feedbackFormSchema } from '../schema'
//      ↑ 実装対象           ↑ 実装ファイルパス

// 特定結果
// 実装ファイル: src/app/(main)/feedback/_components/schema.ts
// エクスポート: feedbackFormSchema
```

---

### Phase 2: 実装計画の作成

#### Step 2.1: 依存関係の解析

実装順序を決定するため、依存関係を解析:

```
feedbackFormSchema (schema.ts)
    ↓ 依存なし → 最初に実装

createFeedback (adapter.ts)
    ↓ feedbackFormSchema に依存 → 2番目

FeedbackModal (component)
    ↓ feedbackFormSchema, createFeedback に依存 → 3番目
```

#### Step 2.2: TodoWriteで計画を作成

```markdown
## 実装計画

1. [ ] schema.ts - feedbackFormSchema を実装
   - 9個のテストケースをパスさせる
   - Zodスキーマとして実装

2. [ ] adapter.ts - createFeedback, getFeedbacks, toggleVote を実装
   - 8個のテストケースをパスさせる
   - Result型でエラーハンドリング

3. [ ] FeedbackModal.tsx - コンポーネントを実装
   - 5個のテストケースをパスさせる
   - Storybook定義と整合
```

---

### Phase 3: 実装サイクル（Green）

#### Step 3.1: 1つずつテストを通す

**重要**: 一度にすべてを実装しない。1つのテストをパスさせたら次へ進む。

```
For each failing test:
  1. テストが期待する動作を理解
  2. 最小限の実装を追加
  3. テストを実行
  4. パスしたら次のテストへ
  5. 失敗したら実装を修正
```

#### Step 3.2: 実装パターン

**Zodスキーマの場合**:

```typescript
// テストが期待すること
// SCH-02: category が必須
// SCH-03: category は BUG/FEATURE/UI_UX/OTHER のいずれか
// SCH-04: title が必須
// SCH-05: title は100文字以内

// 最小実装
import { z } from 'zod'

export const feedbackFormSchema = z.object({
  category: z.enum(['BUG', 'FEATURE', 'UI_UX', 'OTHER']),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  screenshotUrl: z.string().url().optional(),
})

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>
```

**Adapter関数の場合**:

```typescript
import { db } from '@/lib/db'
import { feedbacks } from '@/db/schema'
import { type Result, ok, err } from '@/types/result'

export const createFeedback = async (
  input: CreateFeedbackInput
): Promise<Result<Feedback>> => {
  try {
    const [feedback] = await db
      .insert(feedbacks)
      .values(input)
      .returning()

    return ok(feedback)
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'))
  }
}
```

#### Step 3.3: テスト実行と確認

各実装後にテストを実行:

```bash
# 特定のテストファイルのみ実行（高速）
pnpm vitest run schema.test.ts

# すべてのテストを実行
pnpm vitest run
```

---

### Phase 4: 過剰実装（Over-fitting）チェック

#### Step 4.1: チェック項目

実装完了後、以下の過剰実装パターンを検出:

| パターン | 例 | 問題点 |
|---------|-----|--------|
| ハードコード | `if (input === 'test') return 'expected'` | テストケースのみ対応 |
| マジックナンバー | `if (count === 42)` | テストの期待値をそのまま使用 |
| 条件分岐の乱用 | テストケース数と同じ数のif文 | 汎用性がない |
| 型アサーション | `as any` の多用 | 型安全性の放棄 |
| 空の実装 | `return {} as Feedback` | テストをパスするだけ |

#### Step 4.2: 検出ロジック

```typescript
// 過剰実装の検出例
function detectOverFitting(code: string, tests: Test[]): Warning[] {
  const warnings: Warning[] = []

  // 1. テストの期待値がハードコードされていないか
  for (const test of tests) {
    if (code.includes(test.expectedValue)) {
      warnings.push({
        type: 'HARDCODED_VALUE',
        message: `テスト "${test.name}" の期待値がそのままコードに含まれています`,
      })
    }
  }

  // 2. if文の数がテストケース数と近い
  const ifCount = (code.match(/if\s*\(/g) || []).length
  if (ifCount >= tests.length * 0.8) {
    warnings.push({
      type: 'TOO_MANY_BRANCHES',
      message: 'if文の数がテストケース数に近すぎます。汎用的な実装を検討してください',
    })
  }

  // 3. any型の使用
  if (code.includes(': any') || code.includes('as any')) {
    warnings.push({
      type: 'ANY_TYPE',
      message: 'any型が使用されています。適切な型を定義してください',
    })
  }

  return warnings
}
```

#### Step 4.3: 警告時の対応

過剰実装を検出した場合:

```
⚠ 過剰実装の疑いがあります:

1. [HARDCODED_VALUE] schema.ts:15
   テスト "title が100文字ちょうどは成功" の期待値がコードに含まれています
   → 文字数制限は変数や定数で管理することを推奨します

2. [TOO_MANY_BRANCHES] adapter.ts:30-45
   if文が8個あり、テストケース数（10個）に近すぎます
   → 共通ロジックを抽出して汎用化を検討してください

どうしますか？
[修正する] [このまま続行] [詳細を確認]
```

---

### Phase 5: 完了処理（品質検証）

**重要**: すべてのステップが成功するまで実装は完了とみなさない。

#### Step 5.1: 全テストの確認

```bash
pnpm vitest run
```

すべてのテストがパスしたことを確認。失敗がある場合は Phase 3 に戻る。

#### Step 5.2: Lint/Format確認

```bash
pnpm check
```

コーディング規約への準拠を確認。エラーがある場合は修正する。

#### Step 5.3: 型チェック

```bash
npx tsc --noEmit
```

TypeScriptの型エラーがないことを確認。エラーがある場合は以下を修正:
- 型の不一致
- 未使用のインポート/変数
- `exactOptionalPropertyTypes`関連のエラー（`undefined`を明示的に設定せずプロパティを省略）

#### Step 5.4: ビルド確認

```bash
pnpm build
```

本番ビルドが成功することを確認。ビルドエラーがある場合は修正する。

**よくあるビルドエラー**:
| エラー | 対処法 |
|--------|--------|
| 未使用のインポート | 該当のimport文を削除 |
| 型の不一致 | 正しい型を使用（例: `FieldErrors<T>`） |
| 存在しないプロパティ | コンポーネントの定義を確認（例: `variant`の値） |
| `exactOptionalPropertyTypes` | `undefined`を明示せずプロパティを省略 |

#### Step 5.5: サマリー出力

```markdown
## 実装完了サマリー

### 実装したファイル

| ファイル | 実装内容 | テスト数 |
|----------|---------|---------|
| `schema.ts` | feedbackFormSchema | 9 pass |
| `adapter.ts` | createFeedback, getFeedbacks, toggleVote | 8 pass |
| `FeedbackModal.tsx` | コンポーネント | 5 pass |

### イテレーション回数

- 総イテレーション: 7回
- 成功率: 100% (22/22 テスト)

### 品質検証結果

| チェック | 結果 |
|----------|------|
| テスト | ✅ 22/22 pass |
| Lint/Format | ✅ pass |
| 型チェック | ✅ pass |
| ビルド | ✅ pass |

### 過剰実装チェック

✅ 過剰実装は検出されませんでした

### 次のステップ

1. E2Eテストの実行:
   pnpm playwright test

2. Refactorフェーズ:
   - 重複コードの抽出
   - 命名の改善
   - パフォーマンス最適化
```

---

## 過剰実装チェックの詳細

### 検出パターン一覧

| ID | パターン | 検出方法 | 重大度 |
|----|---------|---------|--------|
| OF-01 | ハードコード値 | テストの期待値がコードに直接記述 | 高 |
| OF-02 | マジックナンバー | 数値リテラルの多用 | 中 |
| OF-03 | 条件分岐過多 | if/switch文がテスト数に比例 | 高 |
| OF-04 | any型使用 | 型安全性の放棄 | 高 |
| OF-05 | 空の実装 | `return {} as T` など | 高 |
| OF-06 | テスト専用分岐 | `if (process.env.NODE_ENV === 'test')` | 高 |
| OF-07 | 冗長なnullチェック | テストケースのみ対応したnullチェック | 中 |

### 良い実装 vs 過剰実装

**❌ 過剰実装の例**:

```typescript
// テストケースごとにif文
function validateTitle(title: string): boolean {
  if (title === 'テストタイトル') return true
  if (title.length === 100) return true
  if (title === 'a'.repeat(100)) return true
  return false
}
```

**✅ 適切な実装**:

```typescript
// 汎用的なルールベース
function validateTitle(title: string): boolean {
  return title.length >= 1 && title.length <= 100
}
```

---

## オプション

| オプション | 説明 |
|------------|------|
| `--check-only` | 過剰実装チェックのみ実行（実装は行わない） |
| `--max-iterations N` | 最大イテレーション回数（デフォルト: 20） |
| `--no-overfit-check` | 過剰実装チェックをスキップ |
| `--dry-run` | 実装計画のみ表示（ファイル変更なし） |
| `--verbose` | 詳細なログを出力 |

---

## エラーハンドリング

### テストが無限ループする場合

```
⚠ イテレーション上限（20回）に達しました

未解決のテスト:
- schema.test.ts > feedbackFormSchema > description > 2000文字を超える場合はエラー

考えられる原因:
1. テストの期待値と実装が根本的に異なる
2. 依存関係の問題
3. 非同期処理の問題

どうしますか？
[テストを確認] [実装を確認] [スキップして続行] [中止]
```

### 依存関係が解決できない場合

```
⚠ 依存関係を解決できません

adapter.ts が以下をインポートしていますが、存在しません:
- @/db/schema (feedbacks テーブル)

対応:
1. DBスキーマを先に実装する
2. モックを使用してテストする
3. 依存関係を手動で解決する

どうしますか？
[DBスキーマを確認] [モックで続行] [中止]
```

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/commands/gen-test.md` | テスト生成スキル（Redフェーズ） |
| `CLAUDE.md` | コーディング規約 |
| `src/types/result.ts` | Result型 |
| `vitest.config.ts` | Vitest設定 |
