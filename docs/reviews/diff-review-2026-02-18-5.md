# コード差分レビュー

> **レビュー日時**: 2026-02-18
> **対象範囲**: HEAD (91e112a) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 85 files（tracked: 27, untracked: 58）
> **総合評価**: D
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッションフロー機能の大規模実装。セッション詳細画面、参加申請管理、日程調整、日程回答、日程集計の各ページと、それらに必要なServer Actions、アダプター、スキーマ、UIコンポーネント群を新規追加。既存のセッション一覧・参加者管理のアダプターとテストも大幅にリファクタリングされている。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/[id]/page.tsx` | +55 | -0 | 変更 |
| `src/app/(main)/sessions/[id]/actions.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/adapter.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/schema.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/styles.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/loading.tsx` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/_components/*.tsx` (14 files) | - | - | 新規 |
| `src/app/(main)/sessions/[id]/applications/**` (7 files) | - | - | 新規 |
| `src/app/(main)/sessions/[id]/schedule/**` (16 files) | - | - | 新規 |
| `src/app/(main)/sessions/adapter.ts` | +71 | -0 | 変更 |
| `src/app/(main)/sessions/interface.ts` | +58 | -0 | 変更 |
| `src/app/(main)/sessions/participantAdapter.ts` | +237 | -0 | 変更 |
| `src/app/(main)/sessions/new/adapter.ts` | +23 | -0 | 変更 |
| `src/db/enum.ts` | +19 | -0 | 変更 |
| `src/db/helpers.ts` | +6 | -0 | 変更 |
| `src/db/types.ts` | +95 | -0 | 変更 |
| `src/lib/supabase/transform.ts` | +18 | -0 | 新規 |
| `src/styles/semanticTokens.ts` | +4 | -0 | 変更 |
| `src/components/blocks/ScheduleCalendar/**` (3 files) | - | - | 新規 |
| `supabase/migrations/0004_session_flow_schema.sql` | - | - | 新規 |
| テストファイル (12 files) | - | - | 新規/変更 |
| 設定・ドキュメント (8 files) | - | - | 変更 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に規約遵守は良好。`@phosphor-icons/react/ssr`、LogTape、PandaCSSセマンティックトークン、Result型、`isNil`等の規約に従っている。ただし `actions.ts` にマジックストリング `'WITHDRAWN'` が残存しており、また `_components/` 配下のコンポーネント用スタイルがページレベルの `styles.ts` に混在している。

### 2. 設計・保守性 WARN

SRP、型安全性、ディレクトリ構造は概ね適切。`toRecord`/`toRecordArray`ヘルパーの導入、`buildSessionTimeline`の純粋関数化、Result型の一貫使用は良好。一方で`isSessionManager`の不使用箇所、`as`キャストの残存、未使用propsの存在が確認された。

### 3. セキュリティ WARN

全Server Actionsで認証・認可チェックが適切に実施されており、RLSポリシーも設定済み。SQLワイルドカードエスケープやIDOR防止も適切。ただしDBクエリでWITHDRAWN参加者のデータがアプリケーション層まで到達する点と、characterSheetSchemaでの空文字列許可に改善の余地がある。

### 4. パフォーマンス WARN

`Promise.all`による並列取得、JOINクエリによるN+1防止、`useMemo`/`useCallback`の適切な使用が確認された。`session_participants(*, users(*))`の過剰フェッチと、`ScheduleContent`の`syncDatesToForm`のメモ化不足が改善点。

### 5. UX・アクセシビリティ WARN

Ark UI Modalのフォーカストラップ、`role="alert"`、`aria-live`、`aria-label`の付与、ARIAタブパターン実装、スケルトンUIの`aria-busy`等は良好。しかしフォーカスリング未定義箇所（シナリオ名リンク、日程回答の戻るリンク）と、`CompleteSessionDialog`のサーバーエラー表示に`role="alert"`が欠落しているWCAG違反がある。

### 6. バグ・ロジックエラー WARN

