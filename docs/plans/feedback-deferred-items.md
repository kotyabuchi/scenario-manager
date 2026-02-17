# フィードバック機能 保留事項の一括実装

## Context

フィードバック管理システム Phase 1 MVP の実装後レビューで、以下4つの保留事項が特定された。
UX / 技術の両面からクロスレビューを実施し、合意された優先順位で実装する。

**保留事項**:
- **A**: コメント数ソートの実装（現在 `vote_count` にフォールバック）
- **B**: ステータスフィルタの UI 改善（チェックボックス個別選択 → ユーザーに見えるトグル）
- **C**: 投稿者による編集・削除機能
- **D**: 一覧ページの「新規投稿」ボタン追加

## 決定事項

| 項目 | 決定 |
|------|------|
| 実装順 | C-Phase1(削除) → D+B(UIボタン+トグル) → A(DBカラム) → C-Phase2(編集) |
| 削除確認UI | 既存 `Modal` コンポーネントを再利用（専用 Dialog 不要） |
| 編集UI | 既存 `FeedbackModal` に `mode: 'edit'` を追加（新規コンポーネント不要） |
| コメント数カラム | `comment_count` を `feedbacks` テーブルに追加、DBトリガーで自動更新 |
| ステータストグル | `Checkbox` コンポーネントで「見送り・統合済みも表示」をトグル |

## 前提条件

- `feedbacks` テーブルの `comment_count` カラム追加は手動 SQL マイグレーションが必要
- 既存の `vote_count` トリガーと同様のパターンで `comment_count` トリガーを作成
- FeedbackModal の edit モードでは、ステータスが NEW/TRIAGED の場合のみ編集可能

---

## Batch 1: 投稿者による削除機能

### Step 1-1. adapter に削除関数を追加

**ファイル**: `src/app/(main)/feedback/adapter.ts`

```typescript
export const deleteFeedback = async (
  feedbackId: string,
  userId: string,
): Promise<Result<void>> => {
  const supabase = await createDbClient()

  // 投稿者本人 & ステータス NEW のみ削除可能
  const { data: feedback } = await supabase
    .from('feedbacks')
    .select('user_id, status')
    .eq('feedback_id', feedbackId)
    .maybeSingle()

  if (isNil(feedback)) return err(new Error('フィードバックが見つかりません'))
  if (feedback.user_id !== userId) return err(new Error('削除権限がありません'))
  if (feedback.status !== 'NEW') return err(new Error('受付中のフィードバックのみ削除できます'))

  // ON DELETE CASCADE により関連データ（投票・コメント）は自動削除される
  const { error } = await supabase.from('feedbacks').delete().eq('feedback_id', feedbackId)

  if (error) return err(new Error(error.message))
  return ok(undefined)
}
```

### Step 1-2. Server Action に削除アクションを追加

**ファイル**: `src/app/(main)/feedback/actions.ts`

```typescript
export const deleteFeedbackAction = async (
  feedbackId: string,
): Promise<{ success: boolean; error?: string }> => {
  const user = await getAuthUser()
  if (isNil(user)) return { success: false, error: 'ログインが必要です' }

  const result = await deleteFeedback(feedbackId, user.user_id)
  if (!result.success) {
    logger.error`フィードバック削除失敗: ${result.error}`
    return { success: false, error: result.error.message }
  }

  revalidatePath('/feedback')
  return { success: true }
}
```

### Step 1-3. 削除確認ダイアログ付きの ActionSection コンポーネント

**ファイル**: `src/app/(main)/feedback/[id]/_components/ActionSection.tsx`（新規）

投稿者本人 かつ ステータスが `NEW` の場合のみ表示。
削除ボタンクリック → `Modal` で確認 → `deleteFeedbackAction` → `/feedback` へ redirect。

- `Modal` は既存 `@/components/elements/modal` を使用
- `Button` の `status="danger"` を使用
- `Trash` アイコンを使用（`@phosphor-icons/react/ssr`）
- 削除ボタンに `aria-label="このフィードバックを削除"` を付与
- `useTransition` で `isPending` を管理し、削除ボタンに `disabled={isPending}` を付与（二重クリック防止）
- 削除成功後は `useRouter().push('/feedback')` で一覧に戻る
- 削除確認メッセージ: 「このフィードバックを削除しますか？関連する投票・コメントもすべて削除されます。この操作は取り消せません。」

**Props**:
```typescript
type ActionSectionProps = {
  feedbackId: string
  isAuthor: boolean   // 投稿者本人か
  status: string      // フィードバックのステータス
}
```

