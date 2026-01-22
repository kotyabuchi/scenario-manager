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
/gen-test セッション募集               # 自然言語で機能を指定
/gen-test --extract-only               # テスト項目の洗い出しのみ（テスト生成なし）
/gen-test --vitest-only                # Vitestのみ生成
/gen-test --playwright-only            # Playwrightのみ生成
```

## 実行手順

### Phase 1: 要件の特定と検証

#### Step 1.1: 要件定義書の特定

$ARGUMENTS を解析:

1. **要件定義書名が指定された場合**: `.claude/rules/requirements-{名前}.md` を読み込む
   - 例: `feedback` → `requirements-feedback.md`

2. **US-XXX が指定された場合**: 全要件定義書から該当ユーザーストーリーを検索

3. **自然言語で機能名が指定された場合**: 全要件定義書を検索して該当箇所を特定
   - 例: `シナリオ一覧機能` → 「シナリオ」「検索」「一覧」で検索

4. **指定なしの場合**: AskUserQuestion で選択

```bash
# 要件定義書の一覧を取得
ls .claude/rules/requirements-*.md
```

##### 自然言語からの要件検索ロジック

自然言語で機能名が指定された場合、以下の手順で該当要件を特定:

**Step A: キーワード抽出**

入力からキーワードを抽出:
```
入力: "シナリオ一覧機能のテスト作って"
キーワード: ["シナリオ", "一覧", "検索"]
```

**Step B: 全要件定義書を検索**

```bash
# 各要件定義書でキーワードを検索
grep -l "シナリオ" .claude/rules/requirements-*.md
```

**Step C: 該当セクションの特定**

見つかった要件定義書から、関連するセクションを抽出:
- ユーザーストーリー（US-XXX）
- データモデル
- 画面仕様
- バリデーションルール

**Step D: ユーザーに確認**

```
「シナリオ一覧機能」に関連する要件を検索しました:

📄 requirements-v1.md
  - セクション5: シナリオ検索（最重要機能）
  - US-201〜US-207: シナリオ検索のユーザーストーリー

📄 requirements-session-flow.md
  - セクション3.3: 募集一覧表示

どの範囲でテストを生成しますか？
[requirements-v1.md のシナリオ検索] [両方] [手動で選択] [中止]
```

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

**不足がある場合**:

```
⚠ 要件定義に不足があります:
- バリデーションルール: title の文字数制限が未定義
- 権限制御: 誰が削除できるか未定義

/requirements スキルを呼び出して要件を補完しますか？
[はい] [スキップして続行] [中止]
```

「はい」の場合:
```typescript
// Skill ツールで /requirements を呼び出し
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

#### Step 2.1: ユーザーストーリーからテスト項目を抽出

要件定義書の各ユーザーストーリーをテスト項目に変換:

```markdown
## テスト項目一覧

### US-F01: ユーザーとして、どのページからでもフィードバックを送れる

| ID | テスト項目 | テスト種別 | 優先度 |
|----|-----------|-----------|--------|
| F01-01 | フィードバックボタンが全ページに表示される | E2E | 高 |
| F01-02 | ボタンクリックでモーダルが開く | Component | 高 |
| F01-03 | 必須項目を入力して送信できる | E2E | 高 |
| F01-04 | 送信後に成功メッセージが表示される | E2E | 中 |
| F01-05 | 現在のページURLが自動で記録される | Unit | 中 |

### US-F02: ユーザーとして、バグ報告時にスクリーンショットを添付できる

| ID | テスト項目 | テスト種別 | 優先度 |
|----|-----------|-----------|--------|
| F02-01 | スクリーンショット添付ボタンが表示される | Component | 高 |
| F02-02 | 画像ファイルを選択できる | E2E | 高 |
| F02-03 | 選択した画像のプレビューが表示される | Component | 中 |
| F02-04 | 5MB以上の画像はエラーになる | Unit | 中 |
```

