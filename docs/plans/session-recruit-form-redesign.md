# セッション募集フォーム リデザイン

## Context

セッション募集フォーム（`/sessions/new`）は TDD で先行実装済みだが、UIはネイティブHTML要素（`<input>`, `<select>`, `<textarea>`, `<checkbox>`, `<radio>`）で構成された最低限の状態。セッション詳細・参加申請・日程調整など他のセッション画面はモックベースのリデザインが完了済みで、募集フォームのみ旧UIが残っている。

モックデザイン（3画面: 基本状態、シナリオ選択状態、シナリオ検索モーダル）に基づき、既存コンポーネントライブラリを活用してフル実装する。参加者セクション（メンバー追加・役割設定）とシナリオ検索モーダルも含む。

**モック**: `docs/designs/mocks/セッション/セッション募集フォーム_*`

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| 参加者セクション | フル実装（バックエンド含む） | ユーザー要望。ユーザー検索アダプター新規作成が必要 |
| シナリオ検索モーダル | フル実装 | 既存 `searchScenarios` アダプター再利用で実現可能 |
| スマートフィルタ（PLが未プレイ等） | スコープ外 | プレイ履歴参照が必要で実装コスト高 |
| フォームカード | `bg.card` + `shadow: 'card.default'` + `rounded: '2xl'` + `maxW: '[720px]'` | モック準拠 + 既存セッション画面と一貫 |
| 入力フィールド | 既存 `Input` / `Textarea` コンポーネント使用 | `register()` 互換の `forwardRef` 実装済み |
| 数値入力 | 既存 `NumberInput`（Ark UI）+ `Controller` | `onValueChange` コールバック式のため |
| 初心者歓迎 | 既存 `Switch`（Ark UI）+ `Controller` | モックのトグルスイッチに合致 |
| 公開範囲 | 既存 `RadioGroup`（Ark UI）+ `Controller` | モックのラジオボタンに合致 |
| シナリオタブ | 既存 `Tabs`（Ark UI） | `variant: 'default'` がモックに近い |
| 検索モーダル | 既存 `Modal`（Ark UI Dialog） | `title` + `children` + `footer` 構成 |
| 招待メンバーの参加状態 | `CONFIRMED`（即確定） | 作成者が明示的に追加→承認フロー不要。既存 createSession パターンと一致 |
| 招待メンバーの役割 | `PLAYER` / `SPECTATOR` のみ | DB enum に合致。`KEEPER` は作成者専用。モックの "Sub GM" は将来対応 |
| 開催日時 | ラジオ切替（後で調整 / 日時を指定）+ 条件付き `datetime-local` | モック準拠 |
| 文字数カウンタ | `useWatch` で `sessionDescription` 監視 | `register` と干渉しない方法 |
| テスト方針 | 既存27テスト維持 + セレクタ更新 + 新機能テスト追加 | UIの変更に合わせて `getByRole` ベースのクエリに統一 |
| 下書き保存 | スコープ外（Phase 2 で対応） | モックに存在するがセッション作成の基本フローを優先 |

## 前提条件

- ブランチ: `feature/session-flow`
- 既存コンポーネント: `Input`, `Textarea`, `FormField`, `NumberInput`, `Switch`, `RadioGroup`, `Tabs`, `Modal`, `Button`, `IconButton`, `SystemBadge`, `Badge`, `Avatar` が `src/components/elements/` に存在
- 既存アダプター: `searchScenarios()` (`src/app/(main)/scenarios/adapter.ts`), `getAllSystems()` が利用可能
- `session_participants` テーブル: `session_id`, `user_id`, `participant_type`, `participant_status` カラムあり
- `users` テーブル: `user_id`, `user_name`, `nickname`, `image` カラムあり（検索対象）

---

## Batch 1: フォームUI基盤リデザイン