### Step 1-4. スタイル追加

**ファイル**: `src/app/(main)/feedback/[id]/_components/styles.ts`（既存に追加）

```typescript
export const actionSection = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
})

export const deleteConfirm_message = css({
  fontSize: 'sm',
  color: 'gray.700',
  lineHeight: '[1.7]',
})
```

### Step 1-5. 詳細ページに ActionSection を統合

**ファイル**: `src/app/(main)/feedback/[id]/page.tsx`

- `currentUserId` と `feedback.userId` を比較して `isAuthor` を判定
- `<ActionSection>` を FeedbackDetailContent の直後（`<hr>` の前）に配置
- `isAuthor && feedback.status === 'NEW'` の場合のみ描画

---

## Batch 2: 一覧ページ「新規投稿」ボタン + ステータストグル

### Step 2-1. FeedbackContent に新規投稿ボタンを追加

**ファイル**: `src/app/(main)/feedback/_components/FeedbackContent.tsx`

**変更内容**:
1. ページ上部（`contentHeader` の先頭）にヘッダー行を追加:
   - 左: 「フィードバック」見出し（`<h2>`）
   - 右: 「新規投稿」ボタン → `FeedbackModal` を開く
2. `FeedbackModal` の state (`open`, `onOpenChange`) を FeedbackContent 内で管理
3. `Plus` アイコン + `Button` の `status="primary"` を使用

> **将来検討**: ヘッダー部分の責務が広がった場合、`FeedbackPageHeader` コンポーネントへの切り出しを検討

```tsx
// ヘッダー行のイメージ
<div className={styles.pageHeader}>
  <h2 className={styles.pageTitle}>フィードバック</h2>
  <Button status="primary" size="sm" onClick={() => setModalOpen(true)}>
    <Plus size={16} weight="bold" />
    新規投稿
  </Button>
</div>
<FeedbackModal open={modalOpen} onOpenChange={(d) => setModalOpen(d.open)} />
```

### Step 2-2. ステータストグルを searchRow に追加

**ファイル**: `src/app/(main)/feedback/_components/FeedbackContent.tsx`

**変更内容**:
- 既存の `searchRow` に `Checkbox` コンポーネントを追加: 「見送り・統合済みも表示」
- 既存の `mineToggle`（生の `<input type="checkbox">`）も `Checkbox` コンポーネントに統一
- チェック OFF（デフォルト）: `DEFAULT_STATUSES`（WONT_FIX, DUPLICATE 除外）
- チェック ON: `ALL_STATUSES`（全ステータス表示）
- `statuses` の `useQueryState` を `setStatuses` 付きに変更（現在は `[statuses]` のみ）

```tsx
import { Checkbox } from '@/components/elements/checkbox'

const [statuses, setStatuses] = useQueryState(
  'statuses',
  parseAsArrayOf(parseAsString, ',').withDefault(DEFAULT_STATUSES),
)

// トグル状態は ALL_STATUSES との一致で判定（length 比較は URL 手動編集時に誤判定の恐れ）
const isShowAll = ALL_STATUSES.every((s) => statuses.includes(s))

// UIコンポーネント
<Checkbox
  checked={isShowAll}
  onCheckedChange={(details) =>
    setStatuses(details.checked ? ALL_STATUSES : DEFAULT_STATUSES)
  }
>
  見送り・統合済みも表示
</Checkbox>
```

### Step 2-3. searchParams に ALL_STATUSES を追加

**ファイル**: `src/app/(main)/feedback/searchParams.ts`

```typescript
export const ALL_STATUSES = [
  'NEW', 'TRIAGED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'WONT_FIX', 'DUPLICATE',
]
```

### Step 2-4. スタイル追加

**ファイル**: `src/app/(main)/feedback/_components/styles.ts`（既存に追加）

```typescript
export const pageHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const pageTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'gray.900',
})

export const statusToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  color: 'gray.700',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})
```

---

## Batch 3: コメント数ソート（DB カラム追加）

### Step 3-1. SQL マイグレーション

手動で Supabase SQL Editor にて実行:

```sql
-- 0. ON DELETE CASCADE 制約の追加（関連データの安全な自動削除）
ALTER TABLE feedback_votes
  DROP CONSTRAINT IF EXISTS feedback_votes_feedback_id_fkey,
  ADD CONSTRAINT feedback_votes_feedback_id_fkey
    FOREIGN KEY (feedback_id) REFERENCES feedbacks(feedback_id) ON DELETE CASCADE;

ALTER TABLE feedback_comments
  DROP CONSTRAINT IF EXISTS feedback_comments_feedback_id_fkey,
  ADD CONSTRAINT feedback_comments_feedback_id_fkey
    FOREIGN KEY (feedback_id) REFERENCES feedbacks(feedback_id) ON DELETE CASCADE;

-- 1. カラム追加
ALTER TABLE feedbacks ADD COLUMN comment_count integer NOT NULL DEFAULT 0;

-- 2. 既存データの集計
UPDATE feedbacks f SET comment_count = (
  SELECT COUNT(*) FROM feedback_comments fc WHERE fc.feedback_id = f.feedback_id
);

-- 3. トリガー関数
CREATE OR REPLACE FUNCTION update_feedback_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedbacks SET comment_count = comment_count + 1
    WHERE feedback_id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedbacks SET comment_count = comment_count - 1
    WHERE feedback_id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガー作成
CREATE TRIGGER feedback_comments_count_trigger
AFTER INSERT OR DELETE ON feedback_comments
FOR EACH ROW EXECUTE FUNCTION update_feedback_comment_count();
```

### Step 3-2. Supabase 型再生成

```bash
pnpm supabase gen types typescript --project-id <ID> > src/db/types.ts
```

### Step 3-3. adapter のソートロジック更新

**ファイル**: `src/app/(main)/feedback/adapter.ts`

```typescript
case 'comments':
  query = query.order('comment_count', { ascending: false })
  break
```

TODO コメントを削除する。

### Step 3-4. searchFeedbacks の commentCount マッピング更新

**ファイル**: `src/app/(main)/feedback/adapter.ts`

`searchFeedbacks` 関数内の `commentCount` マッピングを `comment_count` カラムから直接取得に変更:

```typescript
// Before:
// comments:feedback_comments(count) を select に含めていた
// commentCount: comments?.[0]?.count ?? 0

// After:
// select から feedback_comments(count) を削除
// commentCount は camelRow.commentCount で直接取得（camelCaseKeys で変換済み）
```

select 文から `comments:feedback_comments(count)` を削除し、代わりに `comment_count` カラムを直接使う。

### Step 3-5. API route の更新

**ファイル**: `src/app/api/feedback/search/route.ts`

既に `sort` パラメータを adapter に渡しているため、adapter の修正で自動的に対応される。
変更不要だが、動作確認は必要。

---

## Batch 4: 投稿者による編集機能

### Step 4-1. adapter に更新関数を追加

**ファイル**: `src/app/(main)/feedback/adapter.ts`

```typescript
export const updateFeedback = async (
  feedbackId: string,
  userId: string,
  data: { category: string; title: string; description: string },
): Promise<Result<void>> => {
  const supabase = await createDbClient()

  // 投稿者本人 & ステータス NEW/TRIAGED のみ編集可能
  const { data: feedback } = await supabase
    .from('feedbacks')
    .select('user_id, status')
    .eq('feedback_id', feedbackId)
    .maybeSingle()

  if (isNil(feedback)) return err(new Error('フィードバックが見つかりません'))
  if (feedback.user_id !== userId) return err(new Error('編集権限がありません'))
  if (feedback.status !== 'NEW' && feedback.status !== 'TRIAGED')
    return err(new Error('受付中または検討中のフィードバックのみ編集できます'))

  // TRIAGED で編集した場合は NEW にリセット
  const newStatus = feedback.status === 'TRIAGED' ? 'NEW' : feedback.status

  const { error } = await supabase
    .from('feedbacks')
    .update({
      category: data.category as FeedbackCategory,
      title: data.title,
      description: data.description,
      status: newStatus as FeedbackStatus,
    })
    .eq('feedback_id', feedbackId)

  if (error) return err(new Error(error.message))
  return ok(undefined)
}
```

### Step 4-2. Server Action に更新アクションを追加

**ファイル**: `src/components/blocks/FeedbackModal/actions.ts`

```typescript
export const updateFeedbackAction = async (
  feedbackId: string,
  input: FeedbackFormValues,
): Promise<Result<void>> => {
  // 認証確認
  // Zodバリデーション
  // ユーザーID取得
  // updateFeedback(feedbackId, userId, input) 呼び出し
  // revalidatePath('/feedback') + revalidatePath(`/feedback/${feedbackId}`)
}
```

### Step 4-3. FeedbackModal を編集モードに拡張

