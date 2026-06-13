# セッションフロー実装 実装レビュー

> **反映ステータス**: 反映済み（2026-02-18）
> **反映内容**: 必須 14件（自動3件 + 確認付き11件） + 推奨 18件 + 検討 3件

> **レビュー日時**: 2026-02-18
> **対象計画**: `docs/plans/session-flow.md`
> **計画充足度**: 80% (35/44 Steps)
> **サービス品質**: C
> **レビューモード**: パラレル（3エージェント） → コンテキスト再構成

## サマリー

44ステップ・6バッチの大規模セッションフロー実装のうち、35ステップが計画通りに完了（80%充足度）。Server Actions・Adapter・スキーマ・UIコンポーネントの主要実装は計画通りに完成しており、サービスとしての基本フローは動作可能な状態。ただし、堅牢性レビューにより**セキュリティ上の重要な問題**（IDOR脆弱性2件、WITHDRAWN参加者の日程回答送信可能）と**エラーハンドリングの欠陥**（DB書き込みエラーの黙殺6箇所）が検出された。テストカバレッジ（adapter/actionsのユニットテスト不足）と合わせ、必須修正が8件あり、これらの対処後にリリース可能な水準となる。

---

## Part A: 計画充足度

### Batch 1: DB・型定義の基盤整備

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 1-1 | マイグレーションSQL作成 | DONE | `0004_session_flow_schema.sql` にENUM, テーブル, FK, RPC, RLSポリシーを定義 |
| 1-2 | `helpers.ts` に型追加 | DONE | `ScheduleCandidateRow`, `SessionLinkRow` 等を追加 |
| 1-3 | `enum.ts` に定数追加 | DONE | `ScheduleCandidateStatuses`, `ParticipantStatuses.WITHDRAWN` 等を追加 |
| 1-4 | `participantAdapter.ts` 全関数実装 | DONE | `applyToSession`, `approveApplication`, `rejectApplication`, `withdrawFromSession`, `cancelApplication`, `cancelSession`, `isSessionManager` |
| 1-5 | `adapter.ts` の WITHDRAWN 除外 | DONE | 4関数すべてに `.neq('participant_status', 'WITHDRAWN')` フィルタ追加 |
| 1-6 | `interface.ts` に統合型追加 | DONE | `SessionDetail`, `TimelineEvent`, `ScheduleCandidateWithResponses` 等 |

### Batch 2: セッション詳細ページ

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 2-1 | `[id]/adapter.ts` 作成 | DONE | `getSessionDetail`, `getSessionTimeline`, `updateSessionMemo`, リンクCRUD, キャラクターシートURL更新 |
| 2-2 | `[id]/schema.ts` 作成 | DONE | 8スキーマ定義。`cancelSessionSchema` に「キャンセル」入力の二重確認を独自追加 |
| 2-3 | Server Actions 作成 | DONE | 10アクション。フェーズ遷移バリデーション・楽観的ロック付き |
| 2-4 | `[id]/page.tsx` 作成 | DONE | Server Component、Promise.all並列取得、3段階ロール判定 |
| 2-5 | `[id]/styles.ts` 作成 | DONE | 790行、PandaCSSセマンティックトークン使用 |
| 2-6 | `SessionDetailContent` 作成 | DONE | 2カラムグリッド、セクション分割、ロール別表示制御 |
| 2-7 | 各セクションコンポーネント作成 | DONE | `BasicInfoSection`, `ParticipantsSection`, `GMNotesSection`, `ToolsSection`, `TimelineSection` |
| 2-8 | adapter ユニットテスト | PARTIAL | `schema.test.ts` は充実（322行）。`adapter.test.ts` は未実装 |

### Batch 3: 参加申請承認フロー

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 3-1 | `applications/adapter.ts` 作成 | DONE | `getApplications`, `getApplicationStats`, `getSessionBasicInfo` |
| 3-2 | `applications/actions.ts` 作成 | DONE | `approveApplicationAction`, `rejectApplicationAction` |
| 3-3 | `applications/page.tsx` 作成 | DONE | Server Component、認可チェック付き |
| 3-4 | `applications/styles.ts` 作成 | DONE | |
| 3-5 | `ApplicationApprovalContent` 作成 | DONE | 統計表示 + 申請カード一覧 |
| 3-6 | `ApplicationCard` 作成 | DONE | 承認/拒否ボタン付き |
| 3-7 | `ApplicationFilters` 作成 | PARTIAL | コンポーネント未実装（フィルタリングは `ApplicationApprovalContent` 内に簡易実装の可能性あり） |
| 3-8 | Storybook 作成 | DONE | `SessionDetailContent.stories.tsx` に4ストーリー（Default, AsParticipant, AsGuest, Empty） |
| 3-9 | adapter/actions テスト | MISSING | テストファイルなし |