カード型レイアウト・4セクション分割（基本情報/参加者/シナリオ/日程・その他）・既存コンポーネント置換を行う。参加者セクション（Batch 2）とシナリオ選択（Batch 3）はプレースホルダーで配置。スキーマに `scheduleType` フィールドを追加。テストも同時更新。

**見積**: 7ファイル変更, ~320行

### Step 1-1. スキーマに scheduleType 追加

- **変更**: `src/app/(main)/sessions/new/schema.ts`
- `scheduleType` フィールドを追加（日程ラジオの状態管理用、`useState` 禁止ルール準拠）:
  ```typescript
  scheduleType: z.enum(['later', 'specify']).default('later')
  ```
- `SessionFormValues` 型に自動反映（`z.infer`）

### Step 1-2. フォームスタイル全面書き換え

- **変更**: `src/app/(main)/sessions/new/_components/styles.ts`
- 現在の全スタイル定義を削除し、モック準拠に置換:
  - `form`: カード型 (`bg: 'bg.card'`, `shadow: 'card.default'`, `rounded: '2xl'`, `maxW: '[720px]'`, `mx: 'auto'`, `p: '8'`)
  - `form_section`: `flex column`, `gap: '5'`
  - `form_sectionHeader`: アイコン + タイトル（`flex`, `items-center`, `gap 2`, `fontSize: 'lg'`, `fontWeight: 'bold'`, `color: 'text.title'`）
  - `form_sectionIcon`: `color: 'primary.default'`, `fontSize: 'xl'`
  - `form_divider`: `<hr>` スタイル（`border: 'none'`, `borderTop: '1px solid'`, `borderColor: 'border.subtle'`, `my: '6'`）
  - `form_charCount`: 文字数カウンタ（`textAlign: 'right'`, `fontSize: 'xs'`, `color: 'text.secondary'`）
  - `form_optionCard`: 初心者歓迎の背景帯（`bg: 'gray.50'`, `rounded: 'xl'`, `p: '4'`）
  - `form_scheduleRadio`: 日程ラジオグループのラッパー
  - `form_submitArea`: 送信ボタンエリア
  - 不要スタイル削除: `input`, `textarea`, `select`, `checkboxField`, `checkboxLabel`, `checkbox`, `radioGroup`, `radioLabel`, `radio`, `errorText`
- **変更**: `src/app/(main)/sessions/new/styles.ts`
  - `pageContainer` に `bg: 'bg.page'`, `minH: '100vh'`, `py: '8'` 追加

### Step 1-3. SessionForm コンポーネントリデザイン

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.tsx`
- ネイティブHTML要素を既存UIコンポーネントに置換し、セクション構造に再構成

**セクション1: 基本情報** (アイコン: `NoteBlank`)
  - `FormField` + `Input` で `sessionName`（`register` そのまま）
  - `FormField` + `Textarea` で `sessionDescription`（`register` そのまま）
  - `useWatch({ name: 'sessionDescription', control })` で文字数カウンタ表示（`aria-live="polite"` 付与でスクリーンリーダー対応）

**セクション2: 参加者**（Batch 2 で実装。ここでは空セクション + 「Batch 2で実装」コメント）

**セクション3: シナリオ**（Batch 3 で実装。ここでは `<input type="hidden" {...register('scenarioId')}>` + 空状態表示）

**セクション4: 日程・その他** (アイコン: `CalendarBlank`)
  - **開催日時**: スキーマに `scheduleType: z.enum(['later', 'specify']).default('later')` を追加し、`register('scheduleType')` + `RadioGroup` で管理。`watch('scheduleType')` が `'later'` の時は `datetime-local` を非表示 + `setValue('scheduledAt', null)`、`'specify'` の時は `Input type="datetime-local"` を表示
  - **使用ツール**: `FormField` + `Input`（`register` そのまま）
  - **追加募集人数**: `Controller` + `NumberInput`（`min: 0`, `max: 10`）
  - **初心者歓迎**: `Controller` + `Switch`（`form_optionCard` 内に配置）
  - **公開範囲**: `Controller` + `RadioGroup`（`items: [全体公開, フォロワーのみ]`）

**送信ボタン**: テキスト「セッションを作成」に変更

**React Hook Form 変更点**:
  - `register` 維持: `sessionName`, `sessionDescription`, `scheduledAt`, `tools`, `scenarioId`, `scheduleType`
  - `Controller` に変更: `recruitedPlayerCount`, `isBeginnerFriendly`, `visibility`
  - 追加: `useWatch` (control を `useForm` から取得、`scheduleType` と `sessionDescription` を監視)

### Step 1-4. ページヘッダー更新

- **変更**: `src/app/(main)/sessions/new/page.tsx`
- `<PageHeader>` を維持しつつ、title を「セッションを作成」に変更

### Step 1-5. テスト更新

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.test.tsx`
- UIコンポーネント変更に伴うセレクタ更新:

| テスト | 変更内容 |
|--------|---------|
| S101-01/02 | シナリオセクションのセレクタ更新（`getByLabelText(/シナリオ/i)` → セクション見出しテキスト検索）。S101-02 は Batch 3 まで `it.skip` |
| S102-01 | 送信ボタンテキスト: `/募集を投稿/i` → `/セッションを作成/i` |
| S102-02 | 「日時を指定」ラジオをクリック → `datetime-local` 表示 → 入力 のフローに変更 |
| S103-02 | `getByLabelText(/募集人数/i)` → `getByRole('spinbutton')` （NumberInput）。`toHaveValue(4)` → 文字列 `"4"` で検証 |
| FORM-04 | `getByLabelText(/初心者歓迎/i)` → `getByRole('checkbox')` （Switch の HiddenInput）。`toBeChecked()` は維持 |
| FORM-05 | `getByLabelText(/全体公開/i)` → `getByRole('radio', { name: /全体公開/i })`。`toBeChecked()` は維持 |
| FORM-06/S102-01/S103-01 | 送信ボタン `/募集を投稿/i` → `/セッションを作成/i` |
| FORM-08 | ローディングテキスト `/投稿中/i` → `/作成中/i` |
| 統合テスト | 人数入力を NumberInput の spinbutton 操作に変更 |

