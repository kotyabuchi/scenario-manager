---
allowed-tools: Read, Glob, Grep, Write, Edit, TodoWrite, Task, AskUserQuestion, Skill
description: 要件定義書からテスト項目を洗い出し、失敗するテストを生成する（TDDのRedフェーズ）。
---

# /gen-test コマンド

## 概要

**TDD（テスト駆動開発）の「Red」フェーズを担当するスキル**

要件定義書からテスト項目を洗い出し、実装前に失敗するテストを生成する。
要件が不足している場合は `/requirements` スキルを呼び出して要件を補完する。

```
要件定義書 → テスト項目の洗い出し → 失敗するテストを生成（Red）
                ↓
        要件不足なら /requirements を呼び出し
```

## テストアーキテクチャ

| ツール | 役割 | テスト実行 |
|--------|------|-----------|
| **Storybook** | UIカタログ + Story定義 | ✕（テスト実行には使用しない） |
| **Vitest** | ユニット + コンポーネントテスト | ○（すべてのテストを実行） |
| **Playwright** | E2Eテスト | ○ |

**重要**: Storybookの`play`関数はデモ用であり、テストには使用しない。
コンポーネントのテストは `composeStories` を使ってVitestで実行する。

## 使用方法

```bash
/gen-test                              # 対話で要件定義書を選択
/gen-test feedback                     # requirements-feedback.md から生成
/gen-test US-F01 US-F02                # 特定のユーザーストーリーのみ
/gen-test シナリオ一覧機能             # 自然言語で機能を指定（該当要件を自動検索）
```

### オプション

| オプション | 説明 |
|------------|------|
| `--extract-only` | テスト項目の洗い出しのみ（テスト生成なし） |
| `--vitest-only` | Vitestのテストのみ生成 |
| `--playwright-only` | Playwrightのテストのみ生成 |
| `--dry-run` | 生成計画のみ表示（ファイル書き出しなし） |
| `--force` | 既存ファイルを確認なしで上書き |

## 実行手順

### Phase 1: 要件の特定と検証

#### Step 1.1: 要件定義書の特定

$ARGUMENTS を解析:

1. **要件定義書名が指定された場合**: `.claude/requirements/requirements-{名前}.md` を読み込む
   - 例: `feedback` → `requirements-feedback.md`

2. **US-XXX が指定された場合**: 全要件定義書から該当ユーザーストーリーを検索

3. **自然言語で機能名が指定された場合**: キーワードを抽出し、全要件定義書を Grep して該当箇所を特定
   - 例: `シナリオ一覧機能` → 「シナリオ」「検索」「一覧」で検索
   - 見つかった要件定義書から関連セクション（US-XXX、データモデル、画面仕様、バリデーションルール）を抽出
   - 複数候補がある場合は AskUserQuestion でどの範囲を対象とするか確認

4. **指定なしの場合**: `.claude/requirements/` の一覧から AskUserQuestion で選択

##### キーワードマッピング（よく使う機能名）

| 入力例 | 検索キーワード | 主な該当箇所 |
|--------|--------------|-------------|
| シナリオ一覧、シナリオ検索 | シナリオ, 検索, 一覧 | requirements-v1.md §5 |
| シナリオ詳細 | シナリオ詳細, /scenarios/[id] | requirements-v1.md §10 |
| セッション一覧 | セッション, 一覧, /sessions | requirements-v1.md §11 |
| セッション募集、セッション作成 | 募集, 参加, セッション | requirements-session-flow.md §3 |
| 日程調整 | 日程, 調整, カレンダー | requirements-session-flow.md §4 |
| レビュー | レビュー, 評価, コメント | requirements-v1.md §7, requirements-review-ui.md |
| フィードバック | フィードバック, 投稿, 投票 | requirements-feedback.md |
| ログイン、認証 | ログイン, 認証, Discord | requirements-v1.md §3 |

#### Step 1.2: 要件の完全性チェック