### Batch 4: 日程調整機能

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 4-1 | `schedule/adapter.ts` 作成 | DONE | `createScheduleCandidates`, `getScheduleCandidates`, `submitScheduleResponse`, `confirmSchedule`（RPC）, `getScheduleSummary` |
| 4-2 | `schedule/schema.ts` 作成 | PARTIAL | `timeSetting` フィールド（"batch" \| "individual"）が未実装。`scheduleCandidateSchema`, `scheduleCandidatesFormSchema`, `scheduleResponseSchema` は完成 |
| 4-3 | `schedule/actions.ts` 作成 | DONE | `createCandidatesAction`, `submitResponseAction`, `confirmScheduleAction` |
| 4-4 | `ScheduleCalendar` コンポーネント | DONE | `src/components/blocks/ScheduleCalendar/` に実装 |
| 4-5 | `schedule/page.tsx` 作成 | DONE | GM専用ページ、認可チェック付き |
| 4-6 | `ScheduleContent` 作成 | DONE | 日程候補選択UI |
| 4-7 | `schedule/respond/page.tsx` 作成 | DONE | 参加者回答ページ |
| 4-8 | `schedule/summary/page.tsx` 作成 | DONE | 集計表示ページ |
| 4-9 | テスト・Storybook | PARTIAL | `schedule/__tests__/schema.test.ts` は充実（128行）。adapter/actionsテスト・Storybookは未実装 |

### Batch 5: ライフサイクル操作ダイアログ

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 5-1 | `SessionActions` コンポーネント | DONE | `getAvailableActions` でフェーズ×ロール×ステータスからアクション算出 |
| 5-2 | `ParticipationRequestDialog` | DONE | Ark UI Dialog、RHF+Zod |
| 5-3 | `WithdrawDialog` | DONE | |
| 5-4 | `CancelSessionDialog` | DONE | 「キャンセル」入力の二重確認 |
| 5-5 | `CompleteSessionDialog` | DONE | 楽観的ロック付き |
| 5-6 | `CancelApplicationDialog` | PARTIAL | `withdrawSchema.reason` が計画では必須（200文字）だが、実装では任意（500文字）。`completeSessionSchema.note` の上限も計画500文字→実装1000文字に変更 |
| 5-7 | ダイアログテスト | MISSING | テストファイルなし |

### Batch 6: 統合・テスト

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 6-1 | `new/adapter.ts` 修正 | DONE | `created_by_id: userId` 追加 |
| 6-2 | ホーム画面モック更新 | DONE | `_mocks.ts` 更新 |
| 6-3 | ビルド検証 | PARTIAL | ビルド通過は未確認（前セッションで lint エラー修正済み） |
| 6-4 | E2Eテスト作成 | PARTIAL | `e2e/auth/session-flow.spec.ts` として実装（計画の `e2e/sessions/` とはパス相違）。Page Object `session-detail-page.ts` 作成済み。axeビルダーによるa11yテスト含む。ただしフィクスチャ不足（単一ユーザーのみ） |
| 6-5 | 一括テスト実行 | DONE | schema.test.ts が存在し実行可能 |

### 計画レビュー指摘の対応状況

| # | 指摘事項 | 対応状態 |
|---|---------|---------|
| 1 | `confirmSchedule()` のアトミック性保証 | 対応済 — RPC関数で実装 |
| 2 | `created_by_id` マイグレーション安全策 | 対応済 — 段階的DDLで実装 |
| 3 | 辞退後の再申請処理 | 対応済 — WITHDRAWN→PENDING復帰実装 |
| 4 | WITHDRAWN除外Step | 対応済 — adapter.tsの4関数にフィルタ追加 |
| 5 | 辞退理由の必須/任意統一 | 部分対応 — 計画では「必須・200文字」だが実装は「任意・500文字」 |