### Step 1-6. Storybook 更新

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx`
- 送信ボタンテキスト・ローディングテキストの更新反映
- 既存6バリアントは Props 互換なのでそのまま動作

### Review Checkpoint: Batch 1
- [ ] `pnpm check` 通過
- [ ] `pnpm vitest run "src/app/(main)/sessions/new"` 通過（skip 除く）
- [ ] `/review-diff` 実行（7ファイル, ~320行）→ 指摘修正 → コミット

---

## Batch 2: 参加者セクション

ユーザー検索機能を新規作成し、フォームにメンバー追加・役割設定UIを統合する。

**見積**: 8ファイル（新規3 + 変更5）, ~350行

### Step 2-1. スキーマ更新

- **変更**: `src/app/(main)/sessions/new/schema.ts`
- `recruitedPlayerCount` のバリデーションを `min(1)` → `min(0)` に変更（モック準拠: 0人 = 募集未開始）
- `invitedMembers` フィールドを追加:
  ```typescript
  invitedMembers: z.array(z.object({
    userId: z.string(),
    participantType: z.enum(['PLAYER', 'SPECTATOR']),
  })).default([])
  ```
- `SessionFormValues` 型に自動反映（`z.infer`）

### Step 2-2. ユーザー検索 Server Action

- **変更**: `src/app/(main)/sessions/new/actions.ts`
- `searchUsersAction(query: string)` を追加:
  - `query.length < 2` の場合は空配列を即座に返す（ユーザー列挙攻撃の防止）
  - `users` テーブルから `user_name` / `nickname` の部分一致で検索（`ilike`）
  - 戻り値: `Result<UserSummary[]>` (`UserSummary = { userId, userName, nickname, image }`)
  - 上限10件
  - 認証チェック含む

### Step 2-3. アダプター更新（参加者一括作成）

- **変更**: `src/app/(main)/sessions/new/adapter.ts`
- `createSession` 関数の引数に `invitedMembers` を追加
- セッション作成後、作成者（KEEPER）に加えて招待メンバーを `session_participants` に一括 INSERT:
  ```typescript
  const participantInserts = invitedMembers.map(m => ({
    session_id: gameSessionId,
    user_id: m.userId,
    participant_type: m.participantType,
    participant_status: ParticipantStatuses.CONFIRMED.value,
    applied_at: now, approved_at: now,
  }))
  ```
- 参加者 INSERT 失敗時のエラーハンドリング: INSERT が失敗した場合、作成済みセッションの削除（クリーンアップ）を実行し、Result の `err` で呼び出し元にエラーを返す

### Step 2-4. 参加者管理コンポーネント

- **新規**: `src/app/(main)/sessions/new/_components/MemberSearchInput.tsx`
  - Ark UI `Combobox` コンポーネントをベースにしたユーザー検索入力（WCAG 2.1 AA準拠の `role="combobox"` + `role="listbox"` パターンを自動提供）
  - `@` プレフィックスアイコン（`At` from Phosphor Icons）
  - `setTimeout` + `clearTimeout` パターンで 300ms デバウンス検索、`useTransition` は非同期処理のUI遷移にのみ使用
  - 検索結果をドロップダウン表示（`Avatar` + ニックネーム + ユーザー名）
  - 選択時に `onSelect(user: UserSummary)` コールバック
  - Props: `onSelect`, `excludeUserIds` (既に追加済みのユーザー + 自分自身の `userId` を除外。作成者は KEEPER として自動追加されるため)

- **新規**: `src/app/(main)/sessions/new/_components/MemberListItem.tsx`
  - `Avatar` + ニックネーム + ユーザー名 + 役割 `Select`/`RadioGroup` + 削除 `IconButton`
  - 役割選択: `PLAYER` / `SPECTATOR`
  - Props: `user: UserSummary`, `role: ParticipantType`, `onRoleChange`, `onRemove`

### Step 2-5. SessionForm に参加者セクション統合

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.tsx`
- セクション2「参加者」のプレースホルダーを実装に置換:
  - `useFieldArray({ control, name: 'invitedMembers' })` で動的配列管理
  - `MemberSearchInput` で検索 → `append({ userId, participantType: 'PLAYER' })`
  - `MemberListItem` のリストを `fields.map()` でレンダリング
  - `onRoleChange` → `update(index, { ...field, participantType })`
  - `onRemove` → `remove(index)`
- `onFormSubmit` に `invitedMembers` の正規化追加

- **変更**: `src/app/(main)/sessions/new/_components/styles.ts`
  - 参加者関連スタイル追加: `members_list`, `members_searchArea`, `members_item`