#### Step 2.2: データモデルからテスト項目を抽出

バリデーションルール、制約条件をテスト項目に変換:

```markdown
### feedbackFormSchema バリデーション

| ID | テスト項目 | テスト種別 | 優先度 |
|----|-----------|-----------|--------|
| SCH-01 | 有効なデータでパース成功 | Unit | 高 |
| SCH-02 | category が必須 | Unit | 高 |
| SCH-03 | category は BUG/FEATURE/UI_UX/OTHER のいずれか | Unit | 高 |
| SCH-04 | title が必須 | Unit | 高 |
| SCH-05 | title は100文字以内 | Unit | 高 |
| SCH-06 | title が101文字でエラー | Unit | 中 |
| SCH-07 | description が必須 | Unit | 高 |
| SCH-08 | description は2000文字以内 | Unit | 高 |
| SCH-09 | screenshotUrl は任意 | Unit | 低 |
```

#### Step 2.3: 権限制御からテスト項目を抽出

```markdown
### 権限制御テスト

| ID | テスト項目 | テスト種別 | 優先度 |
|----|-----------|-----------|--------|
| AUTH-01 | 未ログインユーザーはフィードバック一覧を閲覧できない | E2E | 高 |
| AUTH-02 | MEMBERはフィードバックを投稿できる | E2E | 高 |
| AUTH-03 | 投稿者本人のみ編集できる（ステータスがNEWの間） | E2E | 高 |
| AUTH-04 | MODERATORはステータスを変更できる | E2E | 中 |
| AUTH-05 | MEMBERはステータスを変更できない | E2E | 中 |
```

#### Step 2.4: テスト項目の確認と編集

**ユーザーに確認（AskUserQuestion）**:

```
以下のテスト項目を抽出しました（計 32 項目）:

【ユーザーストーリー】
- US-F01: 5項目
- US-F02: 4項目
- US-F03: 6項目
...

【バリデーション】
- feedbackFormSchema: 9項目

【権限制御】
- 5項目

どうしますか？
[全てのテストを生成] [項目を選択して生成] [項目を追加] [要件を補完] [中止]
```

---

#### Step 2.5: テスト項目の追加（「項目を追加」選択時）

ユーザーが追加したいテスト項目を自由記述で入力:

```
追加したいテスト項目を入力してください:
（例: 「title の境界値テスト（99文字、100文字、101文字）」）

> title の境界値テスト（99文字、100文字、101文字）を追加
> 送信ボタンの連打防止テストを追加
> done
```

入力されたテスト項目を解析し、適切なカテゴリ・テスト種別に分類:

```
以下のテスト項目を追加しました:

| ID | テスト項目 | テスト種別 | 優先度 |
|----|-----------|-----------|--------|
| SCH-10 | title が99文字で成功 | Unit | 中 |
| SCH-11 | title が100文字で成功 | Unit | 中 |
| SCH-12 | title が101文字でエラー | Unit | 中 |
| F01-06 | 送信ボタンの連打で重複送信されない | E2E | 高 |

続けて追加しますか？
[さらに追加] [テスト生成に進む] [中止]
```

**追加時の自動分類ルール**:
| キーワード | テスト種別 |
|-----------|-----------|
| 文字数、境界値、バリデーション | Unit |
| ボタン、表示、クリック | Component |
| フロー、ページ遷移、ログイン | E2E |

---

#### Step 2.6: 要件の補完（「要件を補完」選択時）

`/requirements` スキルを呼び出して要件を補完:

```
要件定義の不足を検出しました。/requirements スキルで補完します。

どの部分を補完しますか？
[バリデーションルール] [権限制御] [エラーケース] [画面フロー] [その他]
```

選択後、`/requirements` スキルを呼び出し:

```typescript
// Skill ツールで /requirements を呼び出し
Skill({ skill: "requirements", args: "refine feedback --focus バリデーションルール" })
```