---

## Part B: サービス品質

### B1. エラーハンドリング WARN

**良い点**:
- 全Adapter関数が`Result<T>`型を返却し、Server Actionsは一貫してtry-catch + `err()/ok()` パターンを使用
- Zodバリデーションが全Server Actionで実行
- `isNil`によるnullチェックが適切
- `confirmSchedule`はRPC関数によりDB側でアトミック性を保証

**問題点**:
- **`participantAdapter.ts` の全DB書き込み操作でエラーを無視**: `applyToSession`・`approveApplication`・`rejectApplication`・`withdrawFromSession`・`cancelApplication`・`cancelSession` の `.update()`/`.insert()`/`.delete()` の返却値 `{ error }` を受け取っていない。DB書き込みが失敗しても `ok()` が返る
- **`new/adapter.ts` の `createSession`**: KEEPER参加者のinsert結果を検査していない
- **`adapter.ts`（sessions）の `getUpcomingSessions`/`getHistorySessions`/`getCalendarSessions`**: `session_participants` の初回クエリの `error` を検査していない
- **`submitResponseAction`**: 辞退済み（WITHDRAWN）ユーザーの参加チェックで `.neq('participant_status', 'WITHDRAWN')` が抜けており、辞退者がスケジュール回答を送信可能

### B2. エッジケース・空状態 WARN

**良い点**:
- `ParticipantsSection` に空状態表示あり（「まだ参加者はいません」）
- Storybook の `Empty` ストーリーで0件状態をカバー
- WITHDRAWN参加者の除外が全クエリで実装済み
- `cancelSession` に COMPLETED/CANCELLED 状態チェックあり
- `getSessionTimeline` 失敗時のソフトフォールバック（空配列）
- Zodスキーマで文字数上限を適切に設定

**懸念点**:
- Timeline・ToolsSection の空状態UIが未確認（0件時の表示が「何もない」状態になる可能性）
- `getSessionDetail` で keeper/creator 取得失敗時、creator は `err` を返すが keeper は `null` で続行（非対称）
- `searchPublicSessions` でユーザー入力の `scenarioName` を `%${params.scenarioName}%` のままSQLに渡している。`%` や `_` を含む入力で過剰マッチが発生する
- `schedule_responses` に紐づくユーザーが存在しない場合に `{ userId: '', userName: '' }` というダミー値を挿入しており、空IDが下流に伝播するリスクがある
- `getSessionTimeline` で `session.updated_at` をセッション完了日時として使用しているが、完了以外の更新でも変化するため正確でない可能性がある

### B3. ローディング・Suspense WARN

**良い点**:
- `page.tsx` で `Promise.all` による並列データ取得（3クエリ同時実行）
- `applications/page.tsx` でも `Promise.all` 使用
- ダイアログ群（CancelSessionDialog, WithdrawDialog, CompleteSessionDialog, ParticipationRequestDialog）は全て `useTransition` でペンディング状態を管理し、ローディングテキスト付きボタンで視覚フィードバックを実現
- `ApplicationApprovalContent.tsx` で `useOptimistic` + `useTransition` を正しく組み合わせた楽観的更新が実装済み

**懸念点**:
- `loading.tsx` ファイルが全サブディレクトリに存在しない。データ取得中はブラウザが白画面になる
- Suspense境界なし。セッション詳細は複数のDBクエリを含むため、ストリーミングレンダリングが望ましい
- `SessionDetailContent.tsx` がインタラクティブ処理を持たない純粋レイアウトコンポーネントにもかかわらず `'use client'` が付いており、子コンポーネント群がクライアントバンドルに含まれる
- `ParticipantsSection.tsx`、`GMNotesSection.tsx` も表示専用だが不要な `'use client'` が付与
- `ApplicationCard.tsx` の承認/拒否ハンドラが `startTransition` を経由せず直接 `async` 呼び出し。`useTransition` の中断可能性が活かせていない

### B4. セキュリティ WARN

**良い点**:
- 全ページで認証チェック実施（`getCurrentUserId` / `auth.getUser`）
- 全Server Actionsで `isSessionManager` による認可チェック
- `sessionLinkSchema` で URL を `http://` or `https://` に制限（`javascript:` XSS 防止）
- フェーズ遷移の `validatePhaseTransition` による不正遷移防止
- `completeSessionAction`・`updateSessionPhaseAction` で楽観的ロック実装
- `cancelSessionSchema` に「キャンセル」入力の二重確認（破壊的操作の保護）
- URLバリデーションで `z.string().url()` に加えて `startsWith('http://')` チェックで `javascript:` プロトコルを防止