要件定義書を読み込み、テスト生成に必要な情報が揃っているか検証:

| チェック項目 | 必要な情報 | 不足時のアクション |
|-------------|-----------|-------------------|
| ユーザーストーリー | US-XXX 形式で定義 | `/requirements` を呼び出し |
| データモデル | テーブル定義、フィールド型 | `/requirements` を呼び出し |
| バリデーションルール | 文字数制限、必須項目、Enum値 | `/requirements` を呼び出し |
| 画面フロー | UI構成、操作フロー | `/requirements` を呼び出し |
| 権限制御 | 誰が何をできるか | `/requirements` を呼び出し |

**不足がある場合**: 不足項目を提示し、AskUserQuestion で確認:
`[はい（/requirementsで補完）] [スキップして続行] [中止]`

「はい」の場合は Skill ツールで呼び出す:
```typescript
Skill({ skill: "requirements", args: "refine feedback" })
```

#### Step 1.3: 既存コードの確認

テスト対象のコードが存在するか確認:

| 状態 | 対応 |
|------|------|
| adapter.ts が存在する | 実際の関数をインポートしてテスト |
| adapter.ts が存在しない | スタブ関数を定義（TDDモード） |
| コンポーネントが存在する | composeStories でテスト |
| コンポーネントが存在しない | Storybook + テストをスキップ |

---

### Phase 2: テスト項目の洗い出し

要件定義書から以下の3カテゴリでテスト項目を抽出し、表形式で整理する。

**項目表の形式**（全カテゴリ共通）:

| ID | テスト項目 | テスト種別 | 優先度 |
|----|-----------|-----------|--------|
| F01-01 | フィードバックボタンが全ページに表示される | E2E | 高 |
| SCH-05 | title は100文字以内 | Unit | 高 |
| AUTH-03 | 投稿者本人のみ編集できる | E2E | 高 |

#### Step 2.1: ユーザーストーリーから抽出

各 US-XXX を操作・表示・結果の観点でテスト項目に分解する。
ID は `{USの連番}-{連番}`（例: US-F01 → F01-01, F01-02...）。

#### Step 2.2: データモデルから抽出

バリデーションルール・制約条件をテスト項目に変換する（ID: `SCH-NN`）。
必須チェック、Enum値、文字数上限（ちょうど/超過の境界値）を必ず含める。

#### Step 2.3: 権限制御から抽出

未ログイン・MEMBER・MODERATOR 等のロール別にできる/できない操作をテスト項目化する（ID: `AUTH-NN`）。

#### Step 2.4: テスト項目の確認

抽出した項目の総数とカテゴリ別の内訳を提示し、AskUserQuestion で確認:
`[全てのテストを生成] [項目を選択して生成] [項目を追加] [要件を補完] [中止]`

#### Step 2.5: テスト項目の追加（「項目を追加」選択時）

ユーザーが自由記述で入力したテスト項目を解析し、適切なカテゴリ・テスト種別に分類して項目表に追加する。
追加後は `[さらに追加] [テスト生成に進む] [中止]` で確認。

**追加時の自動分類ルール**:

| キーワード | テスト種別 |
|-----------|-----------|
| 文字数、境界値、バリデーション | Unit |
| ボタン、表示、クリック | Component |
| フロー、ページ遷移、ログイン | E2E |

#### Step 2.6: 要件の補完（「要件を補完」選択時）

補完したい領域（バリデーションルール / 権限制御 / エラーケース / 画面フロー / その他）を確認し、`/requirements` を呼び出す:

```typescript
Skill({ skill: "requirements", args: "refine feedback --focus バリデーションルール" })
```

補完完了後、Step 2.1 に戻ってテスト項目を再抽出し、追加された項目を提示する。

---

### Phase 3: テストコードの生成（Red フェーズ）

以下のパターンに従ってテストファイルを生成する。
コメントで対応するテスト項目ID（`// SCH-05: ...`）を必ず記載する。

#### Step 3.1: Vitest ユニットテスト