### Step 2-6. テスト追加

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.test.tsx`
- 参加者セクション関連テスト追加:
  - 参加者セクションが表示されること
  - メンバー追加・削除の基本動作（Action のモック化が必要）

### Review Checkpoint: Batch 2
- [ ] `pnpm check` 通過
- [ ] `pnpm vitest run "src/app/(main)/sessions/new"` 通過
- [ ] `/review-diff` 実行（~8ファイル, ~350行）→ 指摘修正 → コミット

---

## Batch 3: シナリオ選択機能

タブUI（検索して選ぶ / IDで指定 / URLで指定）、シナリオ検索モーダル、選択済みカード表示を実装する。

**見積**: 8ファイル（新規3 + 変更5）, ~400行

### Step 3-1. シナリオ選択用の型定義

- **変更**: `src/app/(main)/sessions/new/interface.ts`（ページレベルの型定義慣例に従い `_components/types.ts` ではなく `interface.ts` に配置）
- `ScenarioSummary`: 検索結果の軽量型（`scenarioId`, `name`, `systemName`, `minPlayers`, `maxPlayers`, `estimatedPlaytimeMin`, `estimatedPlaytimeMax`）
- `SelectedScenario`: 選択済みシナリオの表示情報

### Step 3-2. シナリオ検索 Server Action

- **変更**: `src/app/(main)/sessions/new/actions.ts`
- `searchScenariosForSessionAction(params: { scenarioName?: string; systemId?: string })` 追加
  - 既存 `searchScenarios()` (`src/app/(main)/scenarios/adapter.ts`) を内部で呼び出し
  - 結果を `ScenarioSummary[]` に変換して返却
- `getSystemsAction()` 追加: システム一覧取得

### Step 3-3. シナリオ選択済みカード

- **新規**: `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.tsx`
- 左ボーダー（`borderLeft: '4px solid'`, `borderLeftColor: 'primary.default'`）で強調
- `SystemBadge` + タイトル + メタ情報（人数 + 時間）
- 「変更」テキストリンク + 「削除」`IconButton`（`X`）
- Props: `scenario: ScenarioSummary`, `onClear`, `onChange`

### Step 3-4. シナリオ検索モーダル

- **新規**: `src/app/(main)/sessions/new/_components/ScenarioSearchModal.tsx`
- 既存 `Modal` コンポーネントをベースに構築
- **フィルターエリア**: `Input`（検索テキスト, 虫眼鏡アイコン）+ `Select`（システムフィルタ）
- **シナリオリスト**: 各行に名前 + `SystemBadge` + メタ + ラジオ選択
  - 選択行ハイライト: `bg: 'primary.subtleHover'`
- **フッター**: キャンセル `Button` + 「選択」`Button` (primary)
- **キーボード操作**: 矢印キー（↑↓）でリスト内のシナリオ移動、Enter で選択確定、Escape でモーダルを閉じる
- データ取得: `setTimeout` + `clearTimeout` パターンで 300ms デバウンス検索、`useTransition` は非同期処理のUI遷移にのみ使用
- Props: `open`, `onOpenChange`, `onSelect(scenario: ScenarioSummary)`, `systems`

### Step 3-5. SessionForm にシナリオ選択を統合

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.tsx`
- Props に `systems?: ScenarioSystem[]` 追加
- セクション3「シナリオ」のプレースホルダーを実装に置換:
  - `Tabs`（`defaultValue: 'search'`）:
    - タブ1「検索して選ぶ」: 未選択時 → 空状態（アイコン + 「シナリオを検索」ボタン）、選択時 → `ScenarioSelectedCard`
    - タブ2「IDで指定」: `Input` で ULID 直接入力（`register('scenarioId')`）
    - タブ3「URLで指定」: disabled（「準備中」表示）
  - `ScenarioSearchModal` の `onSelect` で `setValue('scenarioId', id)` + ローカル状態更新
  - `ScenarioSelectedCard` の `onClear` で `setValue('scenarioId', null)` + 状態クリア

- **変更**: `src/app/(main)/sessions/new/page.tsx`
  - `getAllSystems()` 呼び出し追加、`SessionFormContainer` に `systems` 渡す
- **変更**: `src/app/(main)/sessions/new/_components/SessionFormContainer.tsx`
  - `systems` props 中継

- **変更**: `src/app/(main)/sessions/new/_components/styles.ts`
  - シナリオ関連スタイル追加: `scenario_emptyState`, `scenario_selectedCard`, `scenario_modalItem`, `scenario_modalFilters`