**問題点（IDOR脆弱性）**:
- **`upsertSessionLink`**: `linkId` が任意文字列で渡され、そのリンクが当該セッションに属するか検証していない。悪意あるクライアントが別セッションの `linkId` を指定してリンクを上書きできる
- **`confirmScheduleAction`**: `candidateId` がそのセッションに属するか検証していない。別セッションの候補IDを指定して確定操作ができる可能性がある（RPC内部で制御されているかは未確認）
- **`submitResponseAction`**: 辞退済み（WITHDRAWN）ユーザーがスケジュール回答を送信可能（WITHDRAWN フィルタ欠如）

**軽微な懸念**:
- `applications/page.tsx` がローカルに `checkIsSessionManager` を再定義しており、認可ロジックの二重管理で将来の不整合リスク
- `schedule/page.tsx` も同様にインライン認可チェック
- `sessionLinkSchema` の `linkId` が `z.string().optional()` で形式チェックなし

### B5. パフォーマンス WARN

**良い点**:
- `getSessionDetail` で Supabase の nested select を活用した1クエリ取得
- Server Component でのデータ取得（クライアントバンドルへの影響最小）
- `Promise.all` による並列データ取得
- `BasicInfoSection.tsx`, `ParticipantCard.tsx`, `TimelineSection.tsx`, `ToolsSection.tsx` はクライアント宣言なしで正しく Server Component として動作
- ユーザー画像はアイコン代用のため `next/image` 最適化の問題は顕在化していない

**懸念点**:
- `getSessionDetail`（L65-94）内で keeper/creator を計2回の追加クエリで取得（N+1パターン）。Supabase のリレーション JOIN（`creator:users!fkey(...)`）で1クエリにまとめられる
- `getSessionTimeline` で3つの別クエリ（session, participants, schedule）を実行
- `React.cache()` によるリクエスト内重複排除が未使用
- 参加者一覧・タイムラインにページネーションなし（大量データ時のパフォーマンス劣化リスク）
- `SessionDetailContent.tsx`、`ParticipantsSection.tsx`、`GMNotesSection.tsx` に不要な `'use client'` が付いており、クライアントバンドルサイズを不必要に増大させている

### B6. アクセシビリティ WARN

**良い点**:
- E2Eテストに `@axe-core/playwright` によるa11yチェック含む
- `aria-label="その他のメニュー"` 等、適切なARIA属性
- `aria-hidden="true"` での装飾アイコンの非読み上げ
- セマンティックHTML使用: `<main>`, `<header>`, `<aside>`, `<section>`, `<ul>`/`<li>`
- Ark UI Dialog のフォーカストラップ・Escapeクローズ活用
- `ParticipationRequestDialog.tsx` で文字数カウンターに `aria-live="polite"` + `<span className="sr-only">` を実装（細部まで配慮）
- `ScheduleCalendar.tsx` のナビゲーションボタンに `aria-label="前の月"` / `aria-label="次の月"` を設定
- `ApplicationCard.tsx` の承認/拒否ボタンに `aria-label` でユーザー名を含む説明を付与
- `ScheduleResponseContent.tsx` の回答ボタンに `aria-pressed` でトグル状態を正しく伝達
- フェーズバッジは色 + テキストラベルの併用で、色だけに依存していない
- 外部リンク（`ToolsSection.tsx`）に `rel="noopener noreferrer"` を設定

**問題点**:
- **タブUIのARIA不備**: `ApplicationApprovalContent.tsx` で `role="tablist"` + `role="tab"` + `aria-selected` は設定済みだが、`tabpanel` に `role="tabpanel"` と `aria-controls` / `aria-labelledby` が未設定。スクリーンリーダーがタブの制御対象を識別できない
- **textarea のラベル未関連付け**: `ScheduleResponseContent.tsx` の `<textarea>` に `<label>` 要素が関連付けられていない（`id` も `htmlFor` もなし）
- **フォーカスリング欠落**: `applications/styles.ts` の `approval_filterTabActive` に `_focusVisible` の定義がなく、アクティブタブにフォーカスリングが表示されない

