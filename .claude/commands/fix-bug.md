---
allowed-tools: Read, Glob, Grep, Write, Edit, TodoWrite, Task, Bash, AskUserQuestion, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__replace_symbol_body, mcp__serena__find_referencing_symbols
description: バグ修正をTDDアプローチで行う。テストケースの見直しから始め、再現テスト作成→修正→検証の流れで進める。
---

# /fix-bug コマンド

## 概要

**バグ修正専用のTDDスキル**

バグが発生しているということは、テストケースが不足していたということ。
まずテストケースを見直し、バグを再現するテストを作成してから修正する。

```
[バグ報告] → テストケース見直し → 再現テスト作成（Red）→ 修正（Green）→ リファクタ
    ↓
 テストで二度と同じバグが発生しないことを保証
```

## 設計原則

### 1. テストファースト
- バグを修正する前に、必ずバグを再現するテストを書く
- テストが失敗することを確認してから修正を開始
- 修正後、テストがパスすることを確認

### 2. 根本原因の特定
- 表面的な症状だけでなく、根本原因を特定
- 関連するテストケースの不足も洗い出す
- 類似のバグが潜んでいないか確認

### 3. 回帰テストの追加
- 修正したバグが再発しないようテストを残す
- エッジケースや境界値のテストも追加
- テストは具体的なシナリオを説明するテスト名に

---

## 使用方法

```bash
/fix-bug                                    # バグ修正フローを開始
/fix-bug "検索で0件が表示されない"           # バグ内容を指定して開始
/fix-bug --issue 123                        # GitHub Issue番号から開始
```

---

## 実行手順

### Phase 1: バグの理解

#### Step 1.1: バグ情報の収集

```markdown
## バグ情報

### 報告内容
[バグの説明]

### 再現手順
1. ○○画面を開く
2. △△を入力
3. □□ボタンをクリック
4. 期待: ◇◇が表示される
5. 実際: ××が表示される（またはエラー）

### 環境
- ブラウザ: Chrome 120
- OS: Windows 11
- ログイン状態: あり
```

#### Step 1.2: 関連コードの特定

```bash
# 関連しそうなファイルを検索
# 例: エラーメッセージやコンポーネント名で検索
```

特定すべき情報:
| 情報 | 例 |
|------|-----|
| 該当コンポーネント | `SearchForm.tsx` |
| 該当関数/メソッド | `handleSearch()` |
| 関連スキーマ | `searchFormSchema` |
| 関連テストファイル | `searchFormSchema.test.ts` |

---

### Phase 2: テストケースの見直し（重要）

#### Step 2.1: 既存テストの確認

```bash
# 関連するテストファイルを確認
pnpm vitest run <related-test-file>
```

#### Step 2.2: テスト不足の分析

```markdown
## テストケース分析

### 既存のテスト
- ✅ 正常系: 有効な値でバリデーション成功
- ✅ 異常系: 必須項目が空でエラー
- ⚠️ 不足: 境界値（0, 上限値）のテスト
- ⚠️ 不足: null/undefined の処理

### バグの原因
テストケース不足により、以下のケースが漏れていた:
- 空文字列が数値フィールドに渡された場合の処理
```

#### Step 2.3: 不足テストのリストアップ

```markdown
## 追加すべきテスト

1. [ ] 空文字列がundefinedに変換されること
2. [ ] nullがundefinedに変換されること
3. [ ] 境界値（min=1, max=20）でのバリデーション
4. [ ] min > max の場合のバリデーションエラー
```

---

### Phase 3: 再現テストの作成（Red）

#### Step 3.1: バグを再現するテストを書く

```typescript
describe('searchFormSchema', () => {
  // 既存のテスト...

  // 🐛 バグ再現テスト（このテストが失敗することを確認）
  it('空文字列はundefinedに変換される（BUG-123修正）', () => {
    const result = searchFormSchema.safeParse({
      minPlayer: '',
      maxPlayer: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPlayer).toBeUndefined();
      expect(result.data.maxPlayer).toBeUndefined();
    }
  });
});
```

#### Step 3.2: テストが失敗することを確認

```bash
pnpm vitest run <test-file>
```

**重要**: テストが失敗しない場合、再現テストが正しくない可能性がある

```
✗ 空文字列はundefinedに変換される（BUG-123修正）
  Expected: undefined
  Received: NaN

これでバグが再現できた！
```

---