エラーハンドリングの改善と楽観的ロックの実装は良好。ただし`confirmScheduleAction`のフェーズ検証欠如、`approveApplication`のWITHDRAWN状態チェック欠如、`cancelSession`の二重認可クエリ等のロジック上の問題が確認された。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | コーディング規約準拠 | `src/app/(main)/sessions/[id]/actions.ts:211` | `'WITHDRAWN'` をマジックストリングでハードコード。他箇所は `ParticipantStatuses.WITHDRAWN.value` を使用しており不整合 | `ParticipantStatuses.WITHDRAWN.value` に置換 |
| 2 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CompleteSessionDialog.tsx:124` | サーバーエラー表示の div に `role="alert"` がなく、スクリーンリーダーがエラーを認識できない（WCAG 4.1.3） | `<div className={styles.dialog_serverError} role="alert">` を追加 |
| 3 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/styles.ts:180` | `info_scenarioName`（シナリオ名リンク）に `_focusVisible` によるフォーカスリングが未定義（WCAG 2.4.7） | `_focusVisible: { outline: 'focusRing', outlineOffset: '[2px]' }` を追加 |
| 4 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/schedule/respond/_components/styles.ts:13` | `backLink` スタイルに `_focusVisible` が定義されておらずフォーカス表示が欠落（WCAG 2.4.7） | セッション詳細の `backLink` と同様に `_focusVisible: { outline: 'focusRing', outlineOffset: '[2px]' }` を追加 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 5 | セキュリティ / パフォーマンス | `src/app/(main)/sessions/[id]/adapter.ts:117` | DBクエリで`session_participants`の全ステータス・`users`の全カラムを取得後にアプリ層でフィルタ。WITHDRAWN参加者データの不要な転送と過剰フェッチ | クエリに `.neq('participant_status', 'WITHDRAWN')` を追加し、`users(user_id, user_name)` に絞る |
| 6 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/adapter.ts:326` | `if (note)` は空文字 `''` を falsy 扱いするため、`completion_note` を空文字で更新する経路が塞がれている | `if (note !== undefined)` に変更 |
| 7 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CancelSessionDialog.tsx:106` | サーバーエラー表示の `WarningCircle` アイコンに `aria-hidden="true"` がなく他ダイアログと不統一 | `<WarningCircle size={16} weight="fill" aria-hidden="true" />` |
| 8 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CompleteSessionDialog.tsx:113` | `CheckCircle` アイコンに `aria-hidden="true"` が未付与でスクリーンリーダーが重複情報を読み上げる | `aria-hidden="true"` を追加 |
| 9 | 設計・保守性 | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:233` | `currentUserId` を props で受け取りながら `_currentUserId` として未使用で破棄 | Props定義と引数から削除 |
| 10 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/schedule/actions.ts:147` | `confirmScheduleAction` にセッションフェーズ検証がなく、完了済み・キャンセル済みセッションで日程確定RPCが実行可能 | フェーズ確認を追加し `RECRUITING` 以外は `err()` を返す |
| 11 | 設計・保守性 | `src/app/(main)/sessions/[id]/schedule/adapter.ts:72,74` | `as Record<string, unknown>` キャストを使用。同プロジェクトの `toRecord` ヘルパーが未適用 | `toRecord(candidate)` / `toRecordArray(...)` を使用 |
| 12 | パフォーマンス | `src/app/(main)/sessions/[id]/schedule/_components/ScheduleContent.tsx:61` | `syncDatesToForm` が `useCallback` なしで定義され、毎レンダリングで新参照が生成 | `useCallback` でラップ |
| 13 | 設計・保守性 | `src/app/(main)/sessions/[id]/schedule/summary/page.tsx:37-39` | `isSessionManager` を使わず独自に `keeper_id === currentUserId \|\| created_by_id === currentUserId` を実装。他ページと不整合 | `isSessionManager(id, currentUserId)` に置換 |
| 14 | コーディング規約準拠 | `src/app/(main)/sessions/[id]/styles.ts:603-669` | `_components/` のコンポーネント用スタイルがページレベルの `styles.ts` に混在。`_components/styles.ts` が別途存在する | コンポーネント固有スタイルは `_components/styles.ts` に移動 |
| 15 | バグ・ロジックエラー | `src/app/(main)/sessions/participantAdapter.ts:207` | `approveApplication` は `WITHDRAWN` 状態の申請を承認可能（`CONFIRMED` チェックのみ） | `WITHDRAWN` チェックを追加 |
| 16 | バグ・ロジックエラー | `src/app/(main)/sessions/participantAdapter.ts:462` | `cancelSession` 内の `isSessionManager` が呼び出し元 `cancelSessionAction` と二重実行 | `cancelSession` 側を削除し Action 層のみに一本化 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 17 | 設計・保守性 | `src/app/(main)/sessions/[id]/_components/ParticipantCard.tsx:52-91` | `CharacterSheetStatus` が同ファイル内にサブコンポーネントとして定義（1ファイル1コンポーネント原則） | 分離するか、小規模で外部利用なしのため許容する方針を統一 |
| 18 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/ParticipantCard.tsx:123` | ロールバッジ（GM/PL/観）に `aria-label` がない。直下の roleLabel が補足しているため実用上は問題なし | バッジに `aria-label={roleLabel}` を追加 |
| 19 | コーディング規約準拠 | `src/app/(main)/sessions/[id]/actions.ts:323-350` | `cancelApplicationAction` の `_data: CancelApplicationValues` が未使用（スキーマが空オブジェクト） | シグネチャを単純化するかスキーマに意味あるフィールドを追加 |
| 20 | 設計・保守性 | `src/app/(main)/sessions/[id]/adapter.ts:147-158` | `as SessionDetail` のキャストが必要。コメントで理由は説明済みだが型安全性が不完全 | キャストを排除できる型変換ヘルパーの設計を検討 |
| 21 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/adapter.ts:236` | `buildSessionTimeline` の日時ソートで無効な日時が `NaN` になるとソート順が不定 | `Number.isNaN` チェックまたは無効日時の除外を追加 |
| 22 | パフォーマンス | `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.tsx:89` | `optimisticPendingCount` と `optimisticConfirmedCount` を別々の `filter` で計算（2回走査） | `useMemo` でまとめて算出 |
| 23 | セキュリティ | `src/app/(main)/sessions/[id]/schema.ts:38` | `characterSheetSchema` で空文字列 `''` を `.or(z.literal(''))` で許可し DB に保存される経路がある | 空文字を `null` に変換する `z.preprocess` を追加 |
| 24 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/schedule/adapter.ts:132` | `submitScheduleResponse` のコメントが全候補回答に一律適用される設計 | 仕様として意図的であれば JSDoc に明記 |
| 25 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/schedule/respond/_components/ScheduleResponseContent.tsx:148` | 凡例セクションの記号（○△×）がスクリーンリーダーで「マル」等と読まれる可能性 | 記号に `aria-hidden="true"` を付与 |