**懸念点**:
- a11yテストで `color-contrast` ルールを無効化しており、コントラスト比の検証が不完全
- 見出し階層: `<h1>` セッション名の下に各セクションが `<span>` 要素でタイトル表示されており、スクリーンリーダーから見出しとして認識されない
- ダイアログのエラー表示で `role="alert"` が不整合: `ParticipationRequestDialog.tsx` では設定済みだが、`CancelSessionDialog.tsx`、`WithdrawDialog.tsx`、`CancelApplicationDialog.tsx`、`CompleteSessionDialog.tsx` では未設定
- `ParticipationRequestDialog.tsx` のラジオボタンで `<label>` 包含と `aria-label` が重複し、スクリーンリーダーの二重読み上げリスクがある

### B7. テストカバレッジ NG

**存在するテスト**:
- `[id]/__tests__/schema.test.ts`: 322行、全8スキーマの正常系・異常系・境界値を網羅
- `schedule/__tests__/schema.test.ts`: 128行、3スキーマの正常系・異常系・境界値を網羅
- `SessionDetailContent.stories.tsx`: 4ストーリー（Default, AsParticipant, AsGuest, Empty）
- `e2e/auth/session-flow.spec.ts`: 178行、作成→詳細→サブページ遷移→ダイアログ→a11yの基本フロー

**不足しているテスト**:
- `[id]/adapter.ts` のユニットテスト（getSessionDetail, getSessionTimeline 等 7関数）
- `schedule/adapter.ts` のユニットテスト（5関数）
- `participantAdapter.ts` のユニットテスト（既存テストファイルはあるが新規関数のテスト追加が必要か要確認）
- Server Actions のユニットテスト（認可チェック・バリデーション・フェーズ遷移の異常系）
- `ScheduleCalendar` の Storybook
- `ApplicationApprovalContent` の Storybook
- 日程調整サブページの Storybook

### B8. プロジェクト規約準拠 WARN

**良い点**:
- `@phosphor-icons/react/ssr` からの import（Server Component互換）を全ファイルで徹底
- `getAppLogger(['app', 'sessions'])` によるLogTapeロガー使用（`console` 不使用）
- `styles.ts` へのスタイル分離が全ページ・コンポーネントで実施
- PandaCSSセマンティックトークン使用（スケジュール関連ページを除き徹底）
- アロー関数 + `export const` によるコンポーネント定義
- `export default function` は Next.js の `page.tsx` のみ
- Result型パターンの一貫した使用
- `isNil` による null/undefined チェック
- React Hook Form + Zod でフォーム管理（`useState` でフォーム状態管理なし）
- スタイル命名が `コンポーネント名_要素名` 形式で統一（例: `info_phaseRecruiting`, `participants_csSubmittedBadge`）

**問題点**:
- **`bg: 'white'` のハードコード**: `schedule/styles.ts`（3箇所）、`schedule/respond/_components/styles.ts`（3箇所）、`schedule/summary/_components/styles.ts`（2箇所）で `bg: 'white'` が直接記述。`styling-rules.md` の「ハードコードされた値を直接スタイルに書かない」規定に違反
- **`SessionActions.tsx` に `'use client'` ディレクティブなし**: `useState` を使用しているが `'use client'` が未記述。親の Client Component 経由で動作はするが規約上の逸脱
- **`ParticipationRequestDialog.styles.ts`**: 他コンポーネントは全て `styles.ts` に集約しているが、このファイルのみコンポーネント名付きファイル名を採用。命名規則が不統一
- **`ApplicationCard.tsx` の楽観的更新パターン逸脱**: `react-rules.md` の `useOptimistic + useTransition` パターンではなく、`useState(false)` で `isPending` を手動管理
- **`applications/page.tsx` の二重認証チェック**: `createClient()` と `getCurrentUserId()` の両方で認証。`getCurrentUserId()` が既に認証を内包しているなら冗長
- **`ScheduleResponseContent.tsx` で生の `<textarea>` 使用**: 他コンポーネントでは `Textarea` 共通コンポーネントを使用しており一貫性がない

---

## 改善提案