**schema.test.ts（Zodバリデーション）** — `safeParse` で検証。Enum は `it.each`、文字数は境界値（ちょうど/超過）をテスト:

```typescript
import { describe, expect, it } from 'vitest'
import { feedbackFormSchema } from '../schema'

describe('feedbackFormSchema', () => {
  // SCH-01: 有効なデータでパース成功
  it('必須項目が揃っていれば成功', () => {
    const result = feedbackFormSchema.safeParse({
      category: 'BUG',
      title: 'テストタイトル',
      description: 'テストの説明文です',
    })
    expect(result.success).toBe(true)
  })

  // SCH-03: category は BUG/FEATURE/UI_UX/OTHER のいずれか
  it.each(['BUG', 'FEATURE', 'UI_UX', 'OTHER'])('category=%s は有効', (category) => {
    const result = feedbackFormSchema.safeParse({ category, title: 'テスト', description: 'テスト' })
    expect(result.success).toBe(true)
  })

  // SCH-05/06: title は100文字以内（境界値）
  it('title が100文字ちょうどは成功', () => {
    const result = feedbackFormSchema.safeParse({
      category: 'BUG', title: 'a'.repeat(100), description: 'テスト',
    })
    expect(result.success).toBe(true)
  })
  it('title が101文字はエラー', () => {
    const result = feedbackFormSchema.safeParse({
      category: 'BUG', title: 'a'.repeat(101), description: 'テスト',
    })
    expect(result.success).toBe(false)
  })
})
```

**adapter.test.ts（TDDモード）** — Result型（`isOk`/`isErr`）で検証。実装がまだ無い場合はスタブを使い、実装後に実関数へ差し替える:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isErr, isOk } from '@/types/result'

// TDDモード: adapter.ts 実装後に以下のコメントを外してスタブを削除
// import { createFeedback } from '../adapter'
const createFeedback = vi.fn()

describe('createFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-F01 / F01-05: 現在のページURLが自動で記録される
  it('フィードバックを作成できる', async () => {
    const input = { userId: 'user-123', category: 'BUG' as const, title: 'タイトル', description: '説明', pageUrl: '/scenarios' }
    createFeedback.mockResolvedValue({ success: true, data: { feedbackId: 'fb-123', ...input } })

    const result = await createFeedback(input)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.data.pageUrl).toBe('/scenarios')
    }
  })

  it('バリデーションエラー時はエラーを返す', async () => {
    createFeedback.mockResolvedValue({ success: false, error: new Error('Title is required') })

    const result = await createFeedback({ userId: 'user-123', category: 'BUG' as const, title: '', description: 'テスト' })

    expect(isErr(result)).toBe(true)
  })
})
```

#### Step 3.2: Vitest コンポーネントテスト

`composeStories` で Story を再利用し、Testing Library で検証する:

```typescript
import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as stories from './FeedbackButton.stories'

const { Default } = composeStories(stories)