補完完了後、Step 2.1 に戻ってテスト項目を再抽出:

```
要件定義が更新されました。テスト項目を再抽出します...

【追加されたテスト項目】
- SCH-10: pageUrl の形式バリデーション（URL形式のみ許可）
- SCH-11: browserInfo の最大サイズ制限（10KB以内）

続行しますか？
[テスト生成に進む] [さらに項目を追加] [中止]
```

---

### Phase 3: テストコードの生成（Red フェーズ）

#### Step 3.1: Vitest ユニットテストの生成

**schema.test.ts（Zodバリデーション）**:

```typescript
import { describe, expect, it } from 'vitest'

// TDDモード: スキーマが存在しない場合はテスト失敗を期待
// TODO: src/app/(main)/feedback/_components/schema.ts を実装
import { feedbackFormSchema } from '../schema'

describe('feedbackFormSchema', () => {
  // SCH-01: 有効なデータでパース成功
  describe('有効なデータ', () => {
    it('必須項目が揃っていれば成功', () => {
      const validData = {
        category: 'BUG',
        title: 'テストタイトル',
        description: 'テストの説明文です',
      }

      const result = feedbackFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('category', () => {
    // SCH-02: category が必須
    it('category が未指定の場合はエラー', () => {
      const data = { title: 'テスト', description: 'テスト' }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    // SCH-03: category は BUG/FEATURE/UI_UX/OTHER のいずれか
    it.each(['BUG', 'FEATURE', 'UI_UX', 'OTHER'])('category=%s は有効', (category) => {
      const data = { category, title: 'テスト', description: 'テスト' }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('無効なカテゴリはエラー', () => {
      const data = { category: 'INVALID', title: 'テスト', description: 'テスト' }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe('title', () => {
    // SCH-04: title が必須
    it('title が空の場合はエラー', () => {
      const data = { category: 'BUG', title: '', description: 'テスト' }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    // SCH-05: title は100文字以内
    it('title が100文字ちょうどは成功', () => {
      const data = {
        category: 'BUG',
        title: 'a'.repeat(100),
        description: 'テスト',
      }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    // SCH-06: title が101文字でエラー
    it('title が101文字を超える場合はエラー', () => {
      const data = {
        category: 'BUG',
        title: 'a'.repeat(101),
        description: 'テスト',
      }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe('description', () => {
    // SCH-07: description が必須
    it('description が空の場合はエラー', () => {
      const data = { category: 'BUG', title: 'テスト', description: '' }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    // SCH-08: description は2000文字以内
    it('description が2000文字を超える場合はエラー', () => {
      const data = {
        category: 'BUG',
        title: 'テスト',
        description: 'a'.repeat(2001),
      }
      const result = feedbackFormSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })
})
```

**adapter.test.ts（TDDモード）**:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isErr, isOk } from '@/types/result'

// TDDモード: adapter.ts が存在しない場合はスタブを使用
// TODO: 実装後に以下のコメントを外す
// import { createFeedback, getFeedbacks, toggleVote } from '../adapter'

// スタブ関数（実装前のプレースホルダー）
const createFeedback = vi.fn()
const getFeedbacks = vi.fn()
const toggleVote = vi.fn()