### Step 3-6. テスト更新

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.test.tsx`
  - S101-01 更新: タブUIが表示されること
  - S101-02 のスキップ解除: 「シナリオを検索」ボタンが存在すること

### Review Checkpoint: Batch 3
- [ ] `pnpm check` 通過
- [ ] `pnpm vitest run "src/app/(main)/sessions/new"` 通過
- [ ] `/review-diff` 実行（~8ファイル, ~400行）→ 指摘修正 → コミット

---

## Batch 4: テスト強化・Storybook・最終統合

新コンポーネントのテストと Storybook を整備し、ビルド確認で全体を検証する。

**見積**: 9ファイル（新規6 + 変更3）, ~350行

### Step 4-1. 新コンポーネントテスト

- **新規**: `src/app/(main)/sessions/new/_components/ScenarioSearchModal.test.tsx`
  - モーダルの開閉テスト
  - 検索入力でアクションが呼ばれること（モック化）
  - シナリオ選択 → 「選択」ボタンで onSelect コールバック
  - キーボード操作テスト（矢印キー移動、Enter選択、Escape閉じる）

- **新規**: `src/app/(main)/sessions/new/_components/MemberSearchInput.test.tsx`
  - 検索入力 → デバウンス後にアクションが呼ばれること
  - 検索結果からユーザーを選択 → onSelect コールバック
  - `excludeUserIds` に含まれるユーザーが結果に表示されないこと
  - Combobox のキーボード操作（Ark UI 提供）

### Step 4-2. Storybook 整備

- **変更**: `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx`
  - `Default` に `systems` モックデータ追加
  - `WithScenario` 更新: 選択済みシナリオデータを追加
  - 新規ストーリー: `WithMembers`（参加者追加済み状態）

- **新規**: `src/app/(main)/sessions/new/_components/ScenarioSearchModal.stories.tsx`
  - `Default`: 空状態
  - `WithResults`: 検索結果あり
  - `WithSelection`: 選択済み状態

- **新規**: `src/app/(main)/sessions/new/_components/MemberSearchInput.stories.tsx`
  - `Default`: 初期状態
  - `WithResults`: 検索結果表示

- **新規**: `src/app/(main)/sessions/new/_components/MemberListItem.stories.tsx`
  - `Player`: プレイヤー役割
  - `Spectator`: 観戦者役割

### Step 4-3. スキーマテスト更新

- **変更**: `src/app/(main)/sessions/new/__tests__/schema.test.ts`
  - `invitedMembers` フィールドのバリデーションテスト追加

### Step 4-4. 最終統合確認

- `pnpm check` 通過
- `pnpm vitest` 全テスト通過
- `pnpm build` 通過

### Review Checkpoint: Batch 4（最終レビュー）
- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 全テスト通過
- [ ] `pnpm build` 通過
- [ ] `/review-diff` 実行 → 指摘修正 → コミット

---

## ファイル一覧

### 新規ファイル

| ファイル | Batch | 用途 |
|---------|-------|------|
| `src/app/(main)/sessions/new/_components/MemberSearchInput.tsx` | 2 | ユーザー検索コンボボックス（Ark UI Combobox） |
| `src/app/(main)/sessions/new/_components/MemberListItem.tsx` | 2 | メンバーカード（役割選択付き） |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.tsx` | 3 | シナリオ選択済みカード |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.tsx` | 3 | シナリオ検索モーダル |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.test.tsx` | 4 | シナリオ検索テスト |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.stories.tsx` | 4 | シナリオ検索Storybook |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.test.tsx` | 4 | メンバー検索テスト |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.stories.tsx` | 4 | メンバー検索Storybook |
| `src/app/(main)/sessions/new/_components/MemberListItem.stories.tsx` | 4 | メンバーリストStorybook |

### 変更ファイル

| ファイル | Batch | 変更内容 |
|---------|-------|---------|
| `src/app/(main)/sessions/new/_components/styles.ts` | 1,2,3 | フォームスタイル全面書き換え + セクション追加 |
| `src/app/(main)/sessions/new/styles.ts` | 1 | ページ背景 `bg.page` 追加 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | 1,2,3 | セクション構造化 + コンポーネント置換 + 機能統合 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | 1,2,3 | セレクタ更新 + 新機能テスト追加 |
| `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx` | 1,4 | ストーリー更新・追加 |
| `src/app/(main)/sessions/new/page.tsx` | 1,3 | ヘッダー変更 + systems データ取得 |
| `src/app/(main)/sessions/new/_components/SessionFormContainer.tsx` | 3 | systems props 中継 |
| `src/app/(main)/sessions/new/interface.ts` | 3 | シナリオ選択関連型定義（`ScenarioSummary`, `SelectedScenario`） |
| `src/app/(main)/sessions/new/schema.ts` | 1,2 | `scheduleType` 追加 + `recruitedPlayerCount` min(0) + `invitedMembers` 追加 |
| `src/app/(main)/sessions/new/adapter.ts` | 2 | 参加者一括作成追加 |
| `src/app/(main)/sessions/new/actions.ts` | 2,3 | ユーザー検索 + シナリオ検索アクション追加 |
| `src/app/(main)/sessions/new/__tests__/schema.test.ts` | 4 | `invitedMembers` バリデーションテスト |

### 再利用する既存コンポーネント・関数

| 対象 | パス | 用途 |
|------|------|------|
| `Input` | `src/components/elements/input/` | テキスト入力（`register()` 互換 forwardRef） |
| `Textarea` | `src/components/elements/textarea/` | 複数行入力 |
| `FormField` | `src/components/elements/form-field/` | ラベル + エラー + ヒント |
| `NumberInput` | `src/components/elements/number-input/` | 増減ボタン付き数値入力 |
| `Switch` | `src/components/elements/switch/` | トグルスイッチ |
| `RadioGroup` | `src/components/elements/radio-group/` | ラジオボタングループ |
| `Tabs` | `src/components/elements/tabs/` | タブ切り替え |
| `Modal` | `src/components/elements/modal/` | Ark UI Dialog ベースモーダル |
| `Button` | `src/components/elements/button/` | 各種バリアント |
| `IconButton` | `src/components/elements/button/` | アイコンボタン |
| `Avatar` | `src/components/elements/avatar/` | ユーザーアバター |
| `SystemBadge` | `src/components/elements/system-badge/` | システム識別バッジ |
| `FieldError` | `src/components/elements/field-error/` | エラーメッセージ |
| `searchScenarios` | `src/app/(main)/scenarios/adapter.ts` | シナリオ検索（既存） |
| `ParticipantTypes` | `src/db/enum.ts` | 参加者役割 enum |
| `ParticipantStatuses` | `src/db/enum.ts` | 参加者状態 enum |

## 検証方法

### 自動テスト

```bash
# ユニットテスト（各Batch後に実行）
pnpm vitest run "src/app/(main)/sessions/new"