### Phase 4: バグ修正（Green）

#### Step 4.1: 最小限の修正

```typescript
// Before（バグあり）
const optionalNumber = z.coerce.number().optional();

// After（修正）
const optionalNumber = z.preprocess(
  (val) => (val === '' || val == null) ? undefined : val,
  z.coerce.number().optional(),
);
```

#### Step 4.2: テストがパスすることを確認

```bash
pnpm vitest run <test-file>
```

```
✓ 空文字列はundefinedに変換される（BUG-123修正）

全テストパス！
```

#### Step 4.3: 全テストの実行

```bash
pnpm vitest run
```

他のテストを壊していないことを確認。

---

### Phase 5: 追加テストと検証

#### Step 5.1: 関連するエッジケースのテスト追加

```typescript
describe('T-VAL-3: 空文字列の変換（BUG-123で追加）', () => {
  it('空文字列はundefinedに変換される', () => {
    // ...
  });

  it('nullはundefinedに変換される', () => {
    // ...
  });

  it('undefinedはそのままundefined', () => {
    // ...
  });
});
```

#### Step 5.2: 回帰テストの確認

```bash
# 全テストがパスすることを確認
pnpm vitest run

# Lintチェック
pnpm check
```

---

### Phase 6: 完了処理

#### Step 6.1: サマリー出力

```markdown
## バグ修正完了サマリー

### バグ内容
空文字列が数値フィールドに渡されたときにNaNになる

### 根本原因
z.coerce.number() が空文字列をNaNに変換していた

### 修正内容
z.preprocess で空文字列・null・undefinedを事前にundefinedに変換

### 追加したテスト
- 空文字列はundefinedに変換される
- nullはundefinedに変換される
- undefinedはそのままundefined

### テスト結果
✅ 全テストパス（25/25）
   - 既存: 22件
   - 追加: 3件

### 影響範囲
- `src/app/(main)/scenarios/_components/schema.ts`
```

#### Step 6.2: PROGRESS.md更新（必要に応じて）

バグ修正で新たなテストケースが追加された場合、該当機能のTDD進捗を更新:

```markdown
## TDD進捗: シナリオ検索

| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | ✅ | ✅ | ✅ | ✅ | ✅ | 完了（BUG-123追加テスト含む） |
```

---

## バグ修正のアンチパターン

### ❌ やってはいけないこと

| アンチパターン | 問題点 |
|---------------|--------|
| テストを書かずに修正 | 同じバグが再発する可能性 |
| 症状だけを修正 | 根本原因が残る |
| 大きな変更で修正 | 新たなバグを誘発 |
| 既存テストを削除して対応 | 品質が低下 |
| 「動いたからOK」 | 他の箇所を壊している可能性 |

### ✅ 正しいアプローチ

| アプローチ | 効果 |
|-----------|------|
| まずテストで再現 | バグの本質を理解 |
| 最小限の修正 | 副作用を最小化 |
| エッジケースも追加 | 類似バグの予防 |
| 全テスト実行 | 回帰を検出 |
| コードレビュー | 第三者の目で確認 |

---

## 複雑なバグへの対応

### 再現が難しい場合

1. **ログ追加**: 一時的にconsole.logで状態を確認
2. **条件の絞り込み**: どの条件で発生するか特定
3. **最小再現コード**: 最小限のコードでバグを再現
4. **環境差異の確認**: 開発環境と本番環境の違い

### 影響範囲が広い場合

1. **ブランチを切る**: 安全に修正作業
2. **段階的に修正**: 小さな修正を積み重ね
3. **各段階でテスト**: 常にグリーンを維持
4. **レビュー依頼**: 大きな変更は第三者確認

---

## オプション

| オプション | 説明 |
|------------|------|
| `--issue <number>` | GitHub Issue番号を指定 |
| `--no-refactor` | リファクタリングフェーズをスキップ |
| `--verbose` | 詳細なログを出力 |

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/commands/gen-test.md` | テスト生成スキル |
| `.claude/commands/implement-tests.md` | 実装スキル |
| `CLAUDE.md` | コーディング規約 |
| `vitest.config.ts` | Vitest設定 |

---

## 完了メッセージ

```
バグ修正が完了しました。

🐛 バグ: [バグの概要]
✅ 修正: [修正内容]
🧪 追加テスト: 3件

テスト結果: 全パス（25/25）

TDDアプローチにより、このバグは二度と発生しません。
```