**ファイル**: `src/components/blocks/FeedbackModal/FeedbackModal.tsx`

**Props 変更**:
```typescript
type FeedbackModalProps = {
  open: boolean
  onOpenChange: (details: { open: boolean }) => void
  // 編集モード用（省略時は新規作成モード）
  editTarget?: {
    feedbackId: string
    category: string
    title: string
    description: string
  }
}
```

**変更点**:
1. `editTarget` が存在する場合、タイトルを「フィードバックを編集」に変更
2. `useEffect` で `editTarget` が変わったときに `reset()` を呼んでフォームを初期値にリセット
3. 送信時に `editTarget` の有無で `createFeedbackAction` / `updateFeedbackAction` を分岐
4. 編集モードではスクリーンショット添付ボタン、ヒントボックス、メタ情報を非表示
5. 送信成功メッセージを「更新しました」に変更（編集時）。既存のシステムメッセージフックを活用

**重要**: React Hook Form の `defaultValues` はマウント時のみ反映されるため、
`editTarget` 変更時に `reset({ category, title, description })` を `useEffect` で呼ぶ必要がある。

### Step 4-4. ActionSection に編集ボタンを追加

**ファイル**: `src/app/(main)/feedback/[id]/_components/ActionSection.tsx`

- 編集ボタン: ステータスが `NEW` または `TRIAGED` の場合に表示（`aria-label="このフィードバックを編集"`）
- 削除ボタン: ステータスが `NEW` の場合のみ表示（`aria-label="このフィードバックを削除"`）
- 編集ボタンクリック → `FeedbackModal` を `editTarget` 付きで開く

**Props 変更**:
```typescript
type ActionSectionProps = {
  feedbackId: string
  isAuthor: boolean
  status: string
  feedback: {                // 編集用データ
    category: string
    title: string
    description: string
  }
}
```

### Step 4-5. 詳細ページで feedback データを ActionSection に渡す

**ファイル**: `src/app/(main)/feedback/[id]/page.tsx`

```tsx
<ActionSection
  feedbackId={id}
  isAuthor={currentUserId === feedback.userId}
  status={feedback.status}
  feedback={{
    category: feedback.category,
    title: feedback.title,
    description: feedback.description,
  }}
/>
```

---

## ファイル一覧

| ファイル | 操作 | Batch |
|----------|------|-------|
| `src/app/(main)/feedback/adapter.ts` | 変更 | 1, 3, 4 |
| `src/app/(main)/feedback/actions.ts` | 変更 | 1 |
| `src/app/(main)/feedback/searchParams.ts` | 変更 | 2 |
| `src/app/(main)/feedback/_components/FeedbackContent.tsx` | 変更 | 2 |
| `src/app/(main)/feedback/_components/styles.ts` | 変更 | 2 |
| `src/app/(main)/feedback/[id]/page.tsx` | 変更 | 1, 4 |
| `src/app/(main)/feedback/[id]/_components/ActionSection.tsx` | 新規 | 1, 4 |
| `src/app/(main)/feedback/[id]/_components/styles.ts` | 変更 | 1 |
| `src/components/blocks/FeedbackModal/FeedbackModal.tsx` | 変更 | 4 |
| `src/components/blocks/FeedbackModal/actions.ts` | 変更 | 4 |
| SQL マイグレーション（手動実行） | 新規 | 3 |
| `src/db/types.ts` | 再生成 | 3 |

## 検証方法

### 各 Batch 完了後

1. `pnpm check` -- lint / format 通過
2. `pnpm build` -- ビルド成功

### Batch 1（削除）

- `/feedback/[id]` で自分の NEW 投稿に「削除」ボタンが表示される
- 削除確認モーダルが表示され、「削除する」で削除 → `/feedback` にリダイレクト
- 他人の投稿、または NEW 以外のステータスでは削除ボタンが非表示

### Batch 2（新規投稿 + トグル）

- `/feedback` に「新規投稿」ボタンが表示され、クリックで FeedbackModal が開く
- 「見送り・統合済みも表示」チェックボックスで WONT_FIX / DUPLICATE の投稿が表示切替

### Batch 3（コメント数ソート）

- ソート「コメント数順」選択時にコメント数の降順で表示される
- コメント追加後にカウントが自動更新される

### Batch 4（編集）

- `/feedback/[id]` で自分の NEW/TRIAGED 投稿に「編集」ボタンが表示される
- 編集モーダルで既存データが入力済み、送信で更新される
- TRIAGED の投稿を編集した場合、ステータスが NEW にリセットされる