# Lint + Format
pnpm check

# ビルド確認（Batch 4 で実行）
pnpm build
```

### 手動テスト

- [ ] フォームがカード型レイアウトで表示されること（白背景、影、角丸）
- [ ] 4セクション（基本情報/参加者/シナリオ/日程・その他）が `<hr>` で分割されていること
- [ ] セッション名・募集文の入力とバリデーションエラー表示
- [ ] 募集文の文字数カウンタ（0/500）が正しく動作すること
- [ ] メンバー検索：@入力 → 検索結果表示 → 選択 → リストに追加
- [ ] メンバー役割変更（プレイヤー/観戦者）と削除が動作すること
- [ ] シナリオ検索モーダル：開閉、テキスト検索、システムフィルタ、選択
- [ ] シナリオ選択済みカード：システムバッジ、タイトル、メタ情報、変更・削除
- [ ] タブ切り替え（検索/ID指定/URL指定）が動作すること
- [ ] 「後で調整」/「日時を指定」のラジオ切り替えで datetime-local の表示・非表示
- [ ] NumberInput（追加募集人数）の ± ボタンが動作すること
- [ ] Switch（初心者歓迎）のトグルが動作すること
- [ ] RadioGroup（公開範囲）の切り替えが動作すること
- [ ] 全項目入力 → 「セッションを作成」で送信成功（参加者含む）
- [ ] キーボード操作（Tab/Enter/Escape）が全要素で機能すること