## 良い点

- 全 Server Actions で `getCurrentUserId()` + `isSessionManager()` による認証・認可チェックが一貫して実施されている
- `searchPublicSessions` の ilike クエリで `%`/`_` のエスケープ処理が追加され、SQLワイルドカードインジェクションを適切に防止
- `confirm_schedule` RPC に DB レベルの認可チェックを含め、アプリケーション層との二重防衛を実現
- `expected_updated_at` による楽観的ロックで同時更新競合を検知
- `Result<T>` 型パターンが全 adapter 関数で一貫して使用されており、エラーの型安全な伝搬を保証
- `SessionPhase` 型が `Database['public']['Enums']['session_phase']` から導出され、型のSSoT化が適切
- `ParticipantStatuses.WITHDRAWN` の追加と `enum.ts`/`types.ts`/`helpers.ts` への反映が一貫
- `toRecord`/`toRecordArray` ヘルパーにより `as Record<string, unknown>` キャストを共通化する設計が良好
- `buildSessionTimeline` が追加DBクエリなしの純粋関数として分離され、テスタビリティと N+1 防止を両立
- `page.tsx` で `Promise.all` による並列データ取得を一貫して実施
- `getSessionDetail` の単一JOINクエリで全リレーションを取得するパフォーマンス設計
- `ApplicationApprovalContent` のフィルタータブが ARIA Authoring Practices 準拠のキーボードナビゲーション（矢印キー・Home・End）を実装
- `loading.tsx` のスケルトン UI に `aria-busy="true"` + `sr-only` テキストを付与し非視覚ユーザーに対応
- `useOptimistic` + `useTransition` による楽観的更新パターンが react-rules.md に正確に従っている
- Zod スキーマ + `z.infer` による型導出が TypeScript ルールの SSoT 原則に準拠
- `@phosphor-icons/react/ssr` の統一使用により SSR 環境でのエラーを回避

## 総合所見

セッションフロー機能の大規模実装として、アーキテクチャの一貫性、型安全性、アクセシビリティの取り組みは全体的に高水準。特に認証・認可の多層防御、Result型の一貫使用、ARIA対応の充実度は優れている。

必須修正は4件で、いずれも局所的な修正（マジックストリング置換、`role="alert"` 追加、フォーカスリング追加）で対応可能。推奨修正ではWITHDRAWN参加者のDBフィルタリングと`confirmScheduleAction`のフェーズ検証追加を優先的に対応すべき。