describe('FeedbackButton', () => {
  // F01-02: ボタンクリックでモーダルが開く
  it('ボタンクリックでonClickが呼ばれる', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Default onClick={handleClick} />)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

検証観点: デフォルトレンダリング / インタラクション（クリック・キーボード）/ アクセシビリティ属性（`getByRole`, `aria-label`）。

#### Step 3.3: Storybook（UIカタログ用）

`satisfies Meta<typeof Component>` 形式。状態のバリエーション（Default / 入力済み / エラー等）を Story として定義する:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { FeedbackModal } from './FeedbackModal'

const meta = {
  title: 'Blocks/FeedbackModal',
  component: FeedbackModal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FeedbackModal>

export default meta
type Story = StoryObj<typeof meta>

/** デフォルト表示状態 */
export const Default: Story = {
  args: { isOpen: true },
}

/** バリデーションエラー状態 */
export const WithErrors: Story = {
  args: { isOpen: true, errors: { title: 'タイトルは必須です' } },
}
```

#### Step 3.4: Playwright E2Eテスト

`getByRole` / `getByLabel` ベースのロケータを使用。認証状態は `storageState` で制御する:

```typescript
import { expect, test } from '@playwright/test'

// 認証済み状態を使用
test.use({ storageState: 'e2e/.auth/user.json' })

test.describe('フィードバック投稿', () => {
  // F01-03: 必須項目を入力して送信できる
  test('必須項目を入力して送信できる', async ({ page }) => {
    await page.goto('/scenarios')
    await page.getByRole('button', { name: /フィードバック/i }).click()

    await page.getByRole('radio', { name: /バグ報告/i }).click()
    await page.getByLabel(/タイトル/i).fill('テストフィードバック')
    await page.getByLabel(/詳細/i).fill('テストの説明文です')
    await page.getByRole('button', { name: /送信/i }).click()

    // F01-04: 送信後に成功メッセージが表示される
    await expect(page.getByText(/送信しました/i)).toBeVisible()
  })
})

// AUTH-01: 未ログインユーザーのテストは storageState を空にする
test.describe('権限制御（未ログイン）', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('未ログインでアクセスするとログインページへリダイレクト', async ({ page }) => {
    await page.goto('/feedback')

    await expect(page).toHaveURL(/login/)
  })
})
```

---

### Phase 4: 生成結果の出力

#### Step 4.1: テスト項目サマリーの出力

```markdown
## テスト生成サマリー

### 生成したテスト項目: {N}件

| カテゴリ | 件数 | ファイル |
|----------|------|----------|
| スキーマバリデーション | 9 | `schema.test.ts` |
| Adapter関数 | 8 | `adapter.test.ts` |
| コンポーネント | 5 | `FeedbackButton.test.tsx` |
| E2E | 10 | `submit-feedback.spec.ts` |

### 生成したファイル

- `src/app/(main)/feedback/_components/schema.test.ts` ← NEW
- ...

### TDDモード

以下のファイルはまだ実装されていないため、スタブを使用:
- `src/app/(main)/feedback/_components/schema.ts`
- ...
```

#### Step 4.2: 次のステップを案内

```
テスト生成完了（Red フェーズ）

【次のステップ】
1. テストが失敗することを確認: pnpm vitest run
2. 実装を開始（Green フェーズ）: tdd-implementer エージェントで最小実装
3. E2Eテストは機能完成後に実行: pnpm test:e2e
4. リファクタリング（Refactor フェーズ）: tdd-refactorer エージェント

ヒント: 1つずつテストを通していくのがTDDの基本です
```

---

## ユーザーストーリーIDの形式

| 要件定義書 | プレフィックス | 例 |
|-----------|---------------|-----|
| requirements-v1.md | US-XXX | US-001, US-201 |
| requirements-feedback.md | US-FXXX | US-F01, US-F13 |
| requirements-session-flow.md | US-SXXX | US-S101, US-S401 |
| requirements-review-ui.md | US-4XX | US-411, US-416 |

---

## Vitestのプロジェクト構成

実際の構成は `vitest.config.ts` を参照（ドキュメント側に複製しない）。配置ルールの要点:

| プロジェクト | environment | 対象 |
|-------------|-------------|------|
| `unit` | node | `src/**/__tests__/**/*.test.ts(x)` |
| `component` | jsdom + `.storybook/vitest.setup.ts` | `src/**/*.test.tsx`（`__tests__/` 除く） |

- **ユニットテスト**（ロジック・スキーマ・adapter）→ `__tests__/` ディレクトリ配下に置く
- **コンポーネントテスト**（composeStories使用）→ コンポーネントと同階層に置く

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/requirements/requirements-*.md` | 要件定義書 |
| `.claude/commands/requirements.md` | 要件定義スキル |
| `src/types/result.ts` | Result型 |
| `vitest.config.ts` | Vitest設定（プロジェクト構成の正） |
| `.storybook/vitest.setup.ts` | コンポーネントテスト用セットアップ |