describe('Feedback Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createFeedback', () => {
    // US-F01: ユーザーとして、どのページからでもフィードバックを送れる
    // F01-05: 現在のページURLが自動で記録される
    it('フィードバックを作成できる', async () => {
      const input = {
        userId: 'user-123',
        category: 'BUG' as const,
        title: 'テストタイトル',
        description: 'テスト説明',
        pageUrl: '/scenarios',
      }

      createFeedback.mockResolvedValue({
        success: true,
        data: { feedbackId: 'fb-123', ...input },
      })

      const result = await createFeedback(input)

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.data.feedbackId).toBeDefined()
        expect(result.data.pageUrl).toBe('/scenarios')
      }
    })

    it('バリデーションエラー時はエラーを返す', async () => {
      const input = {
        userId: 'user-123',
        category: 'BUG' as const,
        title: '', // 空は無効
        description: 'テスト',
      }

      createFeedback.mockResolvedValue({
        success: false,
        error: new Error('Title is required'),
      })

      const result = await createFeedback(input)

      expect(isErr(result)).toBe(true)
    })
  })

  describe('getFeedbacks', () => {
    // US-F03: ユーザーとして、他の人のフィードバックを検索できる
    it('フィードバック一覧を取得できる', async () => {
      getFeedbacks.mockResolvedValue({
        success: true,
        data: [
          { feedbackId: 'fb-1', title: 'テスト1' },
          { feedbackId: 'fb-2', title: 'テスト2' },
        ],
      })

      const result = await getFeedbacks({ limit: 20 })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.data).toHaveLength(2)
      }
    })

    it('カテゴリでフィルタできる', async () => {
      getFeedbacks.mockResolvedValue({
        success: true,
        data: [{ feedbackId: 'fb-1', category: 'BUG' }],
      })

      const result = await getFeedbacks({ category: 'BUG' })

      expect(isOk(result)).toBe(true)
    })
  })

  describe('toggleVote', () => {
    // US-F04: ユーザーとして、フィードバックに投票できる
    it('投票を追加できる', async () => {
      toggleVote.mockResolvedValue({
        success: true,
        data: { hasVoted: true, voteCount: 5 },
      })

      const result = await toggleVote({
        feedbackId: 'fb-123',
        userId: 'user-123',
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.data.hasVoted).toBe(true)
      }
    })

    it('投票を取り消しできる', async () => {
      toggleVote.mockResolvedValue({
        success: true,
        data: { hasVoted: false, voteCount: 4 },
      })

      const result = await toggleVote({
        feedbackId: 'fb-123',
        userId: 'user-123',
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.data.hasVoted).toBe(false)
      }
    })
  })
})
```

#### Step 3.2: Vitest コンポーネントテストの生成

```typescript
import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import * as stories from './FeedbackButton.stories'

const { Default } = composeStories(stories)