### 必須（リリース前に対処すべき）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part B | `participantAdapter.ts` | `applyToSession`・`approveApplication`・`rejectApplication`・`withdrawFromSession`・`cancelApplication`・`cancelSession` のDB書き込み操作で `{ error }` を受け取らず、失敗しても `ok()` を返す | 各書き込み操作を `const { error } = await supabase...` で受け取り、`if (error) return err(new Error(error.message))` を追加 |
| 2 | Part B | `[id]/actions.ts` | `upsertLinkAction` → `upsertSessionLink` 内で `linkId` が当該セッションに属するか検証していない（**IDOR脆弱性**）。他セッションのリンクを上書きできる | `linkId` 指定時に更新前に `session_id` 一致確認クエリを追加 |
| 3 | Part B | `schedule/actions.ts` | `confirmScheduleAction` で `candidateId` が対象 `sessionId` に属するか検証していない（**IDOR脆弱性**） | `confirmSchedule` 内でRPC呼び出し前に `candidate_id` と `session_id` の一致確認を追加 |
| 4 | Part B | `schedule/actions.ts` | `submitResponseAction` の参加者チェックで `.neq('participant_status', 'WITHDRAWN')` がなく、辞退済みユーザーがスケジュール回答を送信可能 | 参加者チェッククエリに `.neq('participant_status', 'WITHDRAWN')` を追加 |
| 5 | Part B | `new/adapter.ts` | `createSession` でKEEPER参加者のinsertのエラーを検査していない。セッション作成成功だが参加者レコード失敗でも成功が返る | `const { error: participantError } = ...` でエラーハンドリング追加 |
| 6 | Part B | `applications/page.tsx` | `checkIsSessionManager` をローカル再定義。`participantAdapter.ts` の共有関数と認可ロジックが二重管理 | `isSessionManager` を import して使用し、ローカル関数を削除 |
| 7 | Part B | `[id]/page.tsx` 他 | `loading.tsx` が存在せず、データ取得中に白画面になる | `[id]/loading.tsx` にスケルトンUIを追加。`schedule/`, `applications/` にも同様 |
| 8 | Part A | `schedule/schema.ts` | `timeSetting` フィールドが計画にあるが未実装 | 計画から削除するか実装するか判断 |
| 9 | Part B | `schedule/styles.ts` | `bg: 'white'` が3箇所にハードコード（L46, L110, L173）。`styling-rules.md` 違反 | `bg: 'bg.card'` または適切なセマンティックトークンに置き換え |
| 10 | Part B | `schedule/respond/_components/styles.ts` | `bg: 'white'` が3箇所にハードコード（L46, L70, L164）。`styling-rules.md` 違反 | `bg: 'bg.card'` に統一 |
| 11 | Part B | `schedule/summary/_components/styles.ts` | `bg: 'white'` が2箇所にハードコード（L56, L172）。`styling-rules.md` 違反 | `bg: 'bg.card'` に統一 |
| 12 | Part B | `ApplicationApprovalContent.tsx` | タブUIの `tabpanel` に `role="tabpanel"` と `aria-controls` / `aria-labelledby` が未設定。スクリーンリーダーがタブの制御対象を識別できない | 申請カードグリッドラッパーに `role="tabpanel"` と対応する `id`・`aria-labelledby` を追加 |
| 13 | Part B | `ScheduleResponseContent.tsx` | `<textarea>` にフォームラベル未関連付け（`id` / `<label htmlFor>` なし） | textarea に `id` を付与し `<label htmlFor>` で関連付け、または `aria-label` を設定 |
| 14 | Part B | `applications/styles.ts` | `approval_filterTabActive` に `_focusVisible` スタイルがなく、アクティブタブにフォーカスリングが表示されない | `_focusVisible: { outline: 'focusRing', outlineOffset: '[2px]' }` を追加 |

