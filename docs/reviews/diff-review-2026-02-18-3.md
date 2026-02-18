# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-18）
> **反映内容**: 必須 2件 + 推奨 15件 + 検討 8件（スキップ: 必須#4）

> **レビュー日時**: 2026-02-18
> **対象範囲**: HEAD (91e112a) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 84 files (+2113/-904 lines tracked, 58 untracked)
> **総合評価**: C
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッションフロー機能の大規模実装。セッション詳細ページ（`sessions/[id]`）配下に、参加申請管理・日程調整・日程回答・日程集計の各サブページと、対応する Server Actions / Adapter / Schema / UI コンポーネントを新規追加。既存のセッション一覧・参加者管理のアダプタも大幅に拡張し、DBマイグレーション（RLS含む）・テスト・E2Eテストも追加。

### 変更ファイル（主要）

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/[id]/page.tsx` | +54 | -54 | 変更 |
| `src/app/(main)/sessions/adapter.ts` | +69 | -69 | 変更 |
| `src/app/(main)/sessions/participantAdapter.ts` | +202 | -202 | 変更 |
| `src/app/(main)/sessions/interface.ts` | +48 | -48 | 変更 |
| `src/db/enum.ts` | +19 | - | 変更 |
| `src/db/helpers.ts` | +6 | - | 変更 |
| `src/db/types.ts` | +92 | - | 変更 |
| `src/styles/semanticTokens.ts` | +3 | - | 変更 |
| `src/app/(main)/sessions/[id]/adapter.ts` | 新規 | - | 新規 |
| `src/app/(main)/sessions/[id]/actions.ts` | 新規 | - | 新規 |
| `src/app/(main)/sessions/[id]/schema.ts` | 新規 | - | 新規 |
| `src/app/(main)/sessions/[id]/_components/*.tsx` | 新規 | - | 新規(14files) |
| `src/app/(main)/sessions/[id]/applications/**` | 新規 | - | 新規 |
| `src/app/(main)/sessions/[id]/schedule/**` | 新規 | - | 新規 |
| `src/components/blocks/ScheduleCalendar/**` | 新規 | - | 新規 |
| `supabase/migrations/0004_session_flow_schema.sql` | 新規 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

ファイル命名、Import順序、`any`禁止、`console.log`禁止（LogTape使用）、Phosphor Icons/ssr、スタイル分離、Zodスキーマ分離、セマンティックHTML、`export const`/`export default function` の使い分けなど、主要な規約に概ね準拠している。ただし `as` 型アサーションの多用、英語コメントの混在、Props型名の不一致（`_currentUserId`）などの違反を検出。

### 2. 設計・保守性 WARN

`page.tsx` / `adapter.ts` / `interface.ts` / `actions.ts` / `schema.ts` / `styles.ts` の責務分離が徹底されており、Result型パターン、`isNil`、楽観的更新などのプロジェクトパターンが一貫して適用されている。一方、`getSessionDetail` の250行超の肥大化、`SessionPhase`型のSSoT違反、`applications/page.tsx` の二重認証チェック、`SessionActions.getAvailableActions` の複雑な条件分岐などの設計課題がある。

### 3. セキュリティ WARN

全 Server Action で認証・認可チェックが統一的に実施されており、RLS ポリシー、Zodバリデーション、IDORチェックなどセキュリティ基盤は堅牢。ただし `confirm_schedule` RPC の `SECURITY DEFINER` に認可ロジック未搭載、`.or()` での文字列補間、`candidateId` の長さ制約なしなど改善の余地あり。

### 4. パフォーマンス WARN

Server Component でのデータフェッチと `Promise.all` による並列取得は概ね適切。しかし `getSessionTimeline` と `getSessionDetail` の重複クエリ、`getApplications` / `getApplicationStats` の同一テーブル二重アクセス、Schedule系ページでの逐次クエリなどの非効率がある。

### 5. UX・アクセシビリティ WARN

Ark UI によるフォーカストラップ、`role="alert"` でのエラー表示、WAI-ARIA 属性の適切な使用、ローディングスケルトン、Phosphor Icons など良好な点が多い。ただしロールバッジのコントラスト比不足（WCAG 1.4.3）、戻るリンクのフォーカスリング未定義（WCAG 2.4.7）、ナビゲーション目的のボタン実装など是正すべき問題がある。

### 6. バグ・ロジックエラー WARN

楽観的ロック、フェーズ遷移バリデーション、WITHDRAWN ユーザーの再申請フローなどロジックは概ね堅牢。Props型名の不一致（`_currentUserId`）によるビルドエラーの可能性、認証チェック順序の不統一、完了タイムラインの `updated_at` 依存など対処すべき問題がある。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | コーディング規約 / バグ | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:31` | Props型定義の `_currentUserId` と呼び出し側 `SessionDetailContent.tsx:72` の `currentUserId` が不一致。ビルド/型エラーの原因 | Props型を `currentUserId: string \| null` に修正する。内部で未使用なら型から削除するか、デストラクチャリングで `_` プレフィックスを付ける |
| 2 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/styles.ts:294-307` | `participants_rolePlayer`（`badge.playerBg` = `blue.500`）と `participants_roleKeeper`（`primary.default`）に白テキスト配置。10pxフォントでWCAG 1.4.3（4.5:1）未達の可能性大 | `blue.700` / `primary.700` 等のより暗い背景色に変更するか、テキスト色を暗いトーンに変更 |
| 3 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/styles.ts:13-24` | `backLink` に `_focusVisible` フォーカスリングが未定義。WCAG 2.4.7 違反 | `_focusVisible: { outline: 'focusRing', outlineOffset: '[2px]' }` を追加 |
| 4 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/applications/styles.ts:13-24` | `approval_backLink` にも `_focusVisible` 未定義。WCAG 2.4.7 違反 | 同上 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 5 | セキュリティ | `src/app/(main)/sessions/[id]/adapter.ts:323` | `updateSessionMemo` の `.or()` にユーザーIDを文字列補間。Action側の `isSessionManager` と二重管理で将来のインジェクションリスク | Action レイヤーの認可チェックに一元化し `.or()` 条件を削除 |
| 6 | セキュリティ | `supabase/migrations/0004_session_flow_schema.sql:74` | `confirm_schedule` RPC が `SECURITY DEFINER` で定義されているが関数内に認可チェックなし | RPC 内に `auth.uid()` を使った呼び出し元検証を追加 |
| 7 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/actions.ts:476` | `updateSessionPhaseAction` でフェーズ値バリデーションが認証チェックより先。同ファイルの他アクションと順序不統一 | 認証→認可→バリデーションの順序に統一 |
| 8 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/adapter.ts:289` | `getSessionTimeline` の完了イベントで `session.updated_at` を使用。メモ更新等で上書きされ不正確になる | `completed_at` カラムを追加し完了時に記録（TODO記載済み） |
| 9 | コーディング規約 | `src/app/(main)/sessions/[id]/actions.ts:53` | `NOTE:` コメントが英語で記述（日本語推奨） | 日本語コメントに変換 |
| 10 | 設計・保守性 | `src/app/(main)/sessions/[id]/adapter.ts:28-170` | `getSessionDetail` が250行超で単一責任原則に違反。複数の変換ロジックが混在（TODO記載済み） | `transformParticipants` 等のヘルパー関数に分離 |
| 11 | 設計・保守性 | `src/app/(main)/sessions/[id]/applications/page.tsx:36-47` | `createClient().auth.getUser()` と `getCurrentUserId()` の二重認証呼び出し | `getCurrentUserId()` のみに統一 |
| 12 | 設計・保守性 | `src/app/(main)/sessions/interface.ts:119-124` | `SessionPhase` 型が独自定義。`Database['public']['Enums']['session_phase']` から導出すべき（SSoT違反） | Supabase生成型から導出 |
| 13 | コーディング規約 | `src/app/(main)/sessions/[id]/adapter.ts:63-64` | `as Array<Record<string, unknown>>` 等の広い型キャストが複数箇所 | `camelCaseKeys` の型定義改善でキャスト削減 |
| 14 | パフォーマンス | `src/app/(main)/sessions/[id]/adapter.ts:182-305` | `getSessionTimeline` が `getSessionDetail` と重複するDB クエリを実行 | タイムライン生成に必要なデータを `getSessionDetail` の戻り値から抽出する設計に変更 |
| 15 | パフォーマンス | `src/app/(main)/sessions/[id]/applications/adapter.ts:49-135` | `getApplications` と `getApplicationStats` が同一テーブルを二重アクセス | `getApplications` の結果からカウントを算出して統合 |
| 16 | パフォーマンス | `src/app/(main)/sessions/[id]/schedule/page.tsx:40-52` | セッション名取得と `getScheduleCandidates` が逐次実行 | `Promise.all` でまとめる |
| 17 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CancelApplicationDialog.tsx:100-104` | サーバーエラー表示にアイコンなし（他ダイアログと不一致） | `WarningCircle` アイコン追加 |
| 18 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CompleteSessionDialog.tsx:124-126` | 同上 | 同上 |
| 19 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/schedule/_components/ScheduleContent.tsx:161-165` 他 | ナビゲーション目的の「キャンセル」「戻る」ボタンが `router.push()` の `<Button onClick>` で実装。セマンティック的には `<Link>` であるべき | `<Link>` 要素または `<Button as={Link}>` に変更 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 20 | セキュリティ | `src/app/(main)/sessions/[id]/schedule/schema.ts:33` | `candidateId` に長さ・形式制約なし | `z.string().length(26)` でULID形式を強制 |
| 21 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/page.tsx:50` | WITHDRAWN ユーザーの再申請可能動作について意図を示すコメントなし | コメントで意図を明文化 |
| 22 | 設計・保守性 | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:57-183` | `getAvailableActions` がロール×フェーズ×ステータスの複雑な条件分岐 | ロールごとのアクション決定関数に分離 |
| 23 | 設計・保守性 | `src/app/(main)/sessions/[id]/_components/ParticipantCard.tsx:59-90` | `renderCharacterSheetStatus` がインライン関数定義 | 別コンポーネントに切り出す |
| 24 | コーディング規約 | `src/app/(main)/sessions/[id]/schedule/_components/ScheduleContent.tsx:41-73` | 日程候補送信が React Hook Form でなく `useState` + 手動 submit | `useForm` 導入（非標準入力のため任意） |
| 25 | コーディング規約 | `src/components/blocks/ScheduleCalendar/ScheduleCalendar.tsx:51-83` | `PreviousMonthButton`/`NextMonthButton` が同一ファイル内に定義 | `_components/` への分離を検討 |
| 26 | パフォーマンス | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:233-261` | 全5ダイアログが常時マウント | `open` が false 時に null を返す実装に変更 |
| 27 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/schedule/summary/_components/ScheduleSummaryContent.tsx:169` | `<CaretDown>` アイコンに `aria-hidden="true"` なし | `aria-hidden="true"` を追加 |

## 良い点

- 全 Server Action で `getCurrentUserId()` による認証と `isSessionManager()` による認可が統一的に実施されている
- Result型（`ok`/`err`）パターンが全 Adapter/Actions で一貫して使用されている
- `ramda` の `isNil` が全ての null/undefined チェックで統一使用されている
- `@phosphor-icons/react/ssr` からの統一インポート、絵文字の不使用
- LogTape によるログ出力が徹底されており `console.log` の混入なし
- `page.tsx` / `adapter.ts` / `actions.ts` / `schema.ts` / `styles.ts` の責務分離が徹底
- Server Component と Client Component の分離が適切で、不要な `'use client'` なし
- `page.tsx` の主要データフェッチで `Promise.all` による並列取得を一貫実装
- `loading.tsx` による Suspense ローディングが各ページに実装
- 全ダイアログが Ark UI の Modal を使用しフォーカストラップ・Escape クローズを保証
- WAI-ARIA 属性（`role="alert"`, `aria-pressed`, `role="tablist"` 等）の適切な使用
- `VALID_TRANSITIONS` によるフェーズ遷移の宣言的な許可マップ定義
- Zod スキーマの `schema.ts` への分離と `z.infer` による型導出の統一
- 楽観的更新（`useOptimistic` + `useTransition`）の正しい実装
- RLS ポリシーが `schedule_candidates` / `schedule_responses` テーブルに設定済み
- セマンティック HTML（`<section>`, `<aside>`, `<main>`, `<details>/<summary>` 等）の適切な活用

## 総合所見

セッションフロー機能として大規模な実装であり、プロジェクトの規約・パターンへの準拠度は高い。セキュリティ基盤（認証・認可・RLS・バリデーション）、エラーハンドリング（Result型）、UX（楽観的更新・ローディング・ARIA）の各面で成熟した実装がなされている。

必須修正は4件で、いずれも小規模な修正で対応可能：Props型名の不一致修正（ビルドエラー防止）、ロールバッジのコントラスト比改善、2箇所のフォーカスリング追加。推奨の15件は、重複クエリの統合、認証順序の統一、型のSSoT準拠など、品質向上のための改善。必須修正を完了すればマージ可能な状態になる。