describe('FeedbackButton', () => {
  // F01-01: フィードバックボタンが全ページに表示される（E2Eで検証）
  // F01-02: ボタンクリックでモーダルが開く
  it('デフォルト状態でレンダリングできる', () => {
    render(<Default />)

    expect(
      screen.getByRole('button', { name: 'フィードバックを送る' })
    ).toBeInTheDocument()
  })

  it('ボタンクリックでonClickが呼ばれる', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Default onClick={handleClick} />)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('アクセシビリティ属性が正しく設定されている', () => {
    render(<Default />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
  })
})
```

#### Step 3.3: Storybook の生成（UIカタログ用）

```typescript
import type { Meta, StoryObj } from '@storybook/react'

import { FeedbackModal } from './FeedbackModal'

const meta = {
  title: 'Blocks/FeedbackModal',
  component: FeedbackModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FeedbackModal>

export default meta
type Story = StoryObj<typeof meta>

/**
 * デフォルト表示状態
 */
export const Default: Story = {
  args: {
    isOpen: true,
  },
}

/**
 * カテゴリ選択済み（バグ報告）
 */
export const BugReport: Story = {
  args: {
    isOpen: true,
    defaultValues: {
      category: 'BUG',
    },
  },
}

/**
 * 入力済み状態
 */
export const Filled: Story = {
  args: {
    isOpen: true,
    defaultValues: {
      category: 'FEATURE',
      title: '検索条件の保存機能',
      description: 'よく使う検索条件を保存できると便利です',
    },
  },
}

/**
 * バリデーションエラー状態
 */
export const WithErrors: Story = {
  args: {
    isOpen: true,
    errors: {
      title: 'タイトルは必須です',
      description: '詳細は必須です',
    },
  },
}
```

#### Step 3.4: Playwright E2Eテストの生成

```typescript
import { expect, test } from '@playwright/test'

// 認証済み状態を使用
test.use({ storageState: 'e2e/.auth/user.json' })

test.describe('フィードバック投稿', () => {
  // US-F01: ユーザーとして、どのページからでもフィードバックを送れる
  test.describe('F01: フィードバック投稿フロー', () => {
    // F01-01: フィードバックボタンが全ページに表示される
    test('フィードバックボタンが全ページに表示される', async ({ page }) => {
      // シナリオ一覧
      await page.goto('/scenarios')
      await expect(page.getByRole('button', { name: /フィードバック/i })).toBeVisible()

      // セッション一覧
      await page.goto('/sessions')
      await expect(page.getByRole('button', { name: /フィードバック/i })).toBeVisible()

      // ホーム
      await page.goto('/home')
      await expect(page.getByRole('button', { name: /フィードバック/i })).toBeVisible()
    })

    // F01-02: ボタンクリックでモーダルが開く
    test('ボタンクリックでモーダルが開く', async ({ page }) => {
      await page.goto('/scenarios')

      await page.getByRole('button', { name: /フィードバック/i }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('フィードバックを送る')).toBeVisible()
    })

    // F01-03: 必須項目を入力して送信できる
    test('必須項目を入力して送信できる', async ({ page }) => {
      await page.goto('/scenarios')
      await page.getByRole('button', { name: /フィードバック/i }).click()

      // カテゴリ選択
      await page.getByRole('radio', { name: /バグ報告/i }).click()

      // 入力
      await page.getByLabel(/タイトル/i).fill('テストフィードバック')
      await page.getByLabel(/詳細/i).fill('テストの説明文です')

      // 送信
      await page.getByRole('button', { name: /送信/i }).click()

      // F01-04: 送信後に成功メッセージが表示される
      await expect(page.getByText(/送信しました/i)).toBeVisible()
    })
  })

  // US-F02: ユーザーとして、バグ報告時にスクリーンショットを添付できる
  test.describe('F02: スクリーンショット添付', () => {
    // F02-01: スクリーンショット添付ボタンが表示される
    test('スクリーンショット添付ボタンが表示される', async ({ page }) => {
      await page.goto('/scenarios')
      await page.getByRole('button', { name: /フィードバック/i }).click()

      await expect(page.getByRole('button', { name: /スクリーンショット/i })).toBeVisible()
    })

    // F02-02, F02-03: 画像ファイルを選択してプレビュー表示
    test('画像を添付するとプレビューが表示される', async ({ page }) => {
      await page.goto('/scenarios')
      await page.getByRole('button', { name: /フィードバック/i }).click()

      // ファイル選択
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles('e2e/fixtures/test-screenshot.png')

      // プレビュー表示を確認
      await expect(page.getByRole('img', { name: /プレビュー/i })).toBeVisible()
    })
  })
})

test.describe('フィードバック一覧', () => {
  // US-F03: ユーザーとして、他の人のフィードバックを検索できる
  test('フィードバック一覧を検索できる', async ({ page }) => {
    await page.goto('/feedback')

    // 検索
    await page.getByPlaceholder(/検索/i).fill('検索テスト')
    await page.getByRole('button', { name: /検索/i }).click()

    // 結果が表示される（または0件メッセージ）
    await expect(
      page.getByText(/件/).or(page.getByText(/見つかりませんでした/i))
    ).toBeVisible()
  })

  // US-F04: ユーザーとして、フィードバックに投票できる
  test('フィードバックに投票できる', async ({ page }) => {
    await page.goto('/feedback')

    // 最初のフィードバックカードの投票ボタン
    const voteButton = page.getByRole('button', { name: /投票/i }).first()
    const initialCount = await voteButton.textContent()

    await voteButton.click()

    // 投票数が変わる（楽観的更新）
    await expect(voteButton).not.toHaveText(initialCount!)
  })
})

// 権限制御テスト
test.describe('権限制御', () => {
  // AUTH-01: 未ログインユーザーはフィードバック一覧を閲覧できない
  test.describe('未ログインユーザー', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('フィードバック一覧にアクセスするとログインページへリダイレクト', async ({
      page,
    }) => {
      await page.goto('/feedback')

      await expect(page).toHaveURL(/login/)
    })
  })
})
```

---

### Phase 4: 生成結果の出力

#### Step 4.1: テスト項目サマリーの出力

```markdown
## テスト生成サマリー

### 生成したテスト項目: 32件

| カテゴリ | 件数 | ファイル |
|----------|------|----------|
| スキーマバリデーション | 9 | `schema.test.ts` |
| Adapter関数 | 8 | `adapter.test.ts` |
| コンポーネント | 5 | `FeedbackButton.test.tsx` |
| E2E | 10 | `submit-feedback.spec.ts`, `vote-feedback.spec.ts` |

### 生成したファイル

- `src/app/(main)/feedback/_components/schema.test.ts` ← NEW
- `src/app/(main)/feedback/__tests__/adapter.test.ts` ← NEW
- `src/components/blocks/FeedbackButton/FeedbackButton.test.tsx` ← NEW
- `src/components/blocks/FeedbackModal/FeedbackModal.stories.tsx` ← NEW
- `e2e/feedback/submit-feedback.spec.ts` ← NEW
- `e2e/feedback/vote-feedback.spec.ts` ← NEW

### TDDモード

以下のファイルはまだ実装されていないため、スタブを使用:
- `src/app/(main)/feedback/_components/schema.ts`
- `src/app/(main)/feedback/adapter.ts`
- `src/components/blocks/FeedbackModal/FeedbackModal.tsx`
```

#### Step 4.2: 次のステップを案内

```
✅ テスト生成完了（Red フェーズ）

【次のステップ】

1. テストが失敗することを確認:
   pnpm vitest run

2. 実装を開始（Green フェーズ）:
   - schema.ts を実装 → schema.test.ts が通る
   - adapter.ts を実装 → adapter.test.ts が通る
   - コンポーネントを実装 → *.test.tsx が通る

3. E2Eテストは機能完成後に実行:
   pnpm playwright test

4. リファクタリング（Refactor フェーズ）

💡 ヒント: 1つずつテストを通していくのがTDDの基本です
```

---

## オプション

| オプション | 説明 |
|------------|------|
| `--extract-only` | テスト項目の洗い出しのみ（テスト生成なし） |
| `--vitest-only` | Vitestのテストのみ生成 |
| `--playwright-only` | Playwrightのテストのみ生成 |
| `--dry-run` | 生成計画のみ表示（ファイル書き出しなし） |
| `--force` | 既存ファイルを確認なしで上書き |

---

## 要件不足時の /requirements 呼び出し

テスト項目の洗い出し中に要件の不足を検出した場合:

```typescript
// Skill ツールで /requirements を呼び出し
Skill({ skill: "requirements", args: "refine feedback" })
```

呼び出すケース:
- ユーザーストーリーが抽象的すぎてテスト項目に落とせない
- バリデーションルール（文字数、必須、Enum値）が未定義
- 権限制御（誰が何をできるか）が未定義
- エラーケースの挙動が未定義

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

```typescript
// vitest.config.ts
projects: [
  {
    name: 'unit',           // ユニットテスト
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
  },
  {
    name: 'component',      // コンポーネントテスト
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
    exclude: ['src/**/__tests__/**'],
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
]
```

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `.claude/rules/requirements-*.md` | 要件定義書 |
| `.claude/commands/requirements.md` | 要件定義スキル |
| `src/types/result.ts` | Result型 |
| `vitest.config.ts` | Vitest設定 |
| `.storybook/vitest.setup.ts` | コンポーネントテスト用セットアップ |