### 推奨（対応が望ましい）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part B | `adapter.ts`（sessions） | `getUpcomingSessions`/`getHistorySessions`/`getCalendarSessions` で `session_participants` 初回クエリの `error` を検査していない | `const { data, error } = ...` で受け取り、`if (error) return err(...)` 追加 |
| 2 | Part B | `adapter.ts`（sessions） | `searchPublicSessions` でユーザー入力 `scenarioName` をSQLの `ilike` にそのまま渡しており、`%` や `_` で過剰マッチ | サニタイズ関数で `%` と `_` をエスケープしてから渡す |
| 3 | Part A | `[id]/schema.ts` | `withdrawSchema.reason` が計画では必須（200文字）、実装では任意（500文字） | 計画と実装の乖離を解消。UX観点では任意が妥当な場合は計画を更新 |
| 4 | Part B | `schedule/page.tsx` | 認可チェックがインライン実装 | `isSessionManager` を import して使用 |
| 5 | Part B | `[id]/adapter.ts` | keeper/creator を別クエリで取得（+2 DB呼び出し） | メインクエリの join に含めるか `React.cache()` で重複排除 |
| 6 | Part A | 複数ファイル | adapter/actions のユニットテストが未実装 | 主要関数の正常系・異常系テストを追加 |
| 7 | Part B | 各ダイアログ | Server Action 実行中に `useTransition` 未使用 | `useTransition` + `useOptimistic` で操作中のUI状態を管理 |
| 8 | Part B | `[id]/adapter.ts` | `schedule_responses` にユーザーが存在しない場合に `{ userId: '', userName: '' }` ダミー値を挿入。空IDが下流に伝播するリスク | `null` を返すか型を `user: ... \| null` に変更 |
| 9 | Part B | `e2e/auth/session-flow.spec.ts` | a11yテストで `color-contrast` を無効化 | コントラスト問題を修正し、ルールを有効化 |
| 10 | Part B | `SessionActions.tsx` | `useState` を使用しているが `'use client'` ディレクティブが存在しない | ファイル先頭に `'use client';` を追加 |
| 11 | Part B | `ParticipationRequestDialog.styles.ts` | `styles.ts` ではなく `ParticipationRequestDialog.styles.ts` という命名。他コンポーネントと不統一 | `styles.ts` に改名し import パスを更新 |
| 12 | Part B | `ApplicationCard.tsx` | `useState(false)` で `isPending` を手動管理。`react-rules.md` の `useOptimistic + useTransition` パターンと異なる | `useTransition` を使用し、楽観的更新は親の `useOptimistic` に委ねる設計に統一 |
| 13 | Part B | `_components/` | 計画された `ParticipationRequestDialog.stories.tsx` が存在しない | 参加タイプ選択・メッセージあり/なし・エラー状態をストーリー化 |
| 14 | Part B | `applications/_components/` | 計画された `ApplicationApprovalContent.stories.tsx` が存在しない | 申請あり/なし・フィルタータブの各状態をストーリー化 |
| 15 | Part B | `SessionDetailContent.tsx` | インタラクティブ処理を持たない純粋レイアウトコンポーネントに不要な `'use client'`。子コンポーネント群がクライアントバンドルに含まれる | `'use client'` を削除し、`SessionActions`（インタラクティブ）のみ Client Component として分離 |
| 16 | Part B | `ParticipantsSection.tsx` | 表示専用コンポーネントに不要な `'use client'` | `'use client'` を削除して Server Component に変更 |
| 17 | Part B | `GMNotesSection.tsx` | 表示専用コンポーネントに不要な `'use client'` | `'use client'` を削除して Server Component に変更 |
| 18 | Part B | 4ダイアログ（CancelSession, Withdraw, CancelApplication, CompleteSession） | サーバーエラー表示に `role="alert"` なし。`ParticipationRequestDialog` では対応済みで不整合 | 各ダイアログの `dialog_serverError` div に `role="alert"` を追加 |
| 19 | Part B | `ParticipationRequestDialog.tsx` | `<label>` で包んだ `<input type="radio">` に重複 `aria-label` があり二重読み上げリスク | `<input>` の `aria-label` 属性を削除（`<label>` 包含で十分） |

### 検討（余裕があれば）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part A | `_components/` | `ApplicationFilters` コンポーネントが未実装 | ステータスフィルタリングUIを追加（申請数が少ない間は不要の可能性） |
| 2 | Part B | `[id]/adapter.ts` | `getSessionTimeline` で3つの別クエリを実行 | 単一クエリに統合するか、結果をキャッシュ |
| 3 | Part B | `[id]/adapter.ts` | `getSessionTimeline` で `session.updated_at` を完了日時として使用。完了以外の更新でも変化する | `completed_at` カラム追加、または明示コメント追加 |
| 4 | Part B | 各コンポーネント | セクション見出しが `<span>` で実装されている | `<h2>`, `<h3>` のセマンティック見出しに変更 |
| 5 | Part A | 各Storybook | `ScheduleCalendar`, `ApplicationApprovalContent` のStorybookなし | Storybookストーリーを追加 |
| 6 | Part B | 複数ファイル | 参加者リスト・タイムラインにページネーションなし | 大量データ対応として検討 |
| 7 | Part B | `e2e/auth/session-flow.spec.ts` | 複数ユーザーフロー（PL→申請→GM承認→PL日程回答）がE2E未検証 | テストユーザー2つ用意し、完全フローのE2Eテストを追加 |
| 8 | Part B | `ScheduleResponseContent.tsx` | L161で生の `<textarea>` 要素を使用。`Textarea` 共通コンポーネントとの一貫性なし | `Textarea` 共通コンポーネントに置き換え |
| 9 | Part B | `[id]/adapter.ts` | `camelCaseKeys(data as Record<string, unknown>) as SessionDetail` の型アサーションが型安全性を損なう | 必要フィールドのみ明示的に組み立てる構造に変更 |

## 良い点

- **Result型の一貫した使用**: 全adapter関数・Server Actionsで統一されたエラーハンドリングパターン
- **`isSessionManager` による統合認可**: `keeper_id || created_by_id` チェックで、GM未定セッションでも作成者が管理操作可能
- **WITHDRAWN のソフトデリートパターン**: 物理削除ではなくステータス変更 + 辞退理由保存で、再申請フローを自然にサポート
- **`getAvailableActions` 関数**: フェーズ × ロール × ステータスの3軸でアクション算出する宣言的な設計。テスト容易性が高い
- **`cancelSessionSchema` の二重確認**: 「キャンセル」文字入力による破壊的操作の保護（計画では「検討」だった項目を積極的に実装）
- **`confirmSchedule` RPC関数**: 計画レビュー指摘のアトミック性問題をDB側RPC関数で解決
- **楽観的ロック**: `completeSessionAction`, `updateSessionPhaseAction` で `updated_at` ベースの競合検出
- **E2Eテストの Page Object パターン**: `SessionDetailPage` クラスでテストの保守性を確保
- **Storybook の Empty ストーリー**: 空状態のビジュアル検証を含む
- **PandaCSS セマンティックトークンの徹底**: 790行の `styles.ts` で全UIパーツにトークン適用（`badge.successBg`, `chip.labelBg`, `card.default/hover` 等）
- **スキーマテストの境界値検証**: ちょうど上限・上限+1 のテスト、エラーメッセージ文字列の検証まで含む高品質なテスト
- **スタイル命名の統一**: `コンポーネント名_要素名` 形式（`info_phaseRecruiting`, `participants_csSubmittedBadge`）で可読性が高い
- **LogTape の完全適用**: 全 adapter/actions で `console.log` 汚染なし
- **`aria-live="polite"` の適切な使用**: `ParticipationRequestDialog.tsx` の文字数カウンターでスクリーンリーダー通知を実装
- **`aria-pressed` によるトグル状態**: `ScheduleResponseContent.tsx` の回答ボタンで正しく設定
- **外部リンクのセキュリティ**: `ToolsSection.tsx` で全リンクに `rel="noopener noreferrer"` を設定

## 総合所見

セッションフロー機能の主要実装は80%の計画充足度で、サービスの基本フローは動作可能な状態。Result型パターン、フェーズ遷移制御、RPC関数によるアトミック操作、`aria-live` / `aria-pressed` の適切な使用など、アーキテクチャとアクセシビリティの基盤設計は高い水準にある。一方、3つの並列レビューグループにより以下の重要な問題が検出された: (1) **セキュリティ**: IDOR脆弱性2件とWITHDRAWNフィルタ欠如、(2) **堅牢性**: participantAdapter.tsの6関数でDB書き込みエラーを黙殺、(3) **規約準拠**: `bg: 'white'` ハードコード8箇所、(4) **アクセシビリティ**: タブUIのARIA不備、textarea ラベル欠如、フォーカスリング欠落、(5) **テストカバレッジ**: adapter/actionsのユニットテスト不足。必須修正14件を対処した後、推奨19件を段階的に改善することでリリース可能な水準になる。特に不要な `'use client'` の除去（推奨15-17）はクライアントバンドルサイズの削減に直結するため早期対応が望ましい。
